-- PASHOVE — Compensation d'un paiement en ligne échoué
--
-- Un échec SasPay ne doit jamais laisser une commande pending, du stock
-- consommé et un panier converti. Cette migration ajoute :
--   * les colonnes payment_phone et stock_restored_at sur orders ;
--   * fail_online_order : marque la commande failed, restaure le stock,
--     rouvre (ou recrée) le panier et renvoie son token ;
--   * fail_saspay_payment : délègue à fail_online_order (webhook + cron) ;
--   * has_recent_pending_payment : garde-fou de 5 minutes par téléphone ;
--   * set_order_payment_phone : mémorise le numéro Mobile Money utilisé.

alter table public.orders
  add column payment_phone text,
  add column stock_restored_at timestamptz;

create index orders_pending_phone_idx
  on public.orders (store_id, created_at desc)
  where payment_status = 'pending';

create or replace function public.set_order_payment_phone(
  p_order_token uuid,
  p_phone       text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set payment_phone = nullif(btrim(coalesce(p_phone, '')), '')
  where public_token = p_order_token
    and payment_status = 'pending';
end;
$$;

revoke execute on function public.set_order_payment_phone(uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_order_payment_phone(uuid, text)
  to service_role;

/**
 * Un même numéro ne doit pas lancer deux demandes de paiement à moins de
 * cinq minutes d'intervalle. On compare les 8 derniers chiffres pour ignorer
 * les formats (+223, espaces, indicatif).
 */
create or replace function public.has_recent_pending_payment(
  p_store_id uuid,
  p_phone    text,
  p_minutes  integer default 5
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.orders o
    where o.store_id = p_store_id
      and o.payment_status = 'pending'
      and o.payment_method <> 'cod'
      and o.created_at >= now() - make_interval(mins => greatest(coalesce(p_minutes, 5), 1))
      and right(
        regexp_replace(coalesce(o.payment_phone, o.customer_phone), '\D', '', 'g'),
        8
      ) = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 8)
  );
$$;

revoke execute on function public.has_recent_pending_payment(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.has_recent_pending_payment(uuid, text, integer)
  to service_role;

/**
 * Compense une commande en ligne non payée.
 *
 * Idempotent : le stock n'est restauré qu'une fois (stock_restored_at), mais
 * le panier peut être rouvert à chaque appel pour permettre la reprise.
 */
create or replace function public.fail_online_order(
  p_order_token uuid,
  p_reason      text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_item    public.order_items%rowtype;
  v_part    record;
  v_cart    public.carts%rowtype;
  v_first   boolean := false;
begin
  select * into v_order
  from public.orders
  where public_token = p_order_token
  for update;

  if v_order.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'order_unknown');
  end if;

  if v_order.payment_method = 'cod' then
    return jsonb_build_object('status', 'ignored', 'reason', 'cod_order');
  end if;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object('status', 'ignored', 'reason', 'already_paid');
  end if;

  select * into v_payment
  from public.payments
  where order_id = v_order.id
    and provider = 'saspay'
  order by created_at desc
  limit 1
  for update;

  if v_payment.id is not null and v_payment.status = 'captured' then
    return jsonb_build_object('status', 'ignored', 'reason', 'already_captured');
  end if;

  if v_order.stock_restored_at is null then
    v_first := true;

    for v_item in
      select * from public.order_items where order_id = v_order.id
    loop
      if v_item.bundle_id is not null then
        for v_part in
          select product_id, variant_id
          from public.bundle_items
          where bundle_id = v_item.bundle_id
        loop
          if v_part.variant_id is not null then
            update public.product_variants
            set stock_quantity = stock_quantity + v_item.quantity
            where id = v_part.variant_id;
          elsif v_part.product_id is not null then
            update public.products
            set stock_quantity = stock_quantity + v_item.quantity
            where id = v_part.product_id
              and product_type = 'physical';
          end if;
        end loop;
      elsif v_item.variant_id is not null then
        update public.product_variants
        set stock_quantity = stock_quantity + v_item.quantity
        where id = v_item.variant_id;
      elsif v_item.product_id is not null then
        update public.products
        set stock_quantity = stock_quantity + v_item.quantity
        where id = v_item.product_id
          and product_type = 'physical';
      end if;
    end loop;

    update public.orders
    set stock_restored_at = now()
    where id = v_order.id;
  end if;

  update public.payments
  set status = 'failed'
  where order_id = v_order.id
    and provider = 'saspay'
    and status in ('pending', 'authorized');

  update public.orders
  set payment_status = 'failed',
      status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now())
  where id = v_order.id
    and payment_status <> 'paid';

  select * into v_cart
  from public.carts
  where checkout_key = v_order.idempotency_key
    and store_id = v_order.store_id
  for update;

  if v_cart.id is null then
    insert into public.carts (store_id, status, expires_at)
    values (v_order.store_id, 'open', now() + interval '24 hours')
    returning * into v_cart;

    insert into public.cart_items (
      cart_id, store_id, product_id, variant_id, bundle_id, quantity,
      service_starts_at
    )
    select
      v_cart.id, v_order.store_id, oi.product_id, oi.variant_id,
      oi.bundle_id, oi.quantity, oi.service_starts_at
    from public.order_items oi
    where oi.order_id = v_order.id
    on conflict do nothing;
  else
    update public.carts
    set status = 'open',
        expires_at = greatest(expires_at, now() + interval '24 hours')
    where id = v_cart.id;
  end if;

  if v_first then
    insert into public.order_events (order_id, store_id, type, payload)
    values (
      v_order.id,
      v_order.store_id,
      'payment_failed',
      jsonb_build_object(
        'provider', 'saspay',
        'reason', coalesce(nullif(btrim(p_reason), ''), 'payment_failed'),
        'stock_restored', true
      )
    );
  end if;

  return jsonb_build_object(
    'status', 'failed',
    'already', not v_first,
    'cartToken', v_cart.token
  );
end;
$$;

revoke execute on function public.fail_online_order(uuid, text)
  from public, anon, authenticated;
grant execute on function public.fail_online_order(uuid, text)
  to service_role;

/**
 * Le webhook et le cron passent par la référence SasPay. On retrouve la
 * commande et on applique la même compensation que le checkout.
 */
create or replace function public.fail_saspay_payment(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_token uuid;
begin
  select o.public_token into v_order_token
  from public.payments p
  join public.orders o on o.id = p.order_id
  where p.reference = btrim(p_reference)
    and p.provider = 'saspay';

  if v_order_token is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'payment_unknown');
  end if;

  return public.fail_online_order(v_order_token, 'saspay_failed');
end;
$$;

revoke execute on function public.fail_saspay_payment(text)
  from public, anon, authenticated;
grant execute on function public.fail_saspay_payment(text)
  to service_role;
