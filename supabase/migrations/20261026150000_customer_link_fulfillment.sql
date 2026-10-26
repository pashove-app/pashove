-- Rattachement fiable des commandes au compte client et traitement automatique
-- des commandes sans objet physique.
--
-- 1. `link_order_to_customer` rattache une commande au compte connecté à partir
--    du jeton public de la commande. Le jeton est remis au seul acheteur, ce qui
--    permet de rattacher un achat invité sans dépendre de l'e-mail saisi.
-- 2. Une commande composée uniquement de produits numériques ou de services est
--    livrée immédiatement : pas d'adresse, pas d'expédition, statut « delivered ».
-- 3. `advance_order_status` ne fait plus passer une commande non physique par
--    les étapes « préparation / expédition ».

create or replace function public.link_order_to_customer(p_token uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_order public.orders%rowtype;
begin
  if v_uid is null or p_token is null then
    return 0;
  end if;

  select o.* into v_order
  from public.orders o
  where o.public_token = p_token
  for update;

  if v_order.id is null then
    return 0;
  end if;

  if v_order.customer_user_id is not null
     and v_order.customer_user_id <> v_uid then
    return 0;
  end if;

  update public.orders
  set customer_user_id = v_uid
  where id = v_order.id;

  update public.digital_entitlements
  set customer_user_id = v_uid
  where order_id = v_order.id
    and customer_user_id is null;

  update public.bookings
  set customer_user_id = v_uid
  where order_id = v_order.id
    and customer_user_id is null;

  return 1;
end;
$$;

revoke execute on function public.link_order_to_customer(uuid)
  from public, anon, authenticated;
grant execute on function public.link_order_to_customer(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Checkout : livraison immédiate des commandes sans objet physique
 * ------------------------------------------------------------------ */

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
  v_result       jsonb;
  v_order_id     uuid;
  v_has_physical boolean;
begin
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

/* ------------------------------------------------------------------ *
 *  Avancement : saut des étapes physiques pour le numérique
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
  v_has_physical boolean;
begin
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_order.id is null or not public.is_store_member(v_order.store_id) then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  select exists (
    select 1
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.product_type in ('physical', 'bundle')
  ) into v_has_physical;

  if v_has_physical then
    v_next := case v_order.status
      when 'pending'    then 'confirmed'
      when 'confirmed'  then 'processing'
      when 'processing' then 'shipped'
      when 'shipped'    then 'delivered'
      else null
    end;
  else
    v_next := case
      when v_order.status in ('pending', 'confirmed', 'processing') then 'delivered'
      else null
    end;
    v_track := null;
  end if;

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
