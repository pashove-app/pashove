-- Commande client : produits numériques, services et créneaux.
--
-- Le COD reste le seul moyen tant que le PSP n'est pas branché : il accepte
-- donc temporairement les produits numériques et les services, pour créer les
-- droits d'accès et les réservations. La livraison n'est facturée que si le
-- panier contient un objet physique.

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
  v_source     public.products%rowtype;
  v_source_store public.stores%rowtype;
  v_bundle     public.bundles%rowtype;
  v_bundle_item record;
  v_bundle_contents jsonb := '[]'::jsonb;
  v_discount   public.discount_codes%rowtype;
  v_discount_amount integer := 0;
  v_has_physical boolean := false;
  v_stock      integer;
  v_price      integer;
  v_partner_commission integer := 0;
  v_partner_platform integer := 0;
  v_partner_revenue integer := 0;
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
    select ci.id, ci.product_id, ci.variant_id, ci.bundle_id, ci.quantity,
           ci.service_starts_at
    from public.cart_items ci
    where ci.cart_id = v_cart.id
    order by ci.created_at, ci.id
  loop
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

      v_has_physical := true;
      v_bundle_contents := '[]'::jsonb;

      for v_bundle_item in
        select bi.product_id, bi.variant_id, bp.partner_offer_id
        from public.bundle_items bi
        join public.products bp on bp.id = bi.product_id
        where bi.bundle_id = v_bundle.id
        order by bi.product_id, bi.variant_id nulls first
      loop
        if v_bundle_item.partner_offer_id is not null then
          raise exception 'bundle_partner_unavailable' using errcode = '22023';
        end if;

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
        'bundle_contents', v_bundle_contents,
        'partner_offer_id', null,
        'partner_source_store_id', null,
        'partner_commission_amount', 0,
        'partner_source_revenue', 0,
        'service_starts_at', null
      );

      continue;
    end if;

    select p.* into v_product
    from public.products p
    where p.id = v_item.product_id
    for update;

    if v_product.id is null
      or v_product.store_id <> v_store.id
      or v_product.status <> 'published' then
      raise exception 'product_unavailable' using errcode = '22023';
    end if;

    if array_length(v_product.shipping_countries, 1) is not null
      and not (v_country = any (v_product.shipping_countries)) then
      raise exception 'country_not_allowed' using errcode = '22023';
    end if;

    if v_product.partner_offer_id is not null then
      v_has_physical := true;

      select p.* into v_source
      from public.products p
      where p.id = v_product.source_product_id
      for update;

      if v_source.id is null
        or v_source.store_id <> v_product.partner_source_store_id
        or v_source.status <> 'published' then
        raise exception 'partner_product_unavailable' using errcode = '22023';
      end if;

      if coalesce(v_source.stock_quantity, 0) < v_item.quantity then
        raise exception 'partner_out_of_stock:%', v_source.name
          using errcode = '22023';
      end if;

      update public.products
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_source.id;

      update public.products
      set stock_quantity = greatest(coalesce(stock_quantity, 0) - v_item.quantity, 0)
      where id = v_product.id;

      select s.* into v_source_store
      from public.stores s
      where s.id = v_product.partner_source_store_id;

      v_price := v_product.price_amount;
      v_partner_commission := round(
        (v_price * v_item.quantity) * v_product.partner_commission_bps / 10000.0
      )::integer;
      v_partner_platform := least(
        round(
          (v_price * v_item.quantity) * coalesce(v_source_store.commission_bps, 1000) / 10000.0
        )::integer,
        (v_price * v_item.quantity) - v_partner_commission
      );
      v_partner_revenue := greatest(
        (v_price * v_item.quantity) - v_partner_commission - v_partner_platform,
        0
      );

      select m.object_key into v_image_key
      from public.product_images pi
      join public.media_assets m on m.id = pi.media_id
      where pi.product_id = v_product.id
      order by pi.position
      limit 1;

      v_subtotal := v_subtotal + (v_price * v_item.quantity);

      v_lines := v_lines || jsonb_build_object(
        'product_id', v_product.id,
        'variant_id', null,
        'bundle_id', null,
        'product_name', v_product.name,
        'variant_label', null,
        'sku', null,
        'image_key', v_image_key,
        'product_type', 'physical',
        'unit_price', v_price,
        'quantity', v_item.quantity,
        'line_total', v_price * v_item.quantity,
        'bundle_contents', '[]'::jsonb,
        'partner_offer_id', v_product.partner_offer_id,
        'partner_source_store_id', v_product.partner_source_store_id,
        'partner_commission_amount', v_partner_commission,
        'partner_source_revenue', v_partner_revenue,
        'service_starts_at', null
      );

      continue;
    end if;

    if v_product.product_type = 'service' then
      if v_item.service_starts_at is null then
        raise exception 'service_slot_required' using errcode = '22023';
      end if;

      if v_item.service_starts_at <= now() then
        raise exception 'service_slot_invalid' using errcode = '22023';
      end if;

      if exists (
        select 1 from public.bookings b
        where b.product_id = v_product.id
          and b.starts_at = v_item.service_starts_at
          and b.status = 'confirmed'
      ) then
        raise exception 'service_slot_taken' using errcode = '22023';
      end if;

      v_price := v_product.price_amount;
      v_label := null;
    elsif v_item.variant_id is not null then
      v_has_physical := true;

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

      if v_product.product_type = 'physical' then
        v_has_physical := true;

        if v_stock < v_item.quantity then
          raise exception 'out_of_stock' using errcode = '22023';
        end if;

        update public.products
        set stock_quantity = stock_quantity - v_item.quantity
        where id = v_product.id;
      end if;
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
      'bundle_contents', '[]'::jsonb,
      'partner_offer_id', null,
      'partner_source_store_id', null,
      'partner_commission_amount', 0,
      'partner_source_revenue', 0,
      'service_starts_at',
        case when v_product.product_type = 'service'
          then v_item.service_starts_at
          else null
        end
    );
  end loop;

  v_shipping := case
    when v_has_physical then v_store.shipping_flat_amount
    else 0
  end;

  if v_cart.discount_code_id is not null then
    select d.* into v_discount
    from public.discount_codes d
    where d.id = v_cart.discount_code_id
      and d.store_id = v_store.id
    for update;

    if v_discount.id is null
      or not v_discount.active
      or (v_discount.starts_at is not null and v_discount.starts_at > now())
      or (v_discount.expires_at is not null and v_discount.expires_at <= now())
      or (v_discount.max_uses is not null and v_discount.uses_count >= v_discount.max_uses)
      or v_subtotal < v_discount.min_subtotal then
      raise exception 'discount_invalid' using errcode = '22023';
    end if;

    if v_discount.kind = 'percent' then
      v_discount_amount := least(
        round(v_subtotal * v_discount.value / 100.0)::int,
        v_subtotal
      );
    else
      v_discount_amount := least(v_discount.value, v_subtotal);
    end if;

    update public.discount_codes
    set uses_count = uses_count + 1
    where id = v_discount.id;
  end if;

  v_total := v_subtotal - v_discount_amount + v_shipping;

  select coalesce(max(o.number), 0) + 1 into v_number
  from public.orders o
  where o.store_id = v_store.id;

  insert into public.orders (
    store_id, number, status, payment_status, payment_method, currency,
    subtotal_amount, discount_amount, discount_code, discount_code_id,
    shipping_amount, total_amount,
    customer_name, customer_email, customer_phone,
    shipping_country, shipping_city, shipping_address, shipping_extra,
    notes, idempotency_key
  )
  values (
    v_store.id, v_number, 'pending', 'pending', 'cod', v_store.currency,
    v_subtotal, v_discount_amount, nullif(v_discount.code, ''),
    v_discount.id, v_shipping, v_total,
    v_name, v_email, v_phone,
    v_country, v_city, v_address, v_extra,
    v_notes, p_idempotency_key
  )
  returning id, public_token into v_order_id, v_order_token;

  if v_discount.id is not null then
    insert into public.discount_redemptions (
      store_id, discount_id, order_id, code, amount
    )
    values (
      v_store.id, v_discount.id, v_order_id, v_discount.code, v_discount_amount
    );
  end if;

  insert into public.order_items (
    order_id, store_id, product_id, variant_id, bundle_id, product_name,
    variant_label, sku, image_key, product_type, unit_price, quantity,
    line_total, bundle_contents, partner_offer_id, partner_source_store_id,
    partner_commission_amount, partner_source_revenue, service_starts_at
  )
  select
    v_order_id, v_store.id, item.product_id, item.variant_id, item.bundle_id,
    item.product_name, item.variant_label, item.sku, item.image_key,
    item.product_type, item.unit_price, item.quantity, item.line_total,
    coalesce(item.bundle_contents, '[]'::jsonb), item.partner_offer_id,
    item.partner_source_store_id, item.partner_commission_amount,
    item.partner_source_revenue, item.service_starts_at
  from jsonb_to_recordset(v_lines) as item(
    product_id uuid, variant_id uuid, bundle_id uuid, product_name text,
    variant_label text, sku text, image_key text, product_type text,
    unit_price integer, quantity integer, line_total integer,
    bundle_contents jsonb, partner_offer_id uuid,
    partner_source_store_id uuid, partner_commission_amount integer,
    partner_source_revenue integer, service_starts_at timestamptz
  );

  insert into public.partner_sales (
    order_id, order_item_id, offer_id, source_store_id, partner_store_id,
    product_id, amount, partner_commission, platform_commission, source_revenue
  )
  select
    oi.order_id, oi.id, oi.partner_offer_id, oi.partner_source_store_id,
    oi.store_id, oi.product_id, oi.line_total,
    oi.partner_commission_amount,
    least(
      round(oi.line_total * coalesce(s.commission_bps, 1000) / 10000.0)::integer,
      greatest(oi.line_total - oi.partner_commission_amount, 0)
    ),
    oi.partner_source_revenue
  from public.order_items oi
  join public.stores s on s.id = oi.partner_source_store_id
  where oi.order_id = v_order_id
    and oi.partner_offer_id is not null;

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order_id,
    v_store.id,
    'created',
    jsonb_build_object(
      'payment_method', 'cod',
      'total', v_total,
      'discount_code', v_discount.code,
      'discount_amount', v_discount_amount
    )
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
