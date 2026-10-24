-- Méthodes de retrait et sécurité des retraits.
--
-- Les numéros sont chiffrés côté application (AES-256-GCM) avant d'atteindre
-- la base. Seuls les quatre derniers chiffres et une empreinte HMAC restent
-- lisibles, pour l'affichage et la détection des doublons.
--
-- Le PIN de retrait est un secret distinct du mot de passe et de la 2FA. Il
-- est haché en bcrypt dans la base (pgcrypto) et n'en sort jamais : ni lecture,
-- ni export, ni journal.

create table public.payout_methods (
  id                       uuid primary key default gen_random_uuid(),
  store_id                 uuid not null references public.stores (id) on delete cascade,
  country                  text not null check (country in ('SN', 'CI', 'ML', 'BF', 'BJ', 'TG')),
  provider                 text not null check (provider in ('orange', 'wave', 'mtn', 'moov', 'free', 'togo')),
  account_name             text not null
    check (char_length(btrim(account_name)) between 2 and 120),
  account_number_encrypted text not null,
  account_last4            text not null check (account_last4 ~ '^[0-9]{4}$'),
  account_fingerprint      text not null,
  is_default               boolean not null default false,
  archived_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index payout_methods_store_idx
  on public.payout_methods (store_id, created_at desc);

create unique index payout_methods_unique_active
  on public.payout_methods (store_id, provider, account_fingerprint)
  where archived_at is null;

create unique index payout_methods_one_default
  on public.payout_methods (store_id)
  where is_default and archived_at is null;

create trigger payout_methods_touch_updated_at
  before update on public.payout_methods
  for each row execute function public.touch_updated_at();

create table public.store_security (
  store_id             uuid primary key references public.stores (id) on delete cascade,
  payout_pin_hash      text not null,
  pin_failed_attempts  integer not null default 0 check (pin_failed_attempts >= 0),
  pin_locked_until     timestamptz,
  pin_updated_at       timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger store_security_touch_updated_at
  before update on public.store_security
  for each row execute function public.touch_updated_at();

/* ------------------------------------------------------------------ *
 *  PIN : écriture et vérification
 * ------------------------------------------------------------------ */

create or replace function public.set_payout_pin(
  p_store_id uuid,
  p_pin      text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    raise exception 'pin_invalid_format' using errcode = '22023';
  end if;

  if p_pin in (
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777',
    '8888', '9999', '1234', '4321', '0123', '3210', '1122', '1212'
  ) then
    raise exception 'pin_too_weak' using errcode = '22023';
  end if;

  insert into public.store_security (
    store_id, payout_pin_hash, pin_failed_attempts, pin_locked_until, pin_updated_at
  )
  values (
    p_store_id,
    extensions.crypt(p_pin, extensions.gen_salt('bf', 10)),
    0, null, now()
  )
  on conflict (store_id) do update
  set payout_pin_hash = excluded.payout_pin_hash,
      pin_failed_attempts = 0,
      pin_locked_until = null,
      pin_updated_at = now(),
      updated_at = now();
end;
$$;

revoke execute on function public.set_payout_pin(uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_payout_pin(uuid, text)
  to authenticated;

create or replace function public.verify_payout_pin(
  p_store_id uuid,
  p_pin      text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash     text;
  v_attempts integer;
  v_locked   timestamptz;
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select s.payout_pin_hash, s.pin_failed_attempts, s.pin_locked_until
  into v_hash, v_attempts, v_locked
  from public.store_security s
  where s.store_id = p_store_id
  for update;

  if v_hash is null then
    raise exception 'pin_not_set' using errcode = '22023';
  end if;

  if v_locked is not null and v_locked > now() then
    raise exception 'pin_locked' using errcode = '22023';
  end if;

  if p_pin is not null and extensions.crypt(p_pin, v_hash) = v_hash then
    update public.store_security
    set pin_failed_attempts = 0,
        pin_locked_until = null,
        updated_at = now()
    where store_id = p_store_id;

    return true;
  end if;

  v_attempts := coalesce(v_attempts, 0) + 1;

  update public.store_security
  set pin_failed_attempts = case when v_attempts >= 5 then 0 else v_attempts end,
      pin_locked_until = case when v_attempts >= 5 then now() + interval '30 minutes' else pin_locked_until end,
      updated_at = now()
  where store_id = p_store_id;

  -- Un mauvais PIN n'est pas une exception : la tentative doit être
  -- enregistrée. L'appelant refuse la suite sur `false`, et le verrouillage
  -- est lisible via `store_security_status`.
  return false;
end;
$$;

revoke execute on function public.verify_payout_pin(uuid, text)
  from public, anon, authenticated;
grant execute on function public.verify_payout_pin(uuid, text)
  to authenticated;

create or replace function public.store_security_status(p_store_id uuid)
returns table (
  has_pin       boolean,
  locked_until  timestamptz,
  pin_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  return query
  select
    s.payout_pin_hash is not null,
    s.pin_locked_until,
    s.pin_updated_at
  from public.store_security s
  where s.store_id = p_store_id;

  if not found then
    return query select false, null::timestamptz, null::timestamptz;
  end if;
end;
$$;

revoke execute on function public.store_security_status(uuid)
  from public, anon, authenticated;
grant execute on function public.store_security_status(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Méthode par défaut
 * ------------------------------------------------------------------ */

create or replace function public.set_default_payout_method(
  p_store_id  uuid,
  p_method_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.payout_methods m
    where m.id = p_method_id
      and m.store_id = p_store_id
      and m.archived_at is null
  ) then
    raise exception 'method_not_found' using errcode = '22023';
  end if;

  update public.payout_methods
  set is_default = false
  where store_id = p_store_id
    and is_default
    and archived_at is null
    and id <> p_method_id;

  update public.payout_methods
  set is_default = true
  where id = p_method_id
    and store_id = p_store_id
    and archived_at is null;
end;
$$;

revoke execute on function public.set_default_payout_method(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.set_default_payout_method(uuid, uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Accès
 * ------------------------------------------------------------------ */

alter table public.payout_methods enable row level security;
alter table public.store_security enable row level security;

create policy payout_methods_select_member on public.payout_methods
  for select to authenticated
  using (public.is_store_member(store_id));

create policy payout_methods_insert_member on public.payout_methods
  for insert to authenticated
  with check (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]));

create policy payout_methods_update_member on public.payout_methods
  for update to authenticated
  using (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]))
  with check (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]));

revoke all on public.payout_methods from public, anon, authenticated;
grant select, insert, update on public.payout_methods to authenticated;

-- Le hash du PIN ne doit jamais être lisible : aucune politique, aucun grant.
revoke all on public.store_security from public, anon, authenticated;
