-- PASHOVE — Réconciliation des paiements et durcissement financier
--
-- 1. Journal des alertes de réconciliation (succès tardif, incohérence).
-- 2. Protection des colonnes financières de `stores` contre une mise à jour
--    directe par un marchand.
-- 3. Gestion des administrateurs réservée aux super administrateurs.
-- 4. Les RPC Mock ne sont plus accessibles avec la clé anonyme.

/* ------------------------------------------------------------------ *
 *  Alertes de réconciliation
 * ------------------------------------------------------------------ */

create table public.payment_reconciliation_alerts (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  order_id   uuid references public.orders (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete cascade,
  reference  text,
  kind       text not null
    check (kind in ('late_success', 'amount_mismatch', 'orphan_payment', 'unknown')),
  amount     integer,
  currency   text,
  details    jsonb not null default '{}'::jsonb,
  status     text not null default 'open'
    check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reference, kind)
);

create index payment_reconciliation_open_idx
  on public.payment_reconciliation_alerts (created_at desc)
  where status = 'open';

alter table public.payment_reconciliation_alerts enable row level security;
revoke all on public.payment_reconciliation_alerts
  from public, anon, authenticated;
grant select on public.payment_reconciliation_alerts to authenticated;

create policy payment_reconciliation_select on public.payment_reconciliation_alerts
  for select to authenticated
  using (public.is_platform_admin());

/* ------------------------------------------------------------------ *
 *  Colonnes financières de stores
 * ------------------------------------------------------------------ */

create or replace function public.protect_store_financial_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.commission_bps is distinct from old.commission_bps)
     and not public.is_platform_admin()
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and coalesce(current_setting('pashove.allow_commission_update', true), '') <> 'on'
  then
    raise exception 'store_field_protected' using errcode = '42501';
  end if;

  -- Le slug et la devise restent modifiables pendant la création (draft),
  -- mais plus une fois la boutique publiée.
  if (new.currency is distinct from old.currency
      or new.slug is distinct from old.slug)
     and old.status <> 'draft'
     and not public.is_platform_admin()
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
  then
    raise exception 'store_field_protected' using errcode = '42501';
  end if;

  -- Un marchand ne peut pas réactiver une boutique suspendue par la
  -- plateforme. Le passage draft -> active (publication) reste autorisé.
  if old.status = 'suspended'
     and new.status is distinct from old.status
     and not public.is_platform_admin()
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
  then
    raise exception 'store_suspended' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger stores_protect_financial_fields
  before update on public.stores
  for each row execute function public.protect_store_financial_fields();

/* ------------------------------------------------------------------ *
 *  Rôles administrateur
 * ------------------------------------------------------------------ */

-- Le formulaire propose « admin », mais la contrainte d'origine ne
-- l'autorisait pas. On aligne la contrainte sur les rôles réellement gérés.
alter table public.platform_admins
  drop constraint if exists platform_admins_role_check;

alter table public.platform_admins
  add constraint platform_admins_role_check
  check (role in (
    'super_admin', 'admin', 'kyc_reviewer', 'payout_operator',
    'finance_operator', 'auditor'
  ));

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.user_id = (select auth.uid())
      and a.role = 'super_admin'
  );
$$;

revoke execute on function public.is_super_admin()
  from public, anon, authenticated;
grant execute on function public.is_super_admin()
  to authenticated;

create or replace function public.platform_add_admin(
  p_email text,
  p_role  text default 'admin'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_role not in (
    'super_admin', 'admin', 'kyc_reviewer', 'payout_operator',
    'finance_operator', 'auditor'
  ) then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  select id into v_user from auth.users where lower(email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'user_not_found' using errcode = '22023';
  end if;

  insert into public.platform_admins (user_id, role)
  values (v_user, p_role)
  on conflict (user_id) do update set role = excluded.role;

  perform public.platform_audit(
    'platform_admin_added', 'user', v_user, jsonb_build_object('role', p_role)
  );
end;
$$;

revoke execute on function public.platform_add_admin(text, text)
  from public, anon, authenticated;
grant execute on function public.platform_add_admin(text, text)
  to authenticated;

create or replace function public.platform_remove_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_super integer;
begin
  if not public.is_super_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.platform_admins
    where user_id = p_user_id and role = 'super_admin'
  ) then
    select count(*) into v_super
    from public.platform_admins
    where role = 'super_admin';

    if v_super <= 1 then
      raise exception 'last_super_admin' using errcode = '22023';
    end if;
  end if;

  delete from public.platform_admins where user_id = p_user_id;

  perform public.platform_audit(
    'platform_admin_removed', 'user', p_user_id, '{}'::jsonb
  );
end;
$$;

revoke execute on function public.platform_remove_admin(uuid)
  from public, anon, authenticated;
grant execute on function public.platform_remove_admin(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Mock : service_role uniquement
 * ------------------------------------------------------------------ */

revoke execute on function public.record_payment_intent(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_payment_intent(uuid, text, text, text)
  to service_role;

revoke execute on function public.confirm_mock_payment(uuid, text)
  from public, anon, authenticated;
grant execute on function public.confirm_mock_payment(uuid, text)
  to service_role;
