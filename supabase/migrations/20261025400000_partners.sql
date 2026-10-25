-- Partenaires : partage de produits entre boutiques.
--
-- Le propriétaire (A) autorise un produit avec une commission. Le partenaire
-- (B) publie une copie contrôlée dans sa boutique ; le prix reste celui de A,
-- le stock est celui de A. La vente est attribuée et comptabilisée dans le
-- ledger des deux boutiques.

create table public.partner_offers (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  product_id     uuid not null unique references public.products (id) on delete cascade,
  commission_bps integer not null check (commission_bps between 100 and 5000),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index partner_offers_store_idx
  on public.partner_offers (store_id, created_at desc);

create trigger partner_offers_touch_updated_at
  before update on public.partner_offers
  for each row execute function public.touch_updated_at();

alter table public.products
  add column partner_offer_id uuid references public.partner_offers (id) on delete set null,
  add column source_product_id uuid references public.products (id) on delete set null,
  add column partner_source_store_id uuid references public.stores (id) on delete set null,
  add column partner_commission_bps integer
    check (partner_commission_bps is null or partner_commission_bps between 100 and 5000);

alter table public.products
  add constraint products_partner_shape check (
    (partner_offer_id is null
      and source_product_id is null
      and partner_source_store_id is null
      and partner_commission_bps is null)
    or
    (partner_offer_id is not null
      and source_product_id is not null
      and partner_source_store_id is not null
      and partner_commission_bps is not null)
  );

create unique index products_partner_listing_idx
  on public.products (store_id, source_product_id)
  where source_product_id is not null;

create table public.partner_sales (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders (id) on delete cascade,
  order_item_id       uuid not null unique references public.order_items (id) on delete cascade,
  offer_id            uuid references public.partner_offers (id) on delete set null,
  source_store_id     uuid not null references public.stores (id) on delete cascade,
  partner_store_id    uuid not null references public.stores (id) on delete cascade,
  product_id          uuid references public.products (id) on delete set null,
  amount              integer not null check (amount >= 0),
  partner_commission  integer not null check (partner_commission >= 0),
  platform_commission integer not null check (platform_commission >= 0),
  source_revenue      integer not null check (source_revenue >= 0),
  status              text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'reversed')),
  created_at          timestamptz not null default now()
);

create index partner_sales_source_idx
  on public.partner_sales (source_store_id, created_at desc);
create index partner_sales_partner_idx
  on public.partner_sales (partner_store_id, created_at desc);

alter table public.order_items
  add column partner_offer_id uuid references public.partner_offers (id) on delete set null,
  add column partner_source_store_id uuid references public.stores (id) on delete set null,
  add column partner_commission_amount integer not null default 0
    check (partner_commission_amount >= 0),
  add column partner_source_revenue integer not null default 0
    check (partner_source_revenue >= 0);

/* ------------------------------------------------------------------ *
 *  RLS
 * ------------------------------------------------------------------ */

alter table public.partner_offers enable row level security;
alter table public.partner_sales enable row level security;

create policy partner_offers_select_member on public.partner_offers
  for select to authenticated
  using (public.is_store_member(store_id));

create policy partner_offers_select_public on public.partner_offers
  for select to authenticated
  using (
    active
    and public.is_public_store(store_id)
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
    )
  );

create policy partner_offers_insert_member on public.partner_offers
  for insert to authenticated
  with check (
    public.has_store_role(store_id, array['owner', 'admin', 'product_manager']::public.store_role[])
  );

create policy partner_offers_update_member on public.partner_offers
  for update to authenticated
  using (
    public.has_store_role(store_id, array['owner', 'admin', 'product_manager']::public.store_role[])
  )
  with check (
    public.has_store_role(store_id, array['owner', 'admin', 'product_manager']::public.store_role[])
  );

create policy partner_offers_delete_member on public.partner_offers
  for delete to authenticated
  using (
    public.has_store_role(store_id, array['owner', 'admin', 'product_manager']::public.store_role[])
  );

create policy partner_sales_select_member on public.partner_sales
  for select to authenticated
  using (
    public.is_store_member(source_store_id)
    or public.is_store_member(partner_store_id)
  );

revoke all on public.partner_offers from public, anon, authenticated;
revoke all on public.partner_sales from public, anon, authenticated;
grant select, insert, update, delete on public.partner_offers to authenticated;
grant select on public.partner_sales to authenticated;

/* ------------------------------------------------------------------ *
 *  Un paquet ne peut pas contenir une copie partenaire
 * ------------------------------------------------------------------ */

create or replace function public.bundle_items_block_partner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.products p
    where p.id = new.product_id
      and p.partner_offer_id is not null
  ) then
    raise exception 'bundle_partner_unavailable' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke execute on function public.bundle_items_block_partner()
  from public, anon, authenticated;

create trigger bundle_items_block_partner
  before insert or update on public.bundle_items
  for each row execute function public.bundle_items_block_partner();

/* ------------------------------------------------------------------ *
 *  Réglages de l'offre (côté propriétaire)
 * ------------------------------------------------------------------ */

create or replace function public.save_partner_offer(
  p_store_id       uuid,
  p_product_id     uuid,
  p_commission_bps integer,
  p_active         boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_id      uuid;
begin
  if not public.has_store_role(
    p_store_id,
    array['owner', 'admin', 'product_manager']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select p.* into v_product
  from public.products p
  where p.id = p_product_id
    and p.store_id = p_store_id;

  if v_product.id is null then
    raise exception 'product_unavailable' using errcode = '22023';
  end if;

  if v_product.partner_offer_id is not null then
    raise exception 'partner_chain_forbidden' using errcode = '22023';
  end if;

  if v_product.product_type <> 'physical' then
    raise exception 'partner_physical_only' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.product_variants v where v.product_id = p_product_id
  ) then
    raise exception 'partner_no_variants' using errcode = '22023';
  end if;

  if p_commission_bps < 100 or p_commission_bps > 5000 then
    raise exception 'partner_commission_invalid' using errcode = '22023';
  end if;

  insert into public.partner_offers (
    store_id, product_id, commission_bps, active
  )
  values (p_store_id, p_product_id, p_commission_bps, coalesce(p_active, true))
  on conflict (product_id) do update
    set commission_bps = excluded.commission_bps,
        active = excluded.active
  returning id into v_id;

  -- Retirer l'offre dépublie les copies déjà ajoutées.
  if not coalesce(p_active, true) then
    update public.products
    set status = 'draft'
    where source_product_id = p_product_id
      and partner_offer_id = v_id;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.save_partner_offer(uuid, uuid, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.save_partner_offer(uuid, uuid, integer, boolean)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Ajout d'une copie contrôlée dans la boutique partenaire
 * ------------------------------------------------------------------ */

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

  if v_source.product_type <> 'physical' then
    raise exception 'partner_physical_only' using errcode = '22023';
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
    status, published_at, product_type, stock_quantity, tags,
    shipping_countries, options, partner_offer_id, source_product_id,
    partner_source_store_id, partner_commission_bps
  )
  values (
    p_store_id, v_source.name, v_slug, v_source.description,
    v_source.price_amount, v_source.compare_at_amount,
    'published', now(), v_source.product_type, v_source.stock_quantity,
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

revoke execute on function public.add_partner_listing(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.add_partner_listing(uuid, uuid)
  to authenticated;
