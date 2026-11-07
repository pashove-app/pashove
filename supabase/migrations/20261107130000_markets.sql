-- PASHOVE — MKT1 : marchés de la plateforme et pays activés par boutique
--
-- La plateforme définit les marchés (pays × devise). Le marchand active ceux
-- où il vend. Le checkout ne proposera que cette sélection.
--
-- La conversion FX n'est pas encore branchée : les marchés d'une autre devise
-- sont enregistrés mais marqués indisponibles au checkout.

create table if not exists public.platform_markets (
  code         text primary key,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  country_name text not null,
  currency     text not null check (currency ~ '^[A-Z]{3}$'),
  is_enabled   boolean not null default true,
  note         text,
  sort_order   integer not null default 0
);

insert into public.platform_markets
  (code, country_code, country_name, currency, is_enabled, note, sort_order)
values
  ('BJ-XOF', 'BJ', 'Bénin', 'XOF', true, null, 10),
  ('BF-XOF', 'BF', 'Burkina Faso', 'XOF', true, null, 20),
  ('CM-XAF', 'CM', 'Cameroun', 'XAF', true, null, 30),
  ('CG-XAF', 'CG', 'Congo', 'XAF', true, null, 40),
  ('CI-XOF', 'CI', 'Côte d''Ivoire', 'XOF', true, null, 50),
  ('GA-XAF', 'GA', 'Gabon', 'XAF', true, null, 60),
  ('GH-GHS', 'GH', 'Ghana', 'GHS', true, null, 70),
  ('GN-GNF', 'GN', 'Guinée', 'GNF', true, null, 80),
  ('KE-KES', 'KE', 'Kenya', 'KES', true, null, 90),
  ('ML-XOF', 'ML', 'Mali', 'XOF', true, null, 100),
  ('NE-XOF', 'NE', 'Niger', 'XOF', true, null, 110),
  ('NG-NGN', 'NG', 'Nigeria', 'NGN', false, 'Réseaux non disponibles', 120),
  ('UG-UGX', 'UG', 'Ouganda', 'UGX', true, null, 130),
  ('CD-CDF', 'CD', 'RDC (CDF)', 'CDF', true, null, 140),
  ('CD-USD', 'CD', 'RDC (USD)', 'USD', true, null, 150),
  ('RW-RWF', 'RW', 'Rwanda', 'RWF', true, null, 160),
  ('SN-XOF', 'SN', 'Sénégal', 'XOF', true, null, 170),
  ('SL-SLE', 'SL', 'Sierra Leone', 'SLE', true, null, 180),
  ('TZ-TZS', 'TZ', 'Tanzanie', 'TZS', true, null, 190),
  ('TG-XOF', 'TG', 'Togo', 'XOF', true, null, 200),
  ('ZM-ZMW', 'ZM', 'Zambie', 'ZMW', true, null, 210),
  ('MW-MWK', 'MW', 'Malawi', 'MWK', false, 'Réseaux non configurés', 220),
  ('MZ-MZN', 'MZ', 'Mozambique', 'MZN', false, 'Réseaux non configurés', 230)
on conflict (code) do nothing;

create table if not exists public.store_markets (
  store_id    uuid not null references public.stores (id) on delete cascade,
  market_code text not null references public.platform_markets (code),
  created_at  timestamptz not null default now(),
  primary key (store_id, market_code)
);

alter table public.store_markets enable row level security;
alter table public.platform_markets enable row level security;

create policy store_markets_select on public.store_markets
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.store_markets from public, anon, authenticated;
grant select on public.store_markets to authenticated;

revoke all on public.platform_markets from public, anon, authenticated;
grant select on public.platform_markets to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Boutiques existantes : le pays de la boutique par défaut
 * ------------------------------------------------------------------ */

insert into public.store_markets (store_id, market_code)
select s.id, m.code
from public.stores s
join public.platform_markets m
  on m.country_code = s.country and m.currency = s.currency
on conflict do nothing;

/* ------------------------------------------------------------------ *
 *  Lecture
 * ------------------------------------------------------------------ */

create or replace function public.platform_markets()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', m.code,
        'countryCode', m.country_code,
        'countryName', m.country_name,
        'currency', m.currency,
        'isEnabled', m.is_enabled,
        'note', m.note
      )
      order by m.sort_order, m.code
    ),
    '[]'::jsonb
  )
  from public.platform_markets m;
$$;

revoke execute on function public.platform_markets()
  from public, anon, authenticated;
grant execute on function public.platform_markets()
  to anon, authenticated;

create or replace function public.store_markets(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'code', m.code,
          'countryCode', m.country_code,
          'countryName', m.country_name,
          'currency', m.currency,
          'isEnabled', m.is_enabled,
          'note', m.note
        )
        order by m.sort_order, m.code
      )
      from public.store_markets sm
      join public.platform_markets m on m.code = sm.market_code
      where sm.store_id = p_store_id
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.store_markets(uuid)
  from public, anon, authenticated;
grant execute on function public.store_markets(uuid)
  to authenticated;

/** Marchés réellement activés, pour le checkout public. */
create or replace function public.public_store_markets(p_slug text)
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

  if v_store.id is null then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'code', m.code,
          'countryCode', m.country_code,
          'countryName', m.country_name,
          'currency', m.currency
        )
        order by m.sort_order, m.code
      )
      from public.store_markets sm
      join public.platform_markets m on m.code = sm.market_code
      where sm.store_id = v_store.id
        and m.is_enabled
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.public_store_markets(text)
  from public, anon, authenticated;
grant execute on function public.public_store_markets(text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Écriture marchande
 * ------------------------------------------------------------------ */

create or replace function public.save_store_markets(
  p_store_id    uuid,
  p_codes       text[],
  p_cod_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_seen text[] := array[]::text[];
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_codes is null or cardinality(p_codes) = 0 then
    raise exception 'markets_empty' using errcode = '22023';
  end if;

  foreach v_code in array p_codes loop
    if v_code = any (v_seen) then
      continue;
    end if;

    if not exists (
      select 1 from public.platform_markets m
      where m.code = v_code and m.is_enabled
    ) then
      raise exception 'market_invalid' using errcode = '22023';
    end if;

    v_seen := v_seen || v_code;
  end loop;

  if cardinality(v_seen) = 0 then
    raise exception 'markets_empty' using errcode = '22023';
  end if;

  delete from public.store_markets where store_id = p_store_id;

  insert into public.store_markets (store_id, market_code)
  select p_store_id, unnest(v_seen)
  on conflict do nothing;

  update public.stores
  set cod_enabled = coalesce(p_cod_enabled, cod_enabled)
  where id = p_store_id;

  return jsonb_build_object(
    'markets', to_jsonb(v_seen),
    'codEnabled', coalesce(p_cod_enabled, true)
  );
end;
$$;

revoke execute on function public.save_store_markets(uuid, text[], boolean)
  from public, anon, authenticated;
grant execute on function public.save_store_markets(uuid, text[], boolean)
  to authenticated;
