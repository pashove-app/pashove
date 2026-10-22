-- Libellé de variante dans l'ordre des options du produit.

create or replace function public.variant_label(
  p_options jsonb,
  p_values  jsonb
)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select string_agg(entry.value, ' · ' order by option.ord)
  from jsonb_array_elements(coalesce(p_options, '[]'::jsonb))
    with ordinality as option(item, ord)
  cross join lateral (
    select p_values->>(option.item->>'name') as value
  ) as entry
  where entry.value is not null;
$$;

revoke execute on function public.variant_label(jsonb, jsonb)
  from public, anon, authenticated;

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
  items as (
    select
      ci.cart_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ci.id,
          'productId', ci.product_id,
          'variantId', ci.variant_id,
          'name', p.name,
          'slug', p.slug,
          'productType', p.product_type,
          'variantLabel', case
            when ci.variant_id is null then null
            else public.variant_label(p.options, v.option_values)
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
        )
        order by ci.created_at
      ) as items,
      coalesce(
        sum(coalesce(v.price_amount, p.price_amount) * ci.quantity),
        0
      )::int as subtotal,
      bool_or(p.product_type = 'physical') as has_physical,
      bool_or(p.product_type <> 'physical') as has_non_physical
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    left join public.product_variants v on v.id = ci.variant_id
    where ci.cart_id = p_cart_id
    group by ci.cart_id
  )
  select jsonb_build_object(
    'id', b.id,
    'storeId', b.store_id,
    'checkoutKey', b.checkout_key,
    'currency', b.currency,
    'subtotal', coalesce(i.subtotal, 0),
    'shipping', case
      when coalesce(i.has_physical, false) then b.shipping_flat_amount
      else 0
    end,
    'total', coalesce(i.subtotal, 0) + case
      when coalesce(i.has_physical, false) then b.shipping_flat_amount
      else 0
    end,
    'codEligible', b.cod_enabled and not coalesce(i.has_non_physical, false),
    'items', coalesce(i.items, '[]'::jsonb)
  )
  from base b
  left join items i on i.cart_id = b.id;
$$;

revoke execute on function public.cart_payload(uuid)
  from public, anon, authenticated;
