-- Panier : créneau de service et ouverture du checkout aux produits non physiques.
--
-- Sans prestataire de paiement en ligne, le COD reste temporairement le seul
-- moyen : les produits numériques et les services passent donc par lui pour
-- créer leurs droits et réservations. La livraison n'est facturée que si le
-- panier contient un objet physique.

alter table public.cart_items
  add column service_starts_at timestamptz;

drop index public.cart_items_line_idx;

create unique index cart_items_line_idx
  on public.cart_items (
    cart_id,
    product_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(service_starts_at, 'epoch'::timestamptz)
  );

create or replace function public.cart_add_service(
  p_token      uuid,
  p_product_id uuid,
  p_starts_at  timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart    uuid;
  v_store   uuid;
  v_product public.products%rowtype;
  v_exists  uuid;
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

  select p.* into v_product
  from public.products p
  where p.id = p_product_id
    and p.store_id = v_store
    and p.status = 'published'
    and p.product_type = 'service';

  if v_product.id is null then
    raise exception 'product_unavailable' using errcode = '22023';
  end if;

  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'service_slot_invalid' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.bookings b
    where b.product_id = p_product_id
      and b.starts_at = p_starts_at
      and b.status = 'confirmed'
  ) then
    raise exception 'service_slot_taken' using errcode = '22023';
  end if;

  select ci.id into v_exists
  from public.cart_items ci
  where ci.cart_id = v_cart
    and ci.product_id = p_product_id
    and ci.service_starts_at = p_starts_at;

  if v_exists is null then
    insert into public.cart_items (
      cart_id, store_id, product_id, quantity, service_starts_at
    )
    values (v_cart, v_store, p_product_id, 1, p_starts_at);
  end if;

  update public.carts set updated_at = now() where id = v_cart;

  return public.cart_payload(v_cart);
end;
$$;

revoke execute on function public.cart_add_service(uuid, uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.cart_add_service(uuid, uuid, timestamptz)
  to anon, authenticated;

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
        'serviceStartsAt', ci.service_starts_at,
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
        ),
        'lineTotal', coalesce(v.price_amount, p.price_amount) * ci.quantity
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
        'serviceStartsAt', null,
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
        ),
        'lineTotal', b.price_amount * ci.quantity
      ) as item,
      b.price_amount * ci.quantity as line_total,
      exists (
        select 1
        from public.bundle_items bi
        join public.products bp on bp.id = bi.product_id
        where bi.bundle_id = b.id
          and bp.product_type = 'physical'
      ) as has_physical,
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
  ),
  discount as (
    select
      d.id,
      d.code,
      d.kind,
      d.value,
      case d.kind
        when 'percent' then least(
          round(coalesce(t.subtotal, 0) * d.value / 100.0)::int,
          coalesce(t.subtotal, 0)
        )
        else least(d.value, coalesce(t.subtotal, 0))
      end as amount
    from public.carts c
    join public.discount_codes d on d.id = c.discount_code_id
    left join totals t on t.cart_id = c.id
    where c.id = p_cart_id
      and d.store_id = c.store_id
      and d.active
      and (d.starts_at is null or d.starts_at <= now())
      and (d.expires_at is null or d.expires_at > now())
      and (d.max_uses is null or d.uses_count < d.max_uses)
      and coalesce(t.subtotal, 0) >= d.min_subtotal
  )
  select jsonb_build_object(
    'id', b.id,
    'storeId', b.store_id,
    'checkoutKey', b.checkout_key,
    'currency', b.currency,
    'subtotal', coalesce(t.subtotal, 0),
    'discountAmount', coalesce(dsc.amount, 0),
    'discount', case
      when dsc.id is null then null
      else jsonb_build_object(
        'code', dsc.code,
        'kind', dsc.kind,
        'value', dsc.value,
        'amount', dsc.amount
      )
    end,
    'shipping', case
      when coalesce(t.has_physical, false) then b.shipping_flat_amount
      else 0
    end,
    'total', coalesce(t.subtotal, 0) - coalesce(dsc.amount, 0) + case
      when coalesce(t.has_physical, false) then b.shipping_flat_amount
      else 0
    end,
    'codEligible', b.cod_enabled,
    'items', coalesce(t.items, '[]'::jsonb)
  )
  from base b
  left join totals t on t.cart_id = b.id
  left join discount dsc on true;
$$;

revoke execute on function public.cart_payload(uuid)
  from public, anon, authenticated;
