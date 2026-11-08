-- PASHOVE — PLAN1a : expiration, commissions synchronisées, downgrade
--
-- La commission réellement appliquée au ledger est `stores.commission_bps`.
-- Elle était figée à 1 000 pour tout le monde : elle est désormais synchronisée
-- depuis le plan du compte, à chaque changement et à l'expiration.
--
-- Le marchand choisit aussi qui paie les frais SasPay (client ou marchand).
-- Le Free reste particulier : ses frais sont inclus dans la commission.

alter table public.plans
  add column if not exists fee_included boolean not null default false;

update public.plans set fee_included = (code = 'free');

alter table public.account_plans
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists expires_at timestamptz;

alter table public.stores
  add column if not exists fee_charge_mode text not null default 'merchant'
    check (fee_charge_mode in ('client', 'merchant'));

create table if not exists public.store_plan_suspensions (
  store_id     uuid primary key references public.stores (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  suspended_at timestamptz not null default now(),
  restored_at  timestamptz
);

alter table public.store_plan_suspensions enable row level security;
revoke all on public.store_plan_suspensions from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Application d'un plan à toutes les boutiques du compte
 * ------------------------------------------------------------------ */

create or replace function public.apply_plan_to_stores(
  p_user_id   uuid,
  p_plan_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans%rowtype;
  v_store record;
  v_kept integer := 0;
  v_active integer := 0;
begin
  select * into v_plan from public.plans where code = p_plan_code;

  if v_plan.code is null then
    raise exception 'plan_invalid' using errcode = '22023';
  end if;

  update public.stores s
  set commission_bps = v_plan.commission_bps
  from public.store_members sm
  where sm.store_id = s.id
    and sm.user_id = p_user_id
    and sm.role = 'owner';

  if p_plan_code = 'free' then
    -- Au-delà de la limite, les boutiques les plus récentes passent en draft.
    for v_store in
      select s.id, s.status
      from public.stores s
      join public.store_members sm on sm.store_id = s.id
      where sm.user_id = p_user_id and sm.role = 'owner'
      order by s.created_at, s.id
    loop
      v_kept := v_kept + 1;

      if v_kept > v_plan.max_stores and v_store.status = 'active' then
        update public.stores set status = 'draft' where id = v_store.id;

        insert into public.store_plan_suspensions (store_id, user_id)
        values (v_store.id, p_user_id)
        on conflict (store_id) do update
          set suspended_at = now(), restored_at = null;
      end if;
    end loop;

    return;
  end if;

  -- Retour à un plan payant : on restaure les boutiques suspendues par un
  -- downgrade, dans la limite du nouveau plan.
  select count(*) into v_active
  from public.stores s
  join public.store_members sm on sm.store_id = s.id
  where sm.user_id = p_user_id and sm.role = 'owner' and s.status = 'active';

  for v_store in
    select sp.store_id
    from public.store_plan_suspensions sp
    join public.stores s on s.id = sp.store_id
    where sp.user_id = p_user_id
      and sp.restored_at is null
      and s.status = 'draft'
    order by sp.suspended_at
  loop
    exit when v_active >= v_plan.max_stores;

    update public.stores set status = 'active' where id = v_store.store_id;
    update public.store_plan_suspensions
    set restored_at = now()
    where store_id = v_store.store_id;

    v_active := v_active + 1;
  end loop;
end;
$$;

revoke execute on function public.apply_plan_to_stores(uuid, text)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Changement de plan (service_role ; utilisé par l'abonnement)
 * ------------------------------------------------------------------ */

create or replace function public.set_account_plan(
  p_user_id   uuid,
  p_plan_code text,
  p_days      integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expires timestamptz;
begin
  if p_plan_code not in ('free', 'standard', 'pro') then
    raise exception 'plan_invalid' using errcode = '22023';
  end if;

  if p_plan_code = 'free' then
    v_expires := null;
  else
    if p_days is null or p_days <= 0 then
      raise exception 'duration_invalid' using errcode = '22023';
    end if;
    -- Un renouvellement anticipé prolonge à partir de la date de fin.
    select greatest(coalesce(ap.expires_at, now()), now()) + make_interval(days => p_days)
    into v_expires
    from public.account_plans ap
    where ap.user_id = p_user_id;
  end if;

  insert into public.account_plans (user_id, plan_code, started_at, expires_at, updated_at)
  values (p_user_id, p_plan_code, now(), v_expires, now())
  on conflict (user_id) do update
    set plan_code = excluded.plan_code,
        started_at = case
          when public.account_plans.plan_code = excluded.plan_code
            then public.account_plans.started_at
          else now()
        end,
        expires_at = excluded.expires_at,
        updated_at = now();

  perform public.apply_plan_to_stores(p_user_id, p_plan_code);

  return jsonb_build_object(
    'planCode', p_plan_code,
    'expiresAt', v_expires
  );
end;
$$;

revoke execute on function public.set_account_plan(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.set_account_plan(uuid, text, integer)
  to service_role;

/* ------------------------------------------------------------------ *
 *  Expiration quotidienne
 * ------------------------------------------------------------------ */

create or replace function public.expire_account_plans()
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
    select ap.user_id
    from public.account_plans ap
    where ap.plan_code <> 'free'
      and ap.expires_at is not null
      and ap.expires_at <= now()
    for update
  loop
    update public.account_plans
    set plan_code = 'free',
        expires_at = null,
        updated_at = now()
    where user_id = v_row.user_id;

    perform public.apply_plan_to_stores(v_row.user_id, 'free');

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('expired', v_count);
end;
$$;

revoke execute on function public.expire_account_plans()
  from public, anon, authenticated;
grant execute on function public.expire_account_plans()
  to service_role;

/* ------------------------------------------------------------------ *
 *  Lecture du plan courant (écran marchand)
 * ------------------------------------------------------------------ */

create or replace function public.current_plan()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_account public.account_plans%rowtype;
begin
  if v_user is null then
    return null;
  end if;

  select * into v_account from public.account_plans where user_id = v_user;

  if v_account.plan_code is null then
    return jsonb_build_object('code', 'free', 'expiresAt', null);
  end if;

  select * into v_plan from public.plans where code = v_account.plan_code;

  return jsonb_build_object(
    'code', v_account.plan_code,
    'name', v_plan.name,
    'commissionBps', v_plan.commission_bps,
    'maxStores', v_plan.max_stores,
    'maxMembers', v_plan.max_members,
    'priceAmount', v_plan.price_amount,
    'currency', v_plan.currency,
    'feeIncluded', v_plan.fee_included,
    'startedAt', v_account.started_at,
    'expiresAt', v_account.expires_at
  );
end;
$$;

revoke execute on function public.current_plan()
  from public, anon, authenticated;
grant execute on function public.current_plan()
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Toggle « qui paie les frais SasPay »
 * ------------------------------------------------------------------ */

drop function if exists public.save_store_markets(uuid, text[], boolean);

create or replace function public.save_store_markets(
  p_store_id        uuid,
  p_codes           text[],
  p_cod_enabled     boolean,
  p_fee_charge_mode text default 'merchant'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_seen text[] := array[]::text[];
  v_fee  text := lower(btrim(coalesce(p_fee_charge_mode, 'merchant')));
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if v_fee not in ('client', 'merchant') then
    raise exception 'fee_mode_invalid' using errcode = '22023';
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
  set cod_enabled = coalesce(p_cod_enabled, cod_enabled),
      fee_charge_mode = v_fee
  where id = p_store_id;

  return jsonb_build_object(
    'markets', to_jsonb(v_seen),
    'codEnabled', coalesce(p_cod_enabled, true),
    'feeChargeMode', v_fee
  );
end;
$$;

revoke execute on function public.save_store_markets(uuid, text[], boolean, text)
  from public, anon, authenticated;
grant execute on function public.save_store_markets(uuid, text[], boolean, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Rattrapage : aligner les boutiques existantes sur leur plan
 * ------------------------------------------------------------------ */

update public.stores s
set commission_bps = p.commission_bps
from public.store_members sm
join public.account_plans ap on ap.user_id = sm.user_id
join public.plans p on p.code = ap.plan_code
where sm.store_id = s.id
  and sm.role = 'owner'
  and s.commission_bps <> p.commission_bps;
