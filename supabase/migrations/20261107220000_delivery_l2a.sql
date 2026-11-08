-- PASHOVE — L2a : mode de livraison, zones et table des courses
--
-- Le marchand choisit entre sa propre livraison et Pashove Delivery. Les
-- zones desservies sont un sous-ensemble de ses pays de vente. La table
-- `deliveries` accueillera le dispatch (L2b), l'OTP et le split (L2c).

alter table public.stores
  add column if not exists delivery_mode text not null default 'self'
    check (delivery_mode in ('self', 'pashove')),
  add column if not exists delivery_countries text[] not null default '{}';

-- Les boutiques existantes livrent dans leur pays par défaut.
update public.stores
set delivery_countries = array[country]
where delivery_countries = '{}'
  and country ~ '^[A-Z]{2}$';

create table if not exists public.deliveries (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null unique references public.orders (id) on delete cascade,
  store_id         uuid not null references public.stores (id) on delete cascade,
  courier_id       uuid references public.couriers (id) on delete set null,
  status           text not null default 'pending'
    check (status in (
      'pending', 'searching', 'assigned', 'accepted', 'declined',
      'timeout', 'delivered', 'failed', 'cancelled'
    )),
  fee_amount       integer not null default 0 check (fee_amount >= 0),
  currency         text not null default 'XOF' check (currency ~ '^[A-Z]{3}$'),
  otp_hash         text,
  otp_expires_at   timestamptz,
  accepted_at      timestamptz,
  delivered_at     timestamptz,
  failure_reason   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists deliveries_store_idx
  on public.deliveries (store_id, created_at desc);
create index if not exists deliveries_courier_idx
  on public.deliveries (courier_id, created_at desc);
create index if not exists deliveries_status_idx
  on public.deliveries (status, created_at desc);

alter table public.deliveries enable row level security;

create policy deliveries_select_store on public.deliveries
  for select to authenticated
  using (public.is_store_member(store_id));

create policy deliveries_select_courier on public.deliveries
  for select to authenticated
  using (
    exists (
      select 1 from public.couriers c
      where c.id = deliveries.courier_id
        and c.user_id = auth.uid()
    )
  );

revoke all on public.deliveries from public, anon, authenticated;
grant select on public.deliveries to authenticated;

/* ------------------------------------------------------------------ *
 *  Réglages marchand
 * ------------------------------------------------------------------ */

create or replace function public.save_delivery_settings(
  p_store_id  uuid,
  p_mode      text,
  p_countries text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text := lower(btrim(coalesce(p_mode, 'self')));
  v_country text;
  v_seen text[] := array[]::text[];
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if v_mode not in ('self', 'pashove') then
    raise exception 'mode_invalid' using errcode = '22023';
  end if;

  if p_countries is not null then
    foreach v_country in array p_countries loop
      v_country := upper(btrim(v_country));

      if v_country !~ '^[A-Z]{2}$' then
        raise exception 'zone_invalid' using errcode = '22023';
      end if;

      if v_country = any (v_seen) then
        continue;
      end if;

      if not exists (
        select 1 from public.platform_markets m
        where m.country_code = v_country and m.is_enabled
      ) then
        raise exception 'zone_invalid' using errcode = '22023';
      end if;

      v_seen := v_seen || v_country;
    end loop;
  end if;

  if v_mode = 'pashove' and cardinality(v_seen) = 0 then
    raise exception 'zones_required' using errcode = '22023';
  end if;

  update public.stores
  set delivery_mode = v_mode,
      delivery_countries = v_seen
  where id = p_store_id;

  return jsonb_build_object(
    'mode', v_mode,
    'countries', to_jsonb(v_seen)
  );
end;
$$;

revoke execute on function public.save_delivery_settings(uuid, text, text[])
  from public, anon, authenticated;
grant execute on function public.save_delivery_settings(uuid, text, text[])
  to authenticated;
