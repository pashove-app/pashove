-- PASHOVE — Le COD est réservé à la livraison autonome
--
-- Une boutique en Pashove Delivery est payée en ligne : la course ne peut pas
-- être encaissée à la livraison, et l'application ne propose plus le COD dans
-- le checkout. Cette règle est aussi appliquée en base pour qu'un appel direct
-- à la RPC ne puisse pas créer une commande COD sur une boutique Pashove.

create or replace function public.place_cod_order(
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
  v_result        jsonb;
  v_order_id      uuid;
  v_has_physical  boolean;
  v_delivery_mode text;
begin
  select s.delivery_mode into v_delivery_mode
  from public.carts c
  join public.stores s on s.id = c.store_id
  where c.token = p_token;

  if v_delivery_mode = 'pashove' then
    raise exception 'cod_unavailable' using errcode = '22023';
  end if;

  v_result := public.place_order(p_token, p_customer, p_idempotency_key);
  v_order_id := (v_result->>'orderId')::uuid;

  select exists (
    select 1
    from public.order_items oi
    where oi.order_id = v_order_id
      and oi.product_type in ('physical', 'bundle')
  ) into v_has_physical;

  update public.orders
  set status = case when v_has_physical then 'confirmed' else 'delivered' end,
      payment_status = 'paid',
      confirmed_at = coalesce(confirmed_at, now()),
      shipping_country = case when v_has_physical then shipping_country else '' end,
      shipping_city = case when v_has_physical then shipping_city else '' end,
      shipping_address = case when v_has_physical then shipping_address else '' end,
      shipping_extra = case when v_has_physical then shipping_extra else null end
  where id = v_order_id
    and payment_status = 'pending';

  update public.payments
  set status = 'captured'
  where order_id = v_order_id
    and provider = 'cod'
    and status = 'pending';

  if not exists (
    select 1
    from public.order_events e
    where e.order_id = v_order_id
      and e.type = 'payment_collected'
  ) then
    insert into public.order_events (order_id, store_id, type, payload)
    select
      o.id,
      o.store_id,
      'payment_collected',
      jsonb_build_object('method', 'cod', 'amount', o.total_amount)
    from public.orders o
    where o.id = v_order_id;
  end if;

  if not v_has_physical and not exists (
    select 1
    from public.order_events e
    where e.order_id = v_order_id
      and e.type = 'status_changed'
      and e.payload->>'to' = 'delivered'
  ) then
    insert into public.order_events (order_id, store_id, type, payload)
    select
      o.id,
      o.store_id,
      'status_changed',
      jsonb_build_object('from', 'pending', 'to', 'delivered', 'automatic', true)
    from public.orders o
    where o.id = v_order_id;
  end if;

  return v_result;
end;
$$;

revoke execute on function public.place_cod_order(uuid, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.place_cod_order(uuid, jsonb, uuid)
  to anon, authenticated;
