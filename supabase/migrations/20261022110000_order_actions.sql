-- Actions de commande : avancement, encaissement COD et annulation.

alter table public.orders
  add column tracking_number text
    check (
      tracking_number is null
      or char_length(btrim(tracking_number)) between 1 and 100
    );

/* ------------------------------------------------------------------ *
 *  Avancement d'une étape, jamais deux
 * ------------------------------------------------------------------ */

create or replace function public.advance_order_status(
  p_order_id uuid,
  p_tracking text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order  public.orders%rowtype;
  v_next   text;
  v_track  text := nullif(btrim(coalesce(p_tracking, '')), '');
begin
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_order.id is null or not public.is_store_member(v_order.store_id) then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  v_next := case v_order.status
    when 'pending'    then 'confirmed'
    when 'confirmed'  then 'processing'
    when 'processing' then 'shipped'
    when 'shipped'    then 'delivered'
    else null
  end;

  if v_next is null then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if v_track is not null and char_length(v_track) > 100 then
    raise exception 'tracking_too_long' using errcode = '22023';
  end if;

  update public.orders
  set status = v_next,
      confirmed_at = case
        when v_next = 'confirmed' then coalesce(confirmed_at, now())
        else confirmed_at
      end,
      tracking_number = case
        when v_next = 'shipped' then v_track
        else tracking_number
      end
  where id = p_order_id;

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    p_order_id,
    v_order.store_id,
    'status_changed',
    jsonb_build_object('from', v_order.status, 'to', v_next)
      || case
        when v_next = 'shipped' and v_track is not null
          then jsonb_build_object('tracking', v_track)
        else '{}'::jsonb
      end
  );

  return jsonb_build_object('status', v_next);
end;
$$;

revoke execute on function public.advance_order_status(uuid, text)
  from public, anon, authenticated;
grant execute on function public.advance_order_status(uuid, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Encaissement COD, idempotent
 * ------------------------------------------------------------------ */

create or replace function public.mark_order_paid(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_order.id is null or not public.is_store_member(v_order.store_id) then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object('status', 'paid', 'already', true);
  end if;

  if v_order.payment_method <> 'cod' or v_order.payment_status <> 'pending' then
    raise exception 'payment_not_pending' using errcode = '22023';
  end if;

  update public.orders
  set payment_status = 'paid'
  where id = p_order_id;

  update public.payments
  set status = 'captured'
  where order_id = p_order_id
    and provider = 'cod'
    and status in ('pending', 'authorized');

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    p_order_id,
    v_order.store_id,
    'payment_collected',
    jsonb_build_object('method', 'cod', 'amount', v_order.total_amount)
  );

  return jsonb_build_object('status', 'paid');
end;
$$;

revoke execute on function public.mark_order_paid(uuid)
  from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Annulation avant expédition, avec restockage unique
 * ------------------------------------------------------------------ */

create or replace function public.cancel_order(
  p_order_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item  record;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_order.id is null or not public.is_store_member(v_order.store_id) then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  if v_order.status = 'cancelled' then
    return jsonb_build_object('status', 'cancelled', 'already', true);
  end if;

  if v_order.status in ('shipped', 'delivered') then
    raise exception 'cancel_not_allowed' using errcode = '22023';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception 'refund_required' using errcode = '22023';
  end if;

  for v_item in
    select oi.product_id, oi.variant_id, oi.variant_label,
           oi.product_type, oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
  loop
    if v_item.product_type <> 'physical' then
      continue;
    end if;

    if v_item.variant_id is not null then
      update public.product_variants
      set stock_quantity = stock_quantity + v_item.quantity
      where id = v_item.variant_id;
    elsif v_item.product_id is not null and v_item.variant_label is null then
      update public.products
      set stock_quantity = coalesce(stock_quantity, 0) + v_item.quantity
      where id = v_item.product_id;
    end if;
  end loop;

  update public.orders
  set status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now()),
      payment_status = case
        when payment_status = 'pending' then 'failed'
        else payment_status
      end
  where id = p_order_id;

  update public.payments
  set status = 'failed'
  where order_id = p_order_id
    and provider = 'cod'
    and status in ('pending', 'authorized');

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    p_order_id,
    v_order.store_id,
    'cancelled',
    jsonb_build_object('reason', v_reason)
  );

  return jsonb_build_object('status', 'cancelled');
end;
$$;

revoke execute on function public.cancel_order(uuid, text)
  from public, anon, authenticated;
grant execute on function public.cancel_order(uuid, text)
  to authenticated;
