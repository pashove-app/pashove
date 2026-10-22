-- Durcissement du panier et de la commande.

-- Le jeton reste dans le cookie HttpOnly : il ne sort plus dans le JSON.
create or replace function public.cart_payload(p_cart_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', c.id,
    'storeId', c.store_id,
    'checkoutKey', c.checkout_key,
    'codEligible', (
      (select s.cod_enabled from public.stores s where s.id = c.store_id)
      and not exists (
        select 1
        from public.cart_items ci
        join public.products p on p.id = ci.product_id
        where ci.cart_id = c.id
          and p.product_type <> 'physical'
      )
    ),
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ci.id,
            'productId', ci.product_id,
            'variantId', ci.variant_id,
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
          )
          order by ci.created_at
        )
        from public.cart_items ci
        join public.products p on p.id = ci.product_id
        left join public.product_variants v on v.id = ci.variant_id
        where ci.cart_id = c.id
      ),
      '[]'::jsonb
    )
  )
  from public.carts c
  where c.id = p_cart_id;
$$;

revoke execute on function public.cart_payload(uuid)
  from public, anon, authenticated;

-- Seule `cart_open` remet le jeton, au serveur, pour poser le cookie.
create or replace function public.cart_open(
  p_slug  text,
  p_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid;
  v_cart  uuid;
  v_token uuid;
begin
  select s.id into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store is null then
    raise exception 'store_unavailable' using errcode = '22023';
  end if;

  if p_token is not null then
    select c.id, c.token into v_cart, v_token
    from public.carts c
    where c.token = p_token
      and c.store_id = v_store
      and c.status = 'open'
      and c.expires_at > now();
  end if;

  if v_cart is null then
    insert into public.carts (store_id)
    values (v_store)
    returning id, token into v_cart, v_token;
  else
    update public.carts set updated_at = now() where id = v_cart;
  end if;

  return public.cart_payload(v_cart) || jsonb_build_object('token', v_token);
end;
$$;

-- La commande respecte l'interrupteur de la boutique.
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

  if not v_store.cod_enabled then
    raise exception 'cod_unavailable' using errcode = '22023';
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
    select ci.id, ci.product_id, ci.variant_id, ci.quantity
    from public.cart_items ci
    where ci.cart_id = v_cart.id
    order by ci.product_id, ci.variant_id nulls first
  loop
    select p.* into v_product
    from public.products p
    where p.id = v_item.product_id
    for update;

    if v_product.id is null
      or v_product.store_id <> v_store.id
      or v_product.status <> 'published' then
      raise exception 'product_unavailable' using errcode = '22023';
    end if;

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
      'product_name', v_product.name,
      'variant_label', v_label,
      'sku', case when v_item.variant_id is not null then v_variant.sku else null end,
      'image_key', v_image_key,
      'product_type', v_product.product_type,
      'unit_price', v_price,
      'quantity', v_item.quantity,
      'line_total', v_price * v_item.quantity
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
    order_id, store_id, product_id, variant_id, product_name, variant_label,
    sku, image_key, product_type, unit_price, quantity, line_total
  )
  select
    v_order_id, v_store.id, item.product_id, item.variant_id, item.product_name,
    item.variant_label, item.sku, item.image_key, item.product_type,
    item.unit_price, item.quantity, item.line_total
  from jsonb_to_recordset(v_lines) as item(
    product_id uuid, variant_id uuid, product_name text, variant_label text,
    sku text, image_key text, product_type text, unit_price integer,
    quantity integer, line_total integer
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
