-- PASHOVE — L2b : dispatch des courses (10 secondes)
--
-- Une commande payée en ligne, dans une boutique en mode Pashove Delivery et
-- dans un pays desservi, crée une course. Le dispatch propose la course à un
-- livreur approuvé et en ligne du pays, pendant 10 secondes. Refus ou timeout :
-- le livreur est exclu et la course passe au suivant.

alter table public.couriers
  add column if not exists is_online boolean not null default false;

alter table public.deliveries
  add column if not exists offer_expires_at timestamptz,
  add column if not exists excluded_couriers uuid[] not null default '{}';

/* ------------------------------------------------------------------ *
 *  Création automatique à l'encaissement
 * ------------------------------------------------------------------ */

create or replace function public.create_delivery_for_paid_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
  v_delivery_id uuid;
begin
  if NEW.payment_status <> 'paid' then
    return NEW;
  end if;

  if TG_OP = 'UPDATE' and OLD.payment_status = 'paid' then
    return NEW;
  end if;

  if NEW.payment_method = 'cod' then
    return NEW;
  end if;

  select * into v_store from public.stores where id = NEW.store_id;

  if v_store.id is null
     or v_store.delivery_mode <> 'pashove'
     or not (NEW.shipping_country = any (v_store.delivery_countries)) then
    return NEW;
  end if;

  if not exists (
    select 1 from public.order_items oi
    where oi.order_id = NEW.id
      and oi.product_type in ('physical', 'bundle')
  ) then
    return NEW;
  end if;

  insert into public.deliveries (
    order_id, store_id, status, fee_amount, currency
  )
  values (
    NEW.id, NEW.store_id, 'searching', NEW.shipping_amount, NEW.currency
  )
  on conflict (order_id) do nothing;

  select id into v_delivery_id
  from public.deliveries
  where order_id = NEW.id;

  if v_delivery_id is not null then
    perform public.dispatch_delivery(v_delivery_id);
  end if;

  return NEW;
end;
$$;

revoke execute on function public.create_delivery_for_paid_order()
  from public, anon, authenticated;

drop trigger if exists orders_create_delivery on public.orders;
create trigger orders_create_delivery
  after insert or update of payment_status on public.orders
  for each row execute function public.create_delivery_for_paid_order();

/* ------------------------------------------------------------------ *
 *  Dispatch
 * ------------------------------------------------------------------ */

create or replace function public.dispatch_delivery(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_order public.orders%rowtype;
  v_courier uuid;
begin
  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_delivery.id is null
     or v_delivery.status not in ('searching', 'assigned') then
    return;
  end if;

  select * into v_order from public.orders where id = v_delivery.order_id;

  -- Une offre expirée est retirée au livreur avant de chercher le suivant.
  if v_delivery.status = 'assigned'
     and v_delivery.offer_expires_at is not null
     and v_delivery.offer_expires_at <= now() then
    update public.deliveries
    set excluded_couriers = array_append(excluded_couriers, courier_id),
        courier_id = null,
        offer_expires_at = null,
        status = 'searching'
    where id = p_delivery_id;

    select * into v_delivery from public.deliveries where id = p_delivery_id;
  elsif v_delivery.status = 'assigned' then
    return;
  end if;

  select c.id into v_courier
  from public.couriers c
  where c.status = 'approved'
    and c.is_online
    and not (c.id = any (v_delivery.excluded_couriers))
    and not exists (
      select 1 from public.deliveries d2
      where d2.courier_id = c.id
        and d2.status in ('assigned', 'accepted')
    )
    and exists (
      select 1
      from public.store_members sm
      join public.stores s on s.id = sm.store_id
      where sm.user_id = c.user_id
        and sm.role = 'owner'
        and s.status = 'active'
        and s.country = v_order.shipping_country
    )
  order by c.created_at
  limit 1;

  if v_courier is null then
    update public.deliveries
    set status = 'searching',
        courier_id = null,
        offer_expires_at = null
    where id = p_delivery_id;
    return;
  end if;

  update public.deliveries
  set status = 'assigned',
      courier_id = v_courier,
      offer_expires_at = now() + interval '10 seconds'
  where id = p_delivery_id;
end;
$$;

revoke execute on function public.dispatch_delivery(uuid)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Réponse du livreur
 * ------------------------------------------------------------------ */

create or replace function public.accept_delivery(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_courier public.couriers%rowtype;
  v_delivery public.deliveries%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_courier from public.couriers where user_id = v_user;

  if v_courier.id is null or v_courier.status <> 'approved' then
    raise exception 'not_a_courier' using errcode = '42501';
  end if;

  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_delivery.id is null
     or v_delivery.courier_id <> v_courier.id
     or v_delivery.status <> 'assigned' then
    raise exception 'not_assigned' using errcode = '22023';
  end if;

  if v_delivery.offer_expires_at is null
     or v_delivery.offer_expires_at <= now() then
    perform public.expire_delivery_offer(p_delivery_id);
    raise exception 'offer_expired' using errcode = '22023';
  end if;

  update public.deliveries
  set status = 'accepted',
      accepted_at = now(),
      offer_expires_at = null
  where id = p_delivery_id;

  return jsonb_build_object('status', 'accepted');
end;
$$;

revoke execute on function public.accept_delivery(uuid)
  from public, anon, authenticated;
grant execute on function public.accept_delivery(uuid)
  to authenticated;

create or replace function public.decline_delivery(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_courier public.couriers%rowtype;
  v_delivery public.deliveries%rowtype;
begin
  select * into v_courier from public.couriers where user_id = v_user;

  if v_courier.id is null then
    raise exception 'not_a_courier' using errcode = '42501';
  end if;

  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_delivery.id is null
     or v_delivery.courier_id <> v_courier.id
     or v_delivery.status <> 'assigned' then
    raise exception 'not_assigned' using errcode = '22023';
  end if;

  update public.deliveries
  set excluded_couriers = array_append(excluded_couriers, v_courier.id),
      courier_id = null,
      offer_expires_at = null,
      status = 'searching'
  where id = p_delivery_id;

  perform public.dispatch_delivery(p_delivery_id);

  return jsonb_build_object('status', 'declined');
end;
$$;

revoke execute on function public.decline_delivery(uuid)
  from public, anon, authenticated;
grant execute on function public.decline_delivery(uuid)
  to authenticated;

create or replace function public.expire_delivery_offer(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery public.deliveries%rowtype;
begin
  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_delivery.id is null
     or v_delivery.status <> 'assigned'
     or v_delivery.courier_id is null
     or v_delivery.offer_expires_at is null
     or v_delivery.offer_expires_at > now() then
    return;
  end if;

  update public.deliveries
  set excluded_couriers = array_append(excluded_couriers, v_delivery.courier_id),
      courier_id = null,
      offer_expires_at = null,
      status = 'searching'
  where id = p_delivery_id;

  perform public.dispatch_delivery(p_delivery_id);
end;
$$;

revoke execute on function public.expire_delivery_offer(uuid)
  from public, anon, authenticated;
grant execute on function public.expire_delivery_offer(uuid)
  to authenticated;

create or replace function public.expire_delivery_offers()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_count integer := 0;
begin
  for v_row in
    select id from public.deliveries
    where status = 'assigned'
      and offer_expires_at is not null
      and offer_expires_at <= now()
  loop
    perform public.expire_delivery_offer(v_row.id);
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('expired', v_count);
end;
$$;

revoke execute on function public.expire_delivery_offers()
  from public, anon, authenticated;
grant execute on function public.expire_delivery_offers()
  to service_role;

create or replace function public.dispatch_waiting_deliveries()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_count integer := 0;
begin
  for v_row in
    select id from public.deliveries
    where status = 'searching'
    order by created_at
    limit 50
  loop
    perform public.dispatch_delivery(v_row.id);
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('dispatched', v_count);
end;
$$;

revoke execute on function public.dispatch_waiting_deliveries()
  from public, anon, authenticated;
grant execute on function public.dispatch_waiting_deliveries()
  to service_role;

/* ------------------------------------------------------------------ *
 *  Disponibilité du livreur
 * ------------------------------------------------------------------ */

create or replace function public.set_courier_online(p_online boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_courier public.couriers%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_courier from public.couriers where user_id = v_user;

  if v_courier.id is null or v_courier.status <> 'approved' then
    raise exception 'not_approved' using errcode = '42501';
  end if;

  update public.couriers
  set is_online = coalesce(p_online, false),
      updated_at = now()
  where id = v_courier.id;

  if coalesce(p_online, false) then
    perform public.dispatch_waiting_deliveries();
  end if;

  return jsonb_build_object('online', coalesce(p_online, false));
end;
$$;

revoke execute on function public.set_courier_online(boolean)
  from public, anon, authenticated;
grant execute on function public.set_courier_online(boolean)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture pour l'espace livreur
 * ------------------------------------------------------------------ */

create or replace function public.my_courier_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row public.couriers%rowtype;
begin
  if v_user is null then
    return null;
  end if;

  select * into v_row from public.couriers where user_id = v_user;

  if v_row.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'fullName', v_row.full_name,
    'phone', v_row.phone,
    'email', v_row.email,
    'status', v_row.status,
    'isOnline', v_row.is_online,
    'rejectionReason', v_row.rejection_reason,
    'createdAt', v_row.created_at,
    'reviewedAt', v_row.reviewed_at
  );
end;
$$;

revoke execute on function public.my_courier_profile()
  from public, anon, authenticated;
grant execute on function public.my_courier_profile()
  to authenticated;

create or replace function public.my_courier_deliveries()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_courier_id uuid;
  v_offer jsonb;
  v_active jsonb;
begin
  if v_user is null then
    return jsonb_build_object('offer', null, 'active', null);
  end if;

  select id into v_courier_id from public.couriers where user_id = v_user;

  if v_courier_id is null then
    return jsonb_build_object('offer', null, 'active', null);
  end if;

  select jsonb_build_object(
    'id', d.id,
    'status', d.status,
    'feeAmount', d.fee_amount,
    'currency', d.currency,
    'offerExpiresAt', d.offer_expires_at,
    'createdAt', d.created_at,
    'orderNumber', o.number,
    'storeName', s.name,
    'customerName', o.customer_name,
    'customerPhone', o.customer_phone,
    'shippingCountry', o.shipping_country,
    'shippingCity', o.shipping_city,
    'shippingAddress', o.shipping_address,
    'shippingExtra', o.shipping_extra,
    'notes', o.notes
  )
  into v_offer
  from public.deliveries d
  join public.orders o on o.id = d.order_id
  join public.stores s on s.id = d.store_id
  where d.courier_id = v_courier_id
    and d.status = 'assigned'
  order by d.created_at
  limit 1;

  select jsonb_build_object(
    'id', d.id,
    'status', d.status,
    'feeAmount', d.fee_amount,
    'currency', d.currency,
    'acceptedAt', d.accepted_at,
    'createdAt', d.created_at,
    'orderNumber', o.number,
    'storeName', s.name,
    'customerName', o.customer_name,
    'customerPhone', o.customer_phone,
    'shippingCountry', o.shipping_country,
    'shippingCity', o.shipping_city,
    'shippingAddress', o.shipping_address,
    'shippingExtra', o.shipping_extra,
    'notes', o.notes
  )
  into v_active
  from public.deliveries d
  join public.orders o on o.id = d.order_id
  join public.stores s on s.id = d.store_id
  where d.courier_id = v_courier_id
    and d.status = 'accepted'
  order by d.accepted_at desc
  limit 1;

  return jsonb_build_object('offer', v_offer, 'active', v_active);
end;
$$;

revoke execute on function public.my_courier_deliveries()
  from public, anon, authenticated;
grant execute on function public.my_courier_deliveries()
  to authenticated;
