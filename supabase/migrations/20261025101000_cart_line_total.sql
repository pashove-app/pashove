-- Le total de ligne doit accompagner l'article dans le panier : sans lui,
-- l'interface affichait « NaN F CFA » sur les paquets.

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
