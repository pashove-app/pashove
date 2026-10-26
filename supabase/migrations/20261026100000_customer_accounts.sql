-- Comptes clients : rattachement des commandes invitées et lecture de l'historique.
--
-- Un client s'authentifie avec Supabase Auth (le même annuaire que les
-- marchands). Ses commandes restent rattachées à la boutique, mais il ne voit
-- que celles dont l'e-mail correspond au sien.

alter table public.orders
  add column customer_user_id uuid references auth.users (id) on delete set null;

alter table public.order_items
  add column service_starts_at timestamptz;

create index orders_customer_user_idx
  on public.orders (customer_user_id, created_at desc);

create index orders_customer_email_idx
  on public.orders (store_id, lower(customer_email));

/** Rattache les commandes invitées à l'adresse du compte connecté. */
create or replace function public.claim_guest_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_count integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  select u.email::text into v_email
  from auth.users u
  where u.id = v_uid;

  if v_email is null or v_email = '' then
    return 0;
  end if;

  update public.orders o
  set customer_user_id = v_uid
  where o.customer_user_id is null
    and lower(o.customer_email) = lower(v_email);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.claim_guest_orders()
  from public, anon, authenticated;
grant execute on function public.claim_guest_orders()
  to authenticated;

/** Les commandes du client connecté dans une boutique. */
create or replace function public.customer_orders(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'token', o.public_token,
          'number', o.number,
          'status', o.status,
          'paymentStatus', o.payment_status,
          'currency', o.currency,
          'total', o.total_amount,
          'createdAt', o.created_at,
          'itemCount', (
            select coalesce(sum(oi.quantity), 0)::int
            from public.order_items oi
            where oi.order_id = o.id
          )
        )
        order by o.created_at desc
      )
      from public.orders o
      join public.stores s on s.id = o.store_id
      where s.slug = lower(btrim(p_slug))
        and o.customer_user_id = v_uid
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.customer_orders(text)
  from public, anon, authenticated;
grant execute on function public.customer_orders(text)
  to authenticated;

/** Détail d'une commande du client connecté. */
create or replace function public.customer_order(
  p_slug     text,
  p_order_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_order public.orders%rowtype;
begin
  if v_uid is null then
    return null;
  end if;

  select o.* into v_order
  from public.orders o
  join public.stores s on s.id = o.store_id
  where o.id = p_order_id
    and s.slug = lower(btrim(p_slug))
    and o.customer_user_id = v_uid;

  if v_order.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_order.id,
    'number', v_order.number,
    'status', v_order.status,
    'paymentStatus', v_order.payment_status,
    'paymentMethod', v_order.payment_method,
    'currency', v_order.currency,
    'subtotal', v_order.subtotal_amount,
    'discount', v_order.discount_amount,
    'discountCode', v_order.discount_code,
    'shipping', v_order.shipping_amount,
    'total', v_order.total_amount,
    'createdAt', v_order.created_at,
    'customerName', v_order.customer_name,
    'country', v_order.shipping_country,
    'city', v_order.shipping_city,
    'address', v_order.shipping_address,
    'extra', v_order.shipping_extra,
    'notes', v_order.notes,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'name', oi.product_name,
            'variantLabel', oi.variant_label,
            'sku', oi.sku,
            'imageKey', oi.image_key,
            'productType', oi.product_type,
            'unitPrice', oi.unit_price,
            'quantity', oi.quantity,
            'lineTotal', oi.line_total,
            'bundleContents', oi.bundle_contents,
            'serviceStartsAt', oi.service_starts_at
          )
          order by oi.id
        )
        from public.order_items oi
        where oi.order_id = v_order.id
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke execute on function public.customer_order(text, uuid)
  from public, anon, authenticated;
grant execute on function public.customer_order(text, uuid)
  to authenticated;
