-- PASHOVE STUDIO — Administration et recharge SasPay
--
-- Deux besoins :
--   1. le marchand recharge son portefeuille par softpay SasPay, avec un
--      crédit idempotent déclenché par le webhook ;
--   2. l'administration configure les tarifs, suit les marges et peut
--      créditer un marchand manuellement.
--
-- Le solde n'est jamais modifié directement par un client : toutes les
-- mutations passent par ces fonctions security definer.

alter table public.studio_topups
  add column network_code  text,
  add column redirect_url  text,
  add column country_code  text,
  add column note          text;

/* ------------------------------------------------------------------ *
 *  Recharge marchande
 * ------------------------------------------------------------------ */

create or replace function public.create_studio_topup(
  p_store_id uuid,
  p_amount   integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_store public.stores%rowtype;
  v_row   public.studio_topups%rowtype;
  v_id    uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not public.is_store_member(p_store_id) then
    raise exception 'not_store_member' using errcode = '42501';
  end if;

  select * into v_store from public.stores where id = p_store_id;

  if v_store.id is null then
    raise exception 'store_unknown' using errcode = '22023';
  end if;

  -- Les tarifs du Studio sont en FCFA ; la conversion FX viendra plus tard.
  if upper(v_store.currency) <> 'XOF' then
    raise exception 'studio_currency_unsupported' using errcode = '22023';
  end if;

  if p_amount is null or p_amount < 500 or p_amount > 500000 then
    raise exception 'studio_amount_invalid' using errcode = '22023';
  end if;

  -- Une recharge abandonnée ne doit pas bloquer le marchand indéfiniment.
  update public.studio_topups
  set status = 'failed'
  where store_id = p_store_id
    and provider = 'saspay'
    and status = 'pending'
    and created_at < now() - interval '2 hours';

  select * into v_row
  from public.studio_topups
  where store_id = p_store_id
    and provider = 'saspay'
    and status = 'pending'
  order by created_at desc
  limit 1;

  if v_row.id is not null then
    if v_row.provider_reference is null then
      update public.studio_topups
      set amount_fcfa = p_amount
      where id = v_row.id
      returning id into v_id;

      return jsonb_build_object(
        'id', v_id,
        'amount', p_amount,
        'currency', 'XOF'
      );
    end if;

    raise exception 'studio_topup_pending' using errcode = '22023';
  end if;

  insert into public.studio_topups (store_id, amount_fcfa, status, provider)
  values (p_store_id, p_amount, 'pending', 'saspay')
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'amount', p_amount,
    'currency', 'XOF'
  );
end;
$$;

revoke execute on function public.create_studio_topup(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.create_studio_topup(uuid, integer)
  to authenticated;

create or replace function public.record_studio_topup_intent(
  p_id           uuid,
  p_reference    text,
  p_network      text,
  p_redirect_url text default null,
  p_country      text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.studio_topups t
  set provider_reference = btrim(p_reference),
      network_code = nullif(btrim(coalesce(p_network, '')), ''),
      redirect_url = nullif(btrim(coalesce(p_redirect_url, '')), ''),
      country_code = nullif(upper(btrim(coalesce(p_country, ''))), '')
  where t.id = p_id
    and t.status = 'pending'
    and t.provider_reference is null
    and public.is_store_member(t.store_id);
end;
$$;

revoke execute on function public.record_studio_topup_intent(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_studio_topup_intent(uuid, text, text, text, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Crédit idempotent, appelé par le webhook SasPay
 * ------------------------------------------------------------------ */

create or replace function public.confirm_studio_topup(
  p_reference text,
  p_amount    numeric,
  p_currency  text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row     public.studio_topups%rowtype;
  v_balance public.store_studio_balance%rowtype;
begin
  select * into v_row
  from public.studio_topups
  where provider_reference = btrim(p_reference)
  for update;

  if v_row.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'studio_topup_unknown');
  end if;

  if v_row.status = 'paid' then
    return jsonb_build_object('status', 'captured', 'already', true);
  end if;

  if v_row.status <> 'pending' then
    return jsonb_build_object('status', 'ignored', 'reason', 'studio_topup_not_pending');
  end if;

  if round(p_amount, 2) <> v_row.amount_fcfa
     or upper(btrim(p_currency)) <> 'XOF' then
    return jsonb_build_object('status', 'ignored', 'reason', 'amount_mismatch');
  end if;

  select * into v_balance
  from public.store_studio_balance
  where store_id = v_row.store_id
  for update;

  if v_balance.store_id is null then
    insert into public.store_studio_balance (store_id, balance_fcfa, total_recharged)
    values (v_row.store_id, 0, 0)
    on conflict (store_id) do nothing;

    select * into v_balance
    from public.store_studio_balance
    where store_id = v_row.store_id
    for update;
  end if;

  update public.store_studio_balance
  set balance_fcfa = balance_fcfa + v_row.amount_fcfa,
      total_recharged = total_recharged + v_row.amount_fcfa
  where store_id = v_row.store_id
  returning * into v_balance;

  update public.studio_topups
  set status = 'paid',
      paid_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'status', 'captured',
    'balance', v_balance.balance_fcfa
  );
end;
$$;

revoke execute on function public.confirm_studio_topup(text, numeric, text)
  from public, anon, authenticated;
grant execute on function public.confirm_studio_topup(text, numeric, text)
  to service_role;

create or replace function public.fail_studio_topup(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.studio_topups
  set status = 'failed'
  where provider_reference = btrim(p_reference)
    and status = 'pending';

  return jsonb_build_object('status', 'failed');
end;
$$;

revoke execute on function public.fail_studio_topup(text)
  from public, anon, authenticated;
grant execute on function public.fail_studio_topup(text)
  to service_role;

/* ------------------------------------------------------------------ *
 *  Administration
 * ------------------------------------------------------------------ */

create or replace function public.admin_update_studio_pricing(
  p_action_type text,
  p_price_fcfa  integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_platform_admin' using errcode = '42501';
  end if;

  if p_price_fcfa is null or p_price_fcfa < 0 or p_price_fcfa > 1000000 then
    raise exception 'studio_price_invalid' using errcode = '22023';
  end if;

  update public.studio_pricing
  set price_fcfa = p_price_fcfa
  where action_type = btrim(p_action_type);

  if not found then
    raise exception 'studio_action_unknown' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'actionType', btrim(p_action_type),
    'priceFcfa', p_price_fcfa
  );
end;
$$;

revoke execute on function public.admin_update_studio_pricing(text, integer)
  from public, anon, authenticated;
grant execute on function public.admin_update_studio_pricing(text, integer)
  to authenticated;

create or replace function public.admin_credit_studio(
  p_store_id uuid,
  p_amount   integer,
  p_reason   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance public.store_studio_balance%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'not_platform_admin' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'studio_amount_invalid' using errcode = '22023';
  end if;

  if not exists (select 1 from public.stores where id = p_store_id) then
    raise exception 'store_unknown' using errcode = '22023';
  end if;

  insert into public.store_studio_balance (store_id, balance_fcfa, total_recharged)
  values (p_store_id, 0, 0)
  on conflict (store_id) do nothing;

  update public.store_studio_balance
  set balance_fcfa = balance_fcfa + p_amount
  where store_id = p_store_id
  returning * into v_balance;

  -- Geste commercial : ce n'est pas du chiffre d'affaires, donc
  -- total_recharged n'est pas incrémenté.
  insert into public.studio_topups (
    store_id, amount_fcfa, status, provider, note, paid_at
  )
  values (
    p_store_id, p_amount, 'paid', 'manual',
    nullif(btrim(coalesce(p_reason, '')), ''), now()
  );

  return jsonb_build_object('balance', v_balance.balance_fcfa);
end;
$$;

revoke execute on function public.admin_credit_studio(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.admin_credit_studio(uuid, integer, text)
  to authenticated;

create or replace function public.admin_studio_overview()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'not_platform_admin' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'recharged', coalesce((
      select sum(amount_fcfa) from public.studio_topups
      where provider = 'saspay' and status = 'paid'
    ), 0),
    'spent', coalesce((
      select sum(price_paid_fcfa) from public.studio_generations
    ), 0),
    'cost', coalesce((
      select sum(cost_real_fcfa) from public.studio_generations
    ), 0),
    'margin', coalesce((
      select sum(margin_fcfa) from public.studio_generations
    ), 0),
    'balances', coalesce((
      select sum(balance_fcfa) from public.store_studio_balance
    ), 0),
    'merchants', (
      select count(*) from public.store_studio_balance
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_studio_overview()
  from public, anon, authenticated;
grant execute on function public.admin_studio_overview()
  to authenticated;
