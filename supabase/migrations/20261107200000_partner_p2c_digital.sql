-- PASHOVE — P2c : revente et affiliation des produits numériques et services
--
-- Le miroir ne stocke JAMAIS le fichier ni la durée du service. Le droit de
-- téléchargement de l'acheteur pointe vers le fichier du produit source, et la
-- réservation reprend la durée de la source. Le partenaire ne voit que la
-- fiche (titre, image, prix).
--
-- Les miroirs numériques n'ayant pas de `digital_file_id`, la contrainte de
-- type est assouplie pour eux uniquement.

alter table public.products drop constraint if exists products_type_fields;
alter table public.products
  add constraint products_type_fields check (
    source_product_id is not null
    or (
      product_type = 'physical'
      and stock_quantity is not null
      and digital_file_id is null
      and duration_minutes is null
      and service_location is null
    )
    or (
      product_type = 'digital'
      and stock_quantity is null
      and weight_grams is null
      and digital_file_id is not null
      and duration_minutes is null
      and service_location is null
    )
    or (
      product_type = 'service'
      and stock_quantity is null
      and weight_grams is null
      and digital_file_id is null
      and duration_minutes is not null
      and service_location is not null
    )
  );

-- Supprimer un miroir est sûr : `order_items.product_id` est en SET NULL et
-- les instantanés de commande sont conservés. On ne détache plus, car un
-- miroir numérique détaché n'aurait aucun fichier et violerait la contrainte.

create or replace function public.partner_delete_mirrors_on_source_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if OLD.source_product_id is not null then
    return OLD;
  end if;

  delete from public.products where source_product_id = OLD.id;
  return OLD;
end;
$$;

create or replace function public.partner_offer_delete_mirrors()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.products where partner_offer_id = OLD.id;
  return OLD;
end;
$$;

create or replace function public.add_partner_listing(
  p_offer_id uuid,
  p_store_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer   public.partner_offers%rowtype;
  v_source  public.products%rowtype;
  v_store   public.stores%rowtype;
  v_id      uuid;
  v_slug    text;
  v_base    text;
  v_try     integer := 0;
begin
  if not public.has_store_role(
    p_store_id,
    array['owner', 'admin', 'product_manager']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select * into v_offer
  from public.partner_offers
  where id = p_offer_id
    and active;

  if v_offer.id is null then
    raise exception 'partner_offer_unavailable' using errcode = '22023';
  end if;

  if v_offer.store_id = p_store_id then
    raise exception 'partner_own_store' using errcode = '22023';
  end if;

  select * into v_source
  from public.products
  where id = v_offer.product_id
    and status = 'published';

  if v_source.id is null then
    raise exception 'partner_product_unavailable' using errcode = '22023';
  end if;

  select * into v_store
  from public.stores
  where id = v_offer.store_id
    and status = 'active';

  if v_store.id is null then
    raise exception 'partner_store_unavailable' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.product_variants v where v.product_id = v_source.id
  ) then
    raise exception 'partner_no_variants' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.products p
    where p.store_id = p_store_id
      and p.source_product_id = v_source.id
  ) then
    raise exception 'partner_already_listed' using errcode = '22023';
  end if;

  v_base := left(v_source.slug, 52) || '-p' ||
    substr(replace(v_offer.id::text, '-', ''), 1, 6);
  v_slug := v_base;

  loop
    exit when not exists (
      select 1 from public.products p
      where p.store_id = p_store_id and p.slug = v_slug
    );

    v_try := v_try + 1;
    v_slug := left(v_source.slug, 52) || '-p' || v_try::text;
  end loop;

  insert into public.products (
    store_id, name, slug, description, price_amount, compare_at_amount,
    status, published_at, product_type, stock_quantity, weight_grams,
    duration_minutes, service_location, tags,
    shipping_countries, options, partner_offer_id, source_product_id,
    partner_source_store_id, partner_commission_bps
  )
  values (
    p_store_id, v_source.name, v_slug, v_source.description,
    v_source.price_amount, v_source.compare_at_amount,
    'published', now(), v_source.product_type, v_source.stock_quantity,
    v_source.weight_grams, v_source.duration_minutes, v_source.service_location,
    v_source.tags, v_source.shipping_countries, '[]'::jsonb,
    v_offer.id, v_source.id, v_offer.store_id, v_offer.commission_bps
  )
  returning id into v_id;

  insert into public.product_images (product_id, media_id, position)
  select v_id, pi.media_id, pi.position
  from public.product_images pi
  where pi.product_id = v_source.id;

  return v_id;
end;
$$;

create or replace function public.fulfill_paid_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.payment_status = 'paid'
     and (tg_op = 'INSERT' or old.payment_status is distinct from 'paid') then
    insert into public.digital_entitlements (
      store_id, order_id, order_item_id, product_id, file_id,
      customer_email, customer_user_id, max_downloads
    )
    select
      new.store_id, new.id, oi.id, oi.product_id,
      coalesce(src.digital_file_id, p.digital_file_id),
      new.customer_email, new.customer_user_id, 3
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    left join public.products src on src.id = p.source_product_id
    where oi.order_id = new.id
      and oi.product_type = 'digital'
      and coalesce(src.digital_file_id, p.digital_file_id) is not null
    on conflict (order_item_id) do nothing;

    insert into public.bookings (
      store_id, order_id, order_item_id, product_id,
      customer_user_id, customer_email, customer_name,
      starts_at, duration_minutes
    )
    select
      new.store_id, new.id, oi.id, oi.product_id,
      new.customer_user_id, new.customer_email, new.customer_name,
      oi.service_starts_at, coalesce(p.duration_minutes, src.duration_minutes, 60)
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    left join public.products src on src.id = p.source_product_id
    where oi.order_id = new.id
      and oi.product_type = 'service'
      and oi.service_starts_at is not null
    on conflict (order_item_id) do nothing;
  elsif new.payment_status = 'refunded' then
    update public.digital_entitlements
    set status = 'revoked'
    where order_id = new.id
      and status = 'available';

    update public.bookings
    set status = 'cancelled'
    where order_id = new.id
      and status = 'confirmed';
  end if;

  return new;
end;
$$;
