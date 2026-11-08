-- PASHOVE — Tarification de la livraison par la plateforme
--
-- Le marchand active Pashove Delivery ; les prix sont fixés par l'admin, par
-- pays et par zone. Le client choisit sa zone au checkout et paie le tarif
-- correspondant. Le marchand ne voit pas la grille.

create table if not exists public.delivery_zones (
  id           uuid primary key default gen_random_uuid(),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  name         text not null check (char_length(name) between 2 and 80),
  fee_amount   integer not null check (fee_amount >= 0),
  currency     text not null check (currency ~ '^[A-Z]{3}$'),
  is_default   boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (country_code, currency, name)
);

create index if not exists delivery_zones_country_idx
  on public.delivery_zones (country_code, is_active);

alter table public.delivery_zones enable row level security;
revoke all on public.delivery_zones from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Administration
 * ------------------------------------------------------------------ */

create or replace function public.admin_delivery_zones()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', z.id,
          'countryCode', z.country_code,
          'name', z.name,
          'feeAmount', z.fee_amount,
          'currency', z.currency,
          'isDefault', z.is_default,
          'isActive', z.is_active
        )
        order by z.country_code, z.is_default desc, z.name
      )
      from public.delivery_zones z
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.admin_delivery_zones()
  from public, anon, authenticated;
grant execute on function public.admin_delivery_zones()
  to authenticated;

create or replace function public.save_delivery_zone(
  p_id         uuid,
  p_country    text,
  p_name       text,
  p_fee        integer,
  p_currency   text,
  p_is_default boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_country text := upper(btrim(coalesce(p_country, '')));
  v_name    text := btrim(coalesce(p_name, ''));
  v_currency text := upper(btrim(coalesce(p_currency, '')));
  v_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_country !~ '^[A-Z]{2}$'
     or v_currency !~ '^[A-Z]{3}$'
     or char_length(v_name) < 2
     or p_fee is null
     or p_fee < 0 then
    raise exception 'zone_invalid' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.platform_markets m
    where m.country_code = v_country
      and m.currency = v_currency
      and m.is_enabled
  ) then
    raise exception 'market_invalid' using errcode = '22023';
  end if;

  if coalesce(p_is_default, false) then
    update public.delivery_zones
    set is_default = false
    where country_code = v_country
      and currency = v_currency
      and id <> coalesce(p_id, '00000000-0000-0000-0000-000000000000'::uuid);
  end if;

  if p_id is null then
    insert into public.delivery_zones (
      country_code, name, fee_amount, currency, is_default
    )
    values (v_country, v_name, p_fee, v_currency, coalesce(p_is_default, false))
    returning id into v_id;
  else
    update public.delivery_zones
    set country_code = v_country,
        name = v_name,
        fee_amount = p_fee,
        currency = v_currency,
        is_default = coalesce(p_is_default, false),
        updated_at = now()
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'zone_not_found' using errcode = '22023';
    end if;
  end if;

  return jsonb_build_object('id', v_id);
end;
$$;

revoke execute on function public.save_delivery_zone(uuid, text, text, integer, text, boolean)
  from public, anon, authenticated;
grant execute on function public.save_delivery_zone(uuid, text, text, integer, text, boolean)
  to authenticated;

create or replace function public.delete_delivery_zone(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.delivery_zones where id = p_id;
end;
$$;

revoke execute on function public.delete_delivery_zone(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_delivery_zone(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Checkout
 * ------------------------------------------------------------------ */

create or replace function public.public_delivery_zones(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
begin
  select s.* into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store.id is null or v_store.delivery_mode <> 'pashove' then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', z.id,
          'name', z.name,
          'feeAmount', z.fee_amount,
          'currency', z.currency,
          'isDefault', z.is_default
        )
        order by z.is_default desc, z.name
      )
      from public.delivery_zones z
      where z.country_code = v_store.country
        and z.currency = v_store.currency
        and z.is_active
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.public_delivery_zones(text)
  from public, anon, authenticated;
grant execute on function public.public_delivery_zones(text)
  to anon, authenticated;

create or replace function public.apply_delivery_zone(
  p_order_token uuid,
  p_zone_id     uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_store public.stores%rowtype;
  v_zone public.delivery_zones%rowtype;
begin
  select * into v_order
  from public.orders
  where public_token = p_order_token
  for update;

  if v_order.id is null or v_order.payment_status <> 'pending' then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  select * into v_store from public.stores where id = v_order.store_id;

  if v_store.id is null or v_store.delivery_mode <> 'pashove' then
    raise exception 'delivery_unavailable' using errcode = '22023';
  end if;

  select * into v_zone
  from public.delivery_zones
  where id = p_zone_id and is_active;

  if v_zone.id is null
     or v_zone.country_code <> v_order.shipping_country
     or v_zone.currency <> v_order.currency then
    raise exception 'zone_invalid' using errcode = '22023';
  end if;

  update public.orders
  set shipping_amount = v_zone.fee_amount,
      total_amount = subtotal_amount - discount_amount + v_zone.fee_amount
  where id = v_order.id;

  return jsonb_build_object(
    'shipping', v_zone.fee_amount,
    'total', v_order.subtotal_amount - v_order.discount_amount + v_zone.fee_amount,
    'currency', v_order.currency
  );
end;
$$;

revoke execute on function public.apply_delivery_zone(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.apply_delivery_zone(uuid, uuid)
  to anon, authenticated;
