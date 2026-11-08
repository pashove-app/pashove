-- PASHOVE — Adresse de la boutique et point de ramassage GPS
--
-- Le marchand renseigne l'adresse de sa boutique dans ses réglages. Elle est
-- géocodée à l'enregistrement et stockée avec ses coordonnées. Au démarrage
-- d'une course, le point de ramassage affiché au client est celui de la
-- boutique ; à défaut (adresse absente ou non localisable), on retombe sur la
-- position du livreur au clic sur « Démarrer ».

alter table public.stores
  add column if not exists address text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.stores
  drop constraint if exists stores_latitude_check,
  drop constraint if exists stores_longitude_check;

alter table public.stores
  add constraint stores_latitude_check
    check (latitude is null or (latitude between -90 and 90)),
  add constraint stores_longitude_check
    check (longitude is null or (longitude between -180 and 180));

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
  v_user       uuid := auth.uid();
  v_courier    public.couriers%rowtype;
  v_delivery   public.deliveries%rowtype;
  v_order      public.orders%rowtype;
  v_store      public.stores%rowtype;
  v_pickup_lat double precision;
  v_pickup_lng double precision;
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

  -- Point fixe de la boutique quand il est connu ; sinon la position du
  -- livreur au démarrage (comportement historique).
  v_pickup_lat := coalesce(v_store.latitude, p_latitude);
  v_pickup_lng := coalesce(v_store.longitude, p_longitude);

  if v_delivery.started_at is null then
    update public.deliveries
    set started_at = now(),
        pickup_latitude = v_pickup_lat,
        pickup_longitude = v_pickup_lng
    where id = v_delivery.id;

    -- La position live reste celle du livreur, pas celle de la boutique.
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
    'pickupLatitude', v_pickup_lat,
    'pickupLongitude', v_pickup_lng,
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
