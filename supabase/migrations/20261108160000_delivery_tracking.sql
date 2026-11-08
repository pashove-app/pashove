-- PASHOVE — L3 : suivi GPS des courses
--
-- Le livreur démarre la course depuis son espace : sa position du moment fixe
-- le point de ramassage. Chaque mise à jour (10 s) écrit la dernière position
-- dans `delivery_locations` et le serveur la diffuse aux clients abonnés au
-- canal de la commande.
--
-- La position n'est jamais lue directement par le public : `public_tracking`
-- exige le jeton public de la commande et ne renvoie que ce qu'il faut au
-- client (statut, boutique, livreur, coordonnées).

alter table public.deliveries
  add column if not exists started_at timestamptz,
  add column if not exists pickup_latitude double precision,
  add column if not exists pickup_longitude double precision,
  add column if not exists destination_latitude double precision,
  add column if not exists destination_longitude double precision;

create table if not exists public.delivery_locations (
  delivery_id uuid primary key references public.deliveries (id) on delete cascade,
  courier_id  uuid not null references public.couriers (id) on delete cascade,
  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  accuracy    double precision check (accuracy is null or accuracy >= 0),
  heading     double precision check (heading is null or (heading >= 0 and heading <= 360)),
  speed       double precision check (speed is null or speed >= 0),
  updated_at  timestamptz not null default now()
);

create index if not exists delivery_locations_updated_idx
  on public.delivery_locations (updated_at desc);

alter table public.delivery_locations enable row level security;
revoke all on public.delivery_locations from public, anon, authenticated;
grant select on public.delivery_locations to service_role;

/* ------------------------------------------------------------------ *
 *  Démarrage de la course
 * ------------------------------------------------------------------ */

create or replace function public.start_delivery(
  p_delivery_id uuid,
  p_latitude    double precision,
  p_longitude   double precision
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_courier  public.couriers%rowtype;
  v_delivery public.deliveries%rowtype;
  v_order    public.orders%rowtype;
  v_store    public.stores%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_latitude is null or p_longitude is null
     or p_latitude < -90 or p_latitude > 90
     or p_longitude < -180 or p_longitude > 180 then
    raise exception 'location_invalid' using errcode = '22023';
  end if;

  select * into v_courier from public.couriers where user_id = v_user;

  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_courier.id is null
     or v_delivery.id is null
     or v_delivery.courier_id <> v_courier.id
     or v_delivery.status <> 'accepted' then
    raise exception 'not_assigned' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = v_delivery.order_id;
  select * into v_store from public.stores where id = v_delivery.store_id;

  if v_delivery.started_at is null then
    update public.deliveries
    set started_at = now(),
        pickup_latitude = p_latitude,
        pickup_longitude = p_longitude
    where id = v_delivery.id;

    insert into public.delivery_locations (
      delivery_id, courier_id, latitude, longitude
    )
    values (v_delivery.id, v_courier.id, p_latitude, p_longitude)
    on conflict (delivery_id) do update
      set courier_id = excluded.courier_id,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          updated_at = now();
  end if;

  return jsonb_build_object(
    'status', 'started',
    'already', v_delivery.started_at is not null,
    'orderToken', v_order.public_token,
    'orderNumber', v_order.number,
    'storeName', v_store.name,
    'address', v_order.shipping_address,
    'extra', v_order.shipping_extra,
    'city', v_order.shipping_city,
    'country', v_order.shipping_country
  );
end;
$$;

revoke execute on function public.start_delivery(uuid, double precision, double precision)
  from public, anon, authenticated;
grant execute on function public.start_delivery(uuid, double precision, double precision)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Destination géocodée
 * ------------------------------------------------------------------ */

create or replace function public.set_delivery_destination(
  p_delivery_id uuid,
  p_latitude    double precision,
  p_longitude   double precision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_courier  public.couriers%rowtype;
  v_delivery public.deliveries%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_latitude is null or p_longitude is null
     or p_latitude < -90 or p_latitude > 90
     or p_longitude < -180 or p_longitude > 180 then
    raise exception 'location_invalid' using errcode = '22023';
  end if;

  select * into v_courier from public.couriers where user_id = v_user;

  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_courier.id is null
     or v_delivery.id is null
     or v_delivery.courier_id <> v_courier.id
     or v_delivery.status <> 'accepted' then
    raise exception 'not_assigned' using errcode = '22023';
  end if;

  update public.deliveries
  set destination_latitude = p_latitude,
      destination_longitude = p_longitude
  where id = p_delivery_id;
end;
$$;

revoke execute on function public.set_delivery_destination(uuid, double precision, double precision)
  from public, anon, authenticated;
grant execute on function public.set_delivery_destination(uuid, double precision, double precision)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Mise à jour de la position (10 s)
 * ------------------------------------------------------------------ */

create or replace function public.update_delivery_location(
  p_delivery_id uuid,
  p_latitude    double precision,
  p_longitude   double precision,
  p_accuracy    double precision default null,
  p_heading     double precision default null,
  p_speed       double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_courier  public.couriers%rowtype;
  v_delivery public.deliveries%rowtype;
  v_order    public.orders%rowtype;
  v_now      timestamptz := now();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_latitude is null or p_longitude is null
     or p_latitude < -90 or p_latitude > 90
     or p_longitude < -180 or p_longitude > 180
     or (p_accuracy is not null and (p_accuracy < 0 or p_accuracy > 100000))
     or (p_heading is not null and (p_heading < 0 or p_heading > 360))
     or (p_speed is not null and p_speed < 0) then
    raise exception 'location_invalid' using errcode = '22023';
  end if;

  select * into v_courier from public.couriers where user_id = v_user;

  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_courier.id is null
     or v_delivery.id is null
     or v_delivery.courier_id <> v_courier.id
     or v_delivery.status <> 'accepted'
     or v_delivery.started_at is null then
    raise exception 'not_started' using errcode = '22023';
  end if;

  insert into public.delivery_locations (
    delivery_id, courier_id, latitude, longitude,
    accuracy, heading, speed, updated_at
  )
  values (
    v_delivery.id, v_courier.id, p_latitude, p_longitude,
    p_accuracy, p_heading, p_speed, v_now
  )
  on conflict (delivery_id) do update
    set courier_id = excluded.courier_id,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        accuracy = excluded.accuracy,
        heading = excluded.heading,
        speed = excluded.speed,
        updated_at = excluded.updated_at;

  select * into v_order from public.orders where id = v_delivery.order_id;

  return jsonb_build_object(
    'orderToken', v_order.public_token,
    'updatedAt', v_now
  );
end;
$$;

revoke execute on function public.update_delivery_location(
  uuid, double precision, double precision, double precision, double precision, double precision
) from public, anon, authenticated;
grant execute on function public.update_delivery_location(
  uuid, double precision, double precision, double precision, double precision, double precision
) to authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture publique par jeton de commande
 * ------------------------------------------------------------------ */

create or replace function public.public_tracking(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order    public.orders%rowtype;
  v_store    public.stores%rowtype;
  v_delivery public.deliveries%rowtype;
  v_courier  public.couriers%rowtype;
  v_location public.delivery_locations%rowtype;
begin
  select * into v_order
  from public.orders
  where public_token = p_token;

  if v_order.id is null then
    return null;
  end if;

  select * into v_store from public.stores where id = v_order.store_id;

  select * into v_delivery
  from public.deliveries
  where order_id = v_order.id
  order by created_at desc
  limit 1;

  if v_delivery.id is not null then
    select * into v_courier from public.couriers where id = v_delivery.courier_id;
    select * into v_location
    from public.delivery_locations
    where delivery_id = v_delivery.id;
  end if;

  return jsonb_build_object(
    'order', jsonb_build_object(
      'number', v_order.number,
      'status', v_order.status,
      'paymentStatus', v_order.payment_status,
      'customerName', v_order.customer_name,
      'address', v_order.shipping_address,
      'extra', v_order.shipping_extra,
      'city', v_order.shipping_city,
      'country', v_order.shipping_country,
      'total', v_order.total_amount,
      'currency', v_order.currency,
      'createdAt', v_order.created_at
    ),
    'store', jsonb_build_object(
      'name', v_store.name,
      'slug', v_store.slug
    ),
    'delivery', case
      when v_delivery.id is null then null
      else jsonb_build_object(
        'id', v_delivery.id,
        'status', v_delivery.status,
        'courierName', v_courier.full_name,
        'courierPhone', v_courier.phone,
        'feeAmount', v_delivery.fee_amount,
        'currency', v_delivery.currency,
        'startedAt', v_delivery.started_at,
        'deliveredAt', v_delivery.delivered_at,
        'pickup', case
          when v_delivery.pickup_latitude is not null then jsonb_build_object(
            'latitude', v_delivery.pickup_latitude,
            'longitude', v_delivery.pickup_longitude
          ) else null end,
        'destination', case
          when v_delivery.destination_latitude is not null then jsonb_build_object(
            'latitude', v_delivery.destination_latitude,
            'longitude', v_delivery.destination_longitude
          ) else null end
      )
    end,
    'location', case
      when v_location.delivery_id is null then null
      else jsonb_build_object(
        'latitude', v_location.latitude,
        'longitude', v_location.longitude,
        'accuracy', v_location.accuracy,
        'heading', v_location.heading,
        'speed', v_location.speed,
        'updatedAt', v_location.updated_at
      )
    end
  );
end;
$$;

revoke execute on function public.public_tracking(uuid)
  from public, anon, authenticated;
grant execute on function public.public_tracking(uuid)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  La course active expose l'état du suivi au livreur
 * ------------------------------------------------------------------ */

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
    'startedAt', d.started_at,
    'pickupLatitude', d.pickup_latitude,
    'pickupLongitude', d.pickup_longitude,
    'destinationLatitude', d.destination_latitude,
    'destinationLongitude', d.destination_longitude,
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
