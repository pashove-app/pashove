-- PASHOVE — PLAN1b : abonnement par softpay
--
-- Le marchand paie Standard/Pro par un softpay SasPay. Le webhook confirme,
-- puis `set_account_plan` active le plan pour 30 jours.
--
-- Les frais réels du prestataire sont conservés sur le paiement
-- (`provider_fee`, `net_amount`) pour la comptabilité et la règle Free.

alter table public.payments
  add column if not exists provider_fee numeric(20, 2)
    check (provider_fee is null or provider_fee >= 0),
  add column if not exists net_amount numeric(20, 2)
    check (net_amount is null or net_amount >= 0);

drop function if exists public.confirm_saspay_payment(text, numeric, text);

create or replace function public.confirm_saspay_payment(
  p_reference text,
  p_amount    numeric,
  p_currency  text,
  p_fee       numeric default 0,
  p_net       numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order    public.orders%rowtype;
  v_payment  public.payments%rowtype;
  v_physical boolean;
begin
  select p.* into v_payment
  from public.payments p
  where p.reference = btrim(p_reference)
    and p.provider = 'saspay'
  for update;

  if v_payment.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'payment_unknown');
  end if;

  select o.* into v_order
  from public.orders o
  where o.id = v_payment.order_id
  for update;

  if v_order.payment_status = 'paid' and v_payment.status = 'captured' then
    return jsonb_build_object('status', 'paid', 'already', true);
  end if;

  if v_order.payment_status <> 'pending' or v_payment.status <> 'pending' then
    return jsonb_build_object('status', 'ignored', 'reason', 'payment_not_pending');
  end if;

  -- Le montant du webhook ne fait jamais foi : il doit correspondre au
  -- montant figé pour ce marché, ou, à défaut, au total de la commande
  -- converti dans sa devise de paiement.
  if v_order.payment_amount is not null and v_order.payment_currency is not null then
    if upper(btrim(p_currency)) <> upper(v_order.payment_currency)
       or round(p_amount, 2) <> round(v_order.payment_amount, 2) then
      update public.payment_transactions
      set status = 'failed',
          payload = jsonb_build_object(
            'reason', 'amount_mismatch',
            'expected_amount', v_order.payment_amount,
            'expected_currency', v_order.payment_currency,
            'received_amount', p_amount,
            'received_currency', p_currency
          )
      where payment_id = v_payment.id
        and type = 'intent_created';

      return jsonb_build_object('status', 'ignored', 'reason', 'amount_mismatch');
    end if;
  elsif round(p_amount, 2) <> round(
      v_order.total_amount
        / power(10, public.currency_decimals(v_order.currency)), 2)
     or upper(btrim(p_currency)) <> upper(v_order.currency) then
    update public.payment_transactions
    set status = 'failed',
        payload = jsonb_build_object(
          'reason', 'amount_mismatch',
          'expected_amount', v_order.total_amount,
          'expected_currency', v_order.currency,
          'received_amount', p_amount,
          'received_currency', p_currency
        )
    where payment_id = v_payment.id
      and type = 'intent_created';

    return jsonb_build_object('status', 'ignored', 'reason', 'amount_mismatch');
  end if;

  select exists (
    select 1 from public.order_items oi
    where oi.order_id = v_order.id
      and oi.product_type in ('physical', 'bundle')
  ) into v_physical;

  update public.payments
  set status = 'captured',
      amount_charged = round(p_amount, 2),
      provider_fee = case when coalesce(p_fee, 0) > 0 then round(p_fee, 2) else null end,
      net_amount = case
        when p_net is not null then round(p_net, 2)
        when coalesce(p_fee, 0) > 0 then round(p_amount - p_fee, 2)
        else null
      end
  where id = v_payment.id;

  insert into public.payment_transactions (
    payment_id, store_id, type, status, provider_reference, payload
  )
  values (
    v_payment.id, v_order.store_id, 'capture', 'captured',
    btrim(p_reference),
    jsonb_build_object(
      'order_number', v_order.number,
      'amount', v_order.total_amount,
      'provider', 'saspay'
    )
  );

  update public.orders
  set payment_status = 'paid',
      status = case when v_physical then 'confirmed' else 'delivered' end,
      confirmed_at = coalesce(confirmed_at, now())
  where id = v_order.id;

  perform public.post_online_sale(v_order.id);
  perform public.post_online_commission(v_order.id, p_fee);

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order.id, v_order.store_id, 'payment_collected',
    jsonb_build_object(
      'method', v_order.payment_method,
      'provider', 'saspay',
      'amount', v_order.total_amount
    )
  );

  return jsonb_build_object('status', 'paid');
end;
$$;

drop function if exists public.post_online_commission(uuid);

create or replace function public.post_online_commission(
  p_order_id     uuid,
  p_provider_fee numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_bps integer;
  v_base integer;
  v_amount integer;
  v_fee_included boolean := false;
  v_fee_store integer := 0;
begin
  select o.* into v_order from public.orders o where o.id = p_order_id;
  select s.commission_bps into v_bps from public.stores s where s.id = v_order.store_id;

  if v_order.id is null
     or v_order.payment_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'mobile_money', 'card')
     or v_order.payment_status <> 'paid' then
    return null;
  end if;

  -- Frais réels du prestataire, convertis dans la devise de la boutique.
  if coalesce(p_provider_fee, 0) > 0 then
    if v_order.payment_currency is not null
       and upper(v_order.payment_currency) <> upper(v_order.currency)
       and v_order.fx_rate is not null and v_order.fx_rate > 0 then
      v_fee_store := round(p_provider_fee / v_order.fx_rate)::integer;
    else
      v_fee_store := round(p_provider_fee)::integer;
    end if;
  end if;

  select p.fee_included into v_fee_included
  from public.store_members sm
  join public.account_plans ap on ap.user_id = sm.user_id
  join public.plans p on p.code = ap.plan_code
  where sm.store_id = v_order.store_id and sm.role = 'owner'
  order by sm.created_at
  limit 1;

  v_base := v_order.subtotal_amount - v_order.discount_amount;
  if v_base <= 0 or v_bps <= 0 then return null; end if;
  v_amount := round(v_base * v_bps / 10000.0)::integer;
  if v_amount <= 0 then return null; end if;

  return public.post_ledger_transaction(
    v_order.store_id, 'commission', 'order', v_order.id,
    'online-commission:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'charge',
      'provider', (
        select p.provider from public.payments p
        where p.order_id = v_order.id and p.status = 'captured'
        order by p.created_at desc limit 1
      ),
      'commission_bps', v_bps,
      'base_amount', v_base,
      'discount_amount', v_order.discount_amount,
      'commission_amount', v_amount,
      'provider_fee', v_fee_store,
      'provider_fee_source', p_provider_fee,
      'fee_absorbed', coalesce(v_fee_included, false),
      'platform_net', case
        when coalesce(v_fee_included, false)
          then greatest(v_amount - v_fee_store, 0)
        else v_amount
      end
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'fees', 'direction', 'debit',
        'amount', v_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'commission_due', 'direction', 'credit',
        'amount', v_amount, 'currency', v_order.currency)
    )
  );
end;
$$;

revoke execute on function public.post_online_commission(uuid, numeric)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Paiement d'abonnement
 * ------------------------------------------------------------------ */

create table if not exists public.plan_payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  plan_code     text not null references public.plans (code),
  amount        integer not null check (amount > 0),
  currency      text not null check (currency ~ '^[A-Z]{3}$'),
  provider      text not null default 'saspay',
  reference     text unique,
  network_code  text,
  redirect_url  text,
  country_code  text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  status        text not null default 'pending'
    check (status in ('pending', 'captured', 'failed')),
  period_start  timestamptz,
  period_end    timestamptz,
  created_at    timestamptz not null default now(),
  captured_at   timestamptz
);

alter table public.plan_payments enable row level security;

create policy plan_payments_select on public.plan_payments
  for select to authenticated
  using (user_id = auth.uid());

revoke all on public.plan_payments from public, anon, authenticated;
grant select on public.plan_payments to authenticated;

create or replace function public.create_plan_payment(p_plan_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_id uuid;
  v_existing public.plan_payments%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_plan from public.plans where code = p_plan_code;

  if v_plan.code is null or v_plan.price_amount <= 0 then
    raise exception 'plan_invalid' using errcode = '22023';
  end if;

  -- Un seul paiement en attente par compte : évite le double débit.
  select * into v_existing
  from public.plan_payments
  where user_id = v_user and status = 'pending'
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    if v_existing.reference is null then
      return jsonb_build_object(
        'id', v_existing.id,
        'planCode', v_existing.plan_code,
        'amount', v_existing.amount,
        'currency', v_existing.currency
      );
    end if;

    raise exception 'plan_payment_pending' using errcode = '22023';
  end if;

  insert into public.plan_payments (user_id, plan_code, amount, currency)
  values (v_user, v_plan.code, v_plan.price_amount, v_plan.currency)
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'planCode', v_plan.code,
    'amount', v_plan.price_amount,
    'currency', v_plan.currency
  );
end;
$$;

revoke execute on function public.create_plan_payment(text)
  from public, anon, authenticated;
grant execute on function public.create_plan_payment(text)
  to authenticated;

create or replace function public.record_plan_payment_intent(
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
  update public.plan_payments
  set reference = btrim(p_reference),
      network_code = nullif(btrim(coalesce(p_network, '')), ''),
      redirect_url = nullif(btrim(coalesce(p_redirect_url, '')), ''),
      country_code = nullif(upper(btrim(coalesce(p_country, ''))), '')
  where id = p_id
    and user_id = auth.uid()
    and status = 'pending'
    and reference is null;
end;
$$;

revoke execute on function public.record_plan_payment_intent(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_plan_payment_intent(uuid, text, text, text, text)
  to authenticated;

create or replace function public.confirm_plan_payment(
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
  v_row public.plan_payments%rowtype;
  v_plan jsonb;
begin
  select * into v_row
  from public.plan_payments
  where reference = btrim(p_reference)
  for update;

  if v_row.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'plan_payment_unknown');
  end if;

  if v_row.status = 'captured' then
    return jsonb_build_object('status', 'captured', 'already', true);
  end if;

  if v_row.status <> 'pending' then
    return jsonb_build_object('status', 'ignored', 'reason', 'plan_payment_not_pending');
  end if;

  if round(p_amount, 2) <> v_row.amount
     or upper(btrim(p_currency)) <> upper(v_row.currency) then
    return jsonb_build_object('status', 'ignored', 'reason', 'amount_mismatch');
  end if;

  v_plan := public.set_account_plan(v_row.user_id, v_row.plan_code, 30);

  update public.plan_payments
  set status = 'captured',
      captured_at = now(),
      period_start = now(),
      period_end = (v_plan->>'expiresAt')::timestamptz
  where id = v_row.id;

  return jsonb_build_object(
    'status', 'captured',
    'planCode', v_row.plan_code,
    'expiresAt', v_plan->>'expiresAt'
  );
end;
$$;

revoke execute on function public.confirm_plan_payment(text, numeric, text)
  from public, anon, authenticated;
grant execute on function public.confirm_plan_payment(text, numeric, text)
  to service_role;

create or replace function public.fail_plan_payment(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.plan_payments
  set status = 'failed'
  where reference = btrim(p_reference)
    and status = 'pending';

  return jsonb_build_object('status', 'failed');
end;
$$;

revoke execute on function public.fail_plan_payment(text)
  from public, anon, authenticated;
grant execute on function public.fail_plan_payment(text)
  to service_role;

revoke execute on function public.confirm_saspay_payment(text, numeric, text, numeric, numeric)
  from public, anon, authenticated;
grant execute on function public.confirm_saspay_payment(text, numeric, text, numeric, numeric)
  to service_role;
