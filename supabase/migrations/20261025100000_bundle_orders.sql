-- Achat réel des paquets.
--
-- Une ligne de panier est désormais soit un produit (variante comprise), soit
-- un paquet. Le paquet n'a pas de stock propre : on vérifie et décrémente
-- celui de chaque produit qu'il contient, et la ligne de commande garde le
-- prix du paquet ainsi que la composition exacte déduite du stock.

alter table public.cart_items
  alter column product_id drop not null,
  add column bundle_id uuid references public.bundles (id) on delete cascade,
  add constraint cart_items_one_target
    check ((product_id is null) <> (bundle_id is null)),
  add constraint cart_items_bundle_without_variant
    check (bundle_id is null or variant_id is null);

create unique index cart_items_bundle_idx
  on public.cart_items (cart_id, bundle_id)
  where bundle_id is not null;

/* ------------------------------------------------------------------ *
 *  Affectation de la boutique
 * ------------------------------------------------------------------ */

create or replace function public.cart_items_assign_store()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid;
begin
  select c.store_id into v_store
  from public.carts c
  where c.id = new.cart_id;

  if v_store is null then
    raise exception 'invalid_cart' using errcode = '22023';
  end if;

  if new.bundle_id is not null then
    if not exists (
      select 1
      from public.bundles b
      where b.id = new.bundle_id
        and b.store_id = v_store
    ) then
      raise exception 'invalid_bundle' using errcode = '22023';
    end if;

    new.store_id := v_store;
    return new;
  end if;

  if new.product_id is null then
    raise exception 'invalid_product' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.store_id = v_store
  ) then
    raise exception 'invalid_product' using errcode = '22023';
  end if;

  if new.variant_id is not null and not exists (
    select 1
    from public.product_variants v
    where v.id = new.variant_id
      and v.product_id = new.product_id
  ) then
    raise exception 'invalid_variant' using errcode = '22023';
  end if;

  new.store_id := v_store;
  return new;
end;
$$;

revoke execute on function public.cart_items_assign_store()
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture du panier
 * ------------------------------------------------------------------ */

create or replace function public.cart_payload(p_cart_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      c.id,
      c.store_id,
      c.checkout_key,
      s.currency,
      s.shipping_flat_amount,
      s.cod_enabled
    from public.carts c
    join public.stores s on s.id = c.store_id
    where c.id = p_cart_id
  ),
  lines as (
    select
      ci.cart_id,
      ci.created_at as sort_at,
      ci.id as sort_id,
      jsonb_build_object(
        'id', ci.id,
        'kind', 'product',
        'productId', ci.product_id,
        'bundleId', null,
        'bundleItems', '[]'::jsonb,
        'name', p.name,
        'slug', p.slug,
        'productType', p.product_type,
        'variantLabel', case
          when ci.variant_id is null then null
          else (
            select string_agg(entry.value, ' · ' order by entry.key)
            from jsonb_each_text(v.option_values) as entry
          )
        end,
        'unitPrice', coalesce(v.price_amount, p.price_amount),
        'compareAt', p.compare_at_amount,
        'imageKey', (
          select m.object_key
          from public.product_images pi
          join public.media_assets m on m.id = pi.media_id
          where pi.product_id = p.id
          order by pi.position
          limit 1
        ),
        'quantity', ci.quantity,
        'stock', case
          when p.product_type = 'physical'
            then coalesce(v.stock_quantity, p.stock_quantity, 0)
          else null
        end,
        'available', (
          p.status = 'published'
          and (
            p.product_type <> 'physical'
            or coalesce(v.stock_quantity, p.stock_quantity, 0) >= ci.quantity
          )
        )
      ) as item,
      coalesce(v.price_amount, p.price_amount) * ci.quantity as line_total,
      p.product_type = 'physical' as has_physical,
      p.product_type <> 'physical' as has_non_physical
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    left join public.product_variants v on v.id = ci.variant_id
    where ci.cart_id = p_cart_id
      and ci.product_id is not null

    union all

    select
      ci.cart_id,
      ci.created_at,
      ci.id,
      jsonb_build_object(
        'id', ci.id,
        'kind', 'bundle',
        'productId', null,
        'bundleId', b.id,
        'bundleItems', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'name', bp.name,
                'variantLabel', case
                  when bi.variant_id is null then null
                  else (
                    select string_agg(entry.value, ' · ' order by entry.key)
                    from jsonb_each_text(bv.option_values) as entry
                  )
                end
              )
              order by bi.position
            )
            from public.bundle_items bi
            join public.products bp on bp.id = bi.product_id
            left join public.product_variants bv on bv.id = bi.variant_id
            where bi.bundle_id = b.id
          ),
          '[]'::jsonb
        ),
        'name', b.name,
        'slug', b.slug,
        'productType', 'bundle',
        'variantLabel', null,
        'unitPrice', b.price_amount,
        'compareAt', (
          select sum(coalesce(bv.price_amount, bp.price_amount))::int
          from public.bundle_items bi
          join public.products bp on bp.id = bi.product_id
          left join public.product_variants bv on bv.id = bi.variant_id
          where bi.bundle_id = b.id
        ),
        'imageKey', coalesce(
          (select m.object_key from public.media_assets m where m.id = b.image_media_id),
          (
            select m.object_key
            from public.bundle_items bi
            join public.product_images pi on pi.product_id = bi.product_id
            join public.media_assets m on m.id = pi.media_id
            where bi.bundle_id = b.id
            order by bi.position, pi.position
            limit 1
          )
        ),
        'quantity', ci.quantity,
        'stock', (
          select min(coalesce(bv.stock_quantity, bp.stock_quantity, 0))
          from public.bundle_items bi
          join public.products bp on bp.id = bi.product_id
          left join public.product_variants bv on bv.id = bi.variant_id
          where bi.bundle_id = b.id
            and bp.product_type = 'physical'
        ),
        'available', (
          b.status = 'published'
          and not exists (
            select 1
            from public.bundle_items bi
            join public.products bp on bp.id = bi.product_id
            where bi.bundle_id = b.id
              and bp.status <> 'published'
          )
          and not exists (
            select 1
            from public.bundle_items bi
            join public.products bp on bp.id = bi.product_id
            left join public.product_variants bv on bv.id = bi.variant_id
            where bi.bundle_id = b.id
              and bp.product_type = 'physical'
              and coalesce(bv.stock_quantity, bp.stock_quantity, 0) < ci.quantity
          )
        )
      ) as item,
      b.price_amount * ci.quantity as line_total,
      exists (
        select 1
        from public.bundle_items bi
        join public.products bp on bp.id = bi.product_id
        where bi.bundle_id = b.id
          and bp.product_type = 'physical'
      ) as has_physical,
      -- Un paquet reste payable en espèces : il est vendu comme un lot.
      false as has_non_physical
    from public.cart_items ci
    join public.bundles b on b.id = ci.bundle_id
    where ci.cart_id = p_cart_id
      and ci.bundle_id is not null
  ),
  totals as (
    select
      lines.cart_id,
      jsonb_agg(lines.item order by lines.sort_at, lines.sort_id) as items,
      sum(lines.line_total)::int as subtotal,
      coalesce(bool_or(lines.has_physical), false) as has_physical,
      coalesce(bool_or(lines.has_non_physical), false) as has_non_physical
    from lines
    group by lines.cart_id
  )
  select jsonb_build_object(
    'id', b.id,
    'storeId', b.store_id,
    'checkoutKey', b.checkout_key,
    'currency', b.currency,
    'subtotal', coalesce(t.subtotal, 0),
    'shipping', case
      when coalesce(t.has_physical, false) then b.shipping_flat_amount
      else 0
    end,
    'total', coalesce(t.subtotal, 0) + case
      when coalesce(t.has_physical, false) then b.shipping_flat_amount
      else 0
    end,
    'codEligible', b.cod_enabled and not coalesce(t.has_non_physical, false),
    'items', coalesce(t.items, '[]'::jsonb)
  )
  from base b
  left join totals t on t.cart_id = b.id;
$$;

revoke execute on function public.cart_payload(uuid)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Ajout d'un paquet
 * ------------------------------------------------------------------ */

/**
 * Ajoute un paquet au panier. La quantité est plafonnée au plus petit stock
 * de ses produits physiques : un paquet ne peut jamais dépasser son maillon
 * le plus rare.
 */
create or replace function public.cart_add_bundle(
  p_token     uuid,
  p_bundle_id uuid,
  p_quantity  integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart     uuid;
  v_store    uuid;
  v_bundle   public.bundles%rowtype;
  v_max      integer;
  v_quantity integer;
  v_item     uuid;
  v_item_qty integer;
begin
  select c.id, c.store_id into v_cart, v_store
  from public.carts c
  where c.token = p_token
    and c.status = 'open'
    and c.expires_at > now()
  for update;

  if v_cart is null then
    raise exception 'cart_unavailable' using errcode = '22023';
  end if;

  select b.* into v_bundle
  from public.bundles b
  where b.id = p_bundle_id
    and b.store_id = v_store
    and b.status = 'published';

  if v_bundle.id is null then
    raise exception 'bundle_unavailable' using errcode = '22023';
  end if;

  select min(coalesce(v.stock_quantity, p.stock_quantity, 0)) into v_max
  from public.bundle_items bi
  join public.products p on p.id = bi.product_id
  left join public.product_variants v on v.id = bi.variant_id
  where bi.bundle_id = v_bundle.id
    and p.product_type = 'physical';

  if v_max is null then
    v_max := 99;
  end if;

  if v_max <= 0 then
    raise exception 'out_of_stock' using errcode = '22023';
  end if;

  v_quantity := least(greatest(coalesce(p_quantity, 1), 1), v_max);

  select ci.id, ci.quantity into v_item, v_item_qty
  from public.cart_items ci
  where ci.cart_id = v_cart
    and ci.bundle_id = p_bundle_id;

  if v_item is null then
    insert into public.cart_items (cart_id, store_id, bundle_id, quantity)
    values (v_cart, v_store, p_bundle_id, v_quantity);
  else
    update public.cart_items
    set quantity = least(v_item_qty + v_quantity, v_max)
    where id = v_item;
  end if;

  update public.carts set updated_at = now() where id = v_cart;

  return public.cart_payload(v_cart);
end;
$$;

revoke execute on function public.cart_add_bundle(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.cart_add_bundle(uuid, uuid, integer)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Quantité d'une ligne de paquet
 * ------------------------------------------------------------------ */

create or replace function public.cart_set_quantity(
  p_token   uuid,
  p_item_id uuid,
  p_quantity integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart   uuid;
  v_item   public.cart_items%rowtype;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_max    integer;
begin
  select c.id into v_cart
  from public.carts c
  where c.token = p_token
    and c.status = 'open'
    and c.expires_at > now();

  if v_cart is null then
    raise exception 'cart_unavailable' using errcode = '22023';
  end if;

  select ci.* into v_item
  from public.cart_items ci
  where ci.id = p_item_id and ci.cart_id = v_cart;

  if v_item.id is null then
    raise exception 'item_unavailable' using errcode = '22023';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    delete from public.cart_items where id = v_item.id;
    update public.carts set updated_at = now() where id = v_cart;
    return public.cart_payload(v_cart);
  end if;

  if v_item.bundle_id is not null then
    select min(coalesce(v.stock_quantity, p.stock_quantity, 0)) into v_max
    from public.bundle_items bi
    join public.products p on p.id = bi.product_id
    left join public.product_variants v on v.id = bi.variant_id
    where bi.bundle_id = v_item.bundle_id
      and p.product_type = 'physical';

    if v_max is null then
      v_max := 99;
    end if;

    if v_max <= 0 then
      raise exception 'out_of_stock' using errcode = '22023';
    end if;

    update public.cart_items
    set quantity = least(greatest(p_quantity, 1), v_max)
    where id = v_item.id;

    update public.carts set updated_at = now() where id = v_cart;

    return public.cart_payload(v_cart);
  end if;

  select p.* into v_product from public.products p where p.id = v_item.product_id;

  if v_item.variant_id is not null then
    select v.* into v_variant from public.product_variants v where v.id = v_item.variant_id;
  end if;

  if v_product.product_type = 'physical' then
    v_max := coalesce(v_variant.stock_quantity, v_product.stock_quantity, 0);
    if v_max <= 0 then
      raise exception 'out_of_stock' using errcode = '22023';
    end if;
    update public.cart_items
    set quantity = least(greatest(p_quantity, 1), v_max)
    where id = v_item.id;
  else
    update public.cart_items set quantity = 1 where id = v_item.id;
  end if;

  update public.carts set updated_at = now() where id = v_cart;

  return public.cart_payload(v_cart);
end;
$$;

/* ------------------------------------------------------------------ *
 *  Lignes de commande : paquet et composition déduite
 * ------------------------------------------------------------------ */

alter table public.order_items
  add column bundle_id uuid references public.bundles (id) on delete set null,
  add column bundle_contents jsonb not null default '[]'::jsonb;

alter table public.order_items
  drop constraint order_items_product_type_check;

alter table public.order_items
  add constraint order_items_product_type_check
  check (product_type in ('physical', 'digital', 'service', 'bundle'));

create index order_items_bundle_idx
  on public.order_items (bundle_id)
  where bundle_id is not null;

/* ------------------------------------------------------------------ *
 *  Commande — produits et paquets
 * ------------------------------------------------------------------ */

create or replace function public.place_order(
  p_token           uuid,
  p_customer        jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart       public.carts%rowtype;
  v_store      public.stores%rowtype;
  v_country    text;
  v_name       text;
  v_email      text;
  v_phone      text;
  v_city       text;
  v_address    text;
  v_extra      text;
  v_notes      text;
  v_item       record;
  v_product    public.products%rowtype;
  v_variant    public.product_variants%rowtype;
  v_bundle     public.bundles%rowtype;
  v_bundle_item record;
  v_bundle_contents jsonb := '[]'::jsonb;
  v_stock      integer;
  v_price      integer;
  v_subtotal   integer := 0;
  v_shipping   integer := 0;
  v_total      integer := 0;
  v_number     integer;
  v_order_id   uuid;
  v_order_token uuid;
  v_lines      jsonb := '[]'::jsonb;
  v_label      text;
  v_image_key  text;
  v_existing   public.orders%rowtype;
begin
  -- Deux requêtes simultanées avec la même clé sont sérialisées ici.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select o.* into v_existing
  from public.orders o
  where o.idempotency_key = p_idempotency_key;

  if v_existing.id is not null then
    return jsonb_build_object(
      'orderId', v_existing.id,
      'token', v_existing.public_token,
      'number', v_existing.number
    );
  end if;

  select c.* into v_cart
  from public.carts c
  where c.token = p_token
    and c.status = 'open'
    and c.expires_at > now()
  for update;

  if v_cart.id is null then
    raise exception 'cart_unavailable' using errcode = '22023';
  end if;

  if v_cart.checkout_key <> p_idempotency_key then
    raise exception 'invalid_checkout' using errcode = '22023';
  end if;

  if not exists (select 1 from public.cart_items ci where ci.cart_id = v_cart.id) then
    raise exception 'cart_empty' using errcode = '22023';
  end if;

  select s.* into v_store
  from public.stores s
  where s.id = v_cart.store_id
  for update;

  if v_store.status <> 'active' then
    raise exception 'store_unavailable' using errcode = '22023';
  end if;

  v_name    := btrim(coalesce(p_customer->>'name', ''));
  v_email   := btrim(coalesce(p_customer->>'email', ''));
  v_phone   := btrim(coalesce(p_customer->>'phone', ''));
  v_country := upper(btrim(coalesce(p_customer->>'country', '')));
  v_city    := btrim(coalesce(p_customer->>'city', ''));
  v_address := btrim(coalesce(p_customer->>'address', ''));
  v_extra   := nullif(btrim(coalesce(p_customer->>'extra', '')), '');
  v_notes   := nullif(btrim(coalesce(p_customer->>'notes', '')), '');

  if v_name = '' or v_city = '' or v_address = '' or v_country = '' then
    raise exception 'customer_incomplete' using errcode = '22023';
  end if;

  if v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'customer_invalid' using errcode = '22023';
  end if;

  if char_length(v_phone) < 6 then
    raise exception 'customer_invalid' using errcode = '22023';
  end if;

  for v_item in
    select ci.id, ci.product_id, ci.variant_id, ci.bundle_id, ci.quantity
    from public.cart_items ci
    where ci.cart_id = v_cart.id
    order by ci.created_at, ci.id
  loop
    /* ---------------- Paquet ---------------- */
    if v_item.bundle_id is not null then
      select b.* into v_bundle
      from public.bundles b
      where b.id = v_item.bundle_id
      for update;

      if v_bundle.id is null
        or v_bundle.store_id <> v_store.id
        or v_bundle.status <> 'published' then
        raise exception 'bundle_unavailable' using errcode = '22023';
      end if;

      v_bundle_contents := '[]'::jsonb;

      for v_bundle_item in
        select bi.product_id, bi.variant_id
        from public.bundle_items bi
        where bi.bundle_id = v_bundle.id
        order by bi.product_id, bi.variant_id nulls first
      loop
        select p.* into v_product
        from public.products p
        where p.id = v_bundle_item.product_id
        for update;

        if v_product.id is null
          or v_product.store_id <> v_store.id
          or v_product.status <> 'published' then
          raise exception 'bundle_item_unavailable:%', v_product.name
            using errcode = '22023';
        end if;

        if array_length(v_product.shipping_countries, 1) is not null
          and not (v_country = any (v_product.shipping_countries)) then
          raise exception 'country_not_allowed' using errcode = '22023';
        end if;

        v_label := null;

        if v_bundle_item.variant_id is not null then
          select v.* into v_variant
          from public.product_variants v
          where v.id = v_bundle_item.variant_id
            and v.product_id = v_product.id
          for update;

          if v_variant.id is null then
            raise exception 'bundle_item_unavailable:%', v_product.name
              using errcode = '22023';
          end if;

          v_stock := v_variant.stock_quantity;

          select string_agg(entry.value, ' · ' order by entry.key)
          into v_label
          from jsonb_each_text(v_variant.option_values) as entry;
        else
          v_stock := coalesce(v_product.stock_quantity, 0);
        end if;

        -- Un produit numérique n'a pas de stock : il est livré avec le lot.
        -- Le paquet reste payable en espèces, même mixte, tant que les
        -- paiements en ligne ne sont pas ouverts.
        if v_product.product_type = 'physical' then
          if v_stock < v_item.quantity then
            raise exception 'bundle_item_out_of_stock:%', v_product.name
              using errcode = '22023';
          end if;

          if v_bundle_item.variant_id is not null then
            update public.product_variants
            set stock_quantity = stock_quantity - v_item.quantity
            where id = v_variant.id;
          else
            update public.products
            set stock_quantity = stock_quantity - v_item.quantity
            where id = v_product.id;
          end if;
        end if;

        v_bundle_contents := v_bundle_contents || jsonb_build_object(
          'product_name', v_product.name,
          'variant_label', v_label,
          'quantity', v_item.quantity
        );
      end loop;

      select coalesce(
        (select m.object_key from public.media_assets m where m.id = v_bundle.image_media_id),
        (
          select m.object_key
          from public.bundle_items bi
          join public.product_images pi on pi.product_id = bi.product_id
          join public.media_assets m on m.id = pi.media_id
          where bi.bundle_id = v_bundle.id
          order by bi.position, pi.position
          limit 1
        )
      ) into v_image_key;

      v_subtotal := v_subtotal + (v_bundle.price_amount * v_item.quantity);

      v_lines := v_lines || jsonb_build_object(
        'product_id', null,
        'variant_id', null,
        'bundle_id', v_bundle.id,
        'product_name', v_bundle.name,
        'variant_label', null,
        'sku', null,
        'image_key', v_image_key,
        'product_type', 'bundle',
        'unit_price', v_bundle.price_amount,
        'quantity', v_item.quantity,
        'line_total', v_bundle.price_amount * v_item.quantity,
        'bundle_contents', v_bundle_contents
      );

      continue;
    end if;

    /* ---------------- Produit seul ---------------- */
    select p.* into v_product
    from public.products p
    where p.id = v_item.product_id
    for update;

    if v_product.id is null
      or v_product.store_id <> v_store.id
      or v_product.status <> 'published' then
      raise exception 'product_unavailable' using errcode = '22023';
    end if;

    -- Le paiement à la livraison ne concerne que les objets physiques.
    if v_product.product_type <> 'physical' then
      raise exception 'cod_unavailable' using errcode = '22023';
    end if;

    if array_length(v_product.shipping_countries, 1) is not null
      and not (v_country = any (v_product.shipping_countries)) then
      raise exception 'country_not_allowed' using errcode = '22023';
    end if;

    if v_item.variant_id is not null then
      select v.* into v_variant
      from public.product_variants v
      where v.id = v_item.variant_id
        and v.product_id = v_product.id
      for update;

      if v_variant.id is null then
        raise exception 'product_unavailable' using errcode = '22023';
      end if;

      v_stock := v_variant.stock_quantity;
      v_price := v_variant.price_amount;

      if v_stock < v_item.quantity then
        raise exception 'out_of_stock' using errcode = '22023';
      end if;

      update public.product_variants
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_variant.id;

      select string_agg(entry.value, ' · ' order by entry.key)
      into v_label
      from jsonb_each_text(v_variant.option_values) as entry;
    else
      v_stock := coalesce(v_product.stock_quantity, 0);
      v_price := v_product.price_amount;
      v_label := null;

      if v_stock < v_item.quantity then
        raise exception 'out_of_stock' using errcode = '22023';
      end if;

      update public.products
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_product.id;
    end if;

    select m.object_key into v_image_key
    from public.product_images pi
    join public.media_assets m on m.id = pi.media_id
    where pi.product_id = v_product.id
    order by pi.position
    limit 1;

    v_subtotal := v_subtotal + (v_price * v_item.quantity);

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'variant_id', v_item.variant_id,
      'bundle_id', null,
      'product_name', v_product.name,
      'variant_label', v_label,
      'sku', case when v_item.variant_id is not null then v_variant.sku else null end,
      'image_key', v_image_key,
      'product_type', v_product.product_type,
      'unit_price', v_price,
      'quantity', v_item.quantity,
      'line_total', v_price * v_item.quantity,
      'bundle_contents', '[]'::jsonb
    );
  end loop;

  v_shipping := v_store.shipping_flat_amount;
  v_total := v_subtotal + v_shipping;

  select coalesce(max(o.number), 0) + 1 into v_number
  from public.orders o
  where o.store_id = v_store.id;

  insert into public.orders (
    store_id, number, status, payment_status, payment_method, currency,
    subtotal_amount, shipping_amount, total_amount,
    customer_name, customer_email, customer_phone,
    shipping_country, shipping_city, shipping_address, shipping_extra,
    notes, idempotency_key
  )
  values (
    v_store.id, v_number, 'pending', 'pending', 'cod', v_store.currency,
    v_subtotal, v_shipping, v_total,
    v_name, v_email, v_phone,
    v_country, v_city, v_address, v_extra,
    v_notes, p_idempotency_key
  )
  returning id, public_token into v_order_id, v_order_token;

  insert into public.order_items (
    order_id, store_id, product_id, variant_id, bundle_id, product_name,
    variant_label, sku, image_key, product_type, unit_price, quantity,
    line_total, bundle_contents
  )
  select
    v_order_id, v_store.id, item.product_id, item.variant_id, item.bundle_id,
    item.product_name, item.variant_label, item.sku, item.image_key,
    item.product_type, item.unit_price, item.quantity, item.line_total,
    coalesce(item.bundle_contents, '[]'::jsonb)
  from jsonb_to_recordset(v_lines) as item(
    product_id uuid, variant_id uuid, bundle_id uuid, product_name text,
    variant_label text, sku text, image_key text, product_type text,
    unit_price integer, quantity integer, line_total integer,
    bundle_contents jsonb
  );

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order_id,
    v_store.id,
    'created',
    jsonb_build_object('payment_method', 'cod', 'total', v_total)
  );

  insert into public.payments (
    order_id, store_id, provider, status, amount, currency, idempotency_key
  )
  values (
    v_order_id, v_store.id, 'cod', 'pending', v_total, v_store.currency,
    p_idempotency_key::text
  );

  update public.carts
  set status = 'converted', updated_at = now()
  where id = v_cart.id;

  return jsonb_build_object(
    'orderId', v_order_id,
    'token', v_order_token,
    'number', v_number
  );
end;
$$;

revoke execute on function public.place_order(uuid, jsonb, uuid)
  from public, anon, authenticated;
