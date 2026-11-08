-- PASHOVE — PLAN1c : refacturation des frais SasPay
--
-- Free : Pashove absorbe (aucune ligne pour le client, aucun débit marchand).
-- Standard/Pro « client » : SasPay reçoit ADD_ON, les frais s'ajoutent au
-- montant débité au client.
-- Standard/Pro « merchant » : DEDUCTED, et le ledger débite les frais réels
-- du marchand (fees / available) pour que son solde corresponde au net reçu.

drop function if exists public.confirm_saspay_payment(text, numeric, text, numeric, numeric);
drop function if exists public.checkout_payment_methods(text, boolean, text, text, integer, boolean);

create or replace function public.checkout_payment_methods(
  p_slug             text,
  p_has_non_physical boolean default false,
  p_country          text default null,
  p_currency         text default null,
  p_total            integer default 0,
  p_has_physical     boolean default true
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
  v_plan  text := 'free';
  v_online boolean;
  v_methods jsonb := '[]'::jsonb;
  v_fee_included boolean := false;
begin
  select s.* into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store.id is null then
    return null;
  end if;

  select coalesce(ap.plan_code, 'free') into v_plan
  from public.store_members sm
  left join public.account_plans ap on ap.user_id = sm.user_id
  where sm.store_id = v_store.id
    and sm.role = 'owner'
  order by sm.created_at
  limit 1;

  if v_plan is null then
    v_plan := 'free';
  end if;

  select coalesce(p.fee_included, false) into v_fee_included
  from public.plans p where p.code = v_plan;

  v_online := exists (
    select 1 from public.payment_providers p
    where p.code in ('saspay', 'mock') and p.status = 'active'
  );

  if v_store.cod_enabled and coalesce(p_has_physical, true) then
    v_methods := v_methods || '["cod"]'::jsonb;
  end if;

  if v_online and coalesce(p_total, 0) >= 200 then
    v_methods := v_methods ||
      '["orange_money","wave","mtn_money","moov_money"]'::jsonb;

    if coalesce(p_total, 0) >= 25000 then
      v_methods := v_methods || '["card"]'::jsonb;
    end if;
  end if;

  return jsonb_build_object(
    'planCode', v_plan,
    'currency', v_store.currency,
    'country', coalesce(p_country, v_store.country),
    'methods', v_methods,
    'minimumOnline', 200,
    'minimumCard', 25000,
    'feeIncluded', v_fee_included,
    'feeChargeMode', v_store.fee_charge_mode
  );
end;
$$;

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
  v_fee_included boolean := false;
  v_fee_mode text := 'merchant';
  v_fee_store integer := 0;
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

  -- Frais supportés par le marchand (Standard/Pro, mode « merchant »).
  -- En Free, Pashove les absorbe ; en mode « client », le client les paie.
  select p.fee_included into v_fee_included
  from public.store_members sm
  join public.account_plans ap on ap.user_id = sm.user_id
  join public.plans p on p.code = ap.plan_code
  where sm.store_id = v_order.store_id and sm.role = 'owner'
  order by sm.created_at
  limit 1;

  select s.fee_charge_mode into v_fee_mode
  from public.stores s where s.id = v_order.store_id;

  if coalesce(v_fee_included, false) = false
     and coalesce(v_fee_mode, 'merchant') = 'merchant'
     and coalesce(p_fee, 0) > 0 then
    if v_order.payment_currency is not null
       and upper(v_order.payment_currency) <> upper(v_order.currency)
       and v_order.fx_rate is not null and v_order.fx_rate > 0 then
      v_fee_store := round(p_fee / v_order.fx_rate)::integer;
    else
      v_fee_store := round(p_fee)::integer;
    end if;

    if v_fee_store > 0 then
      perform public.post_ledger_transaction(
        v_order.store_id, 'commission', 'order', v_order.id,
        'saspay-fee-charge:' || v_order.id::text,
        jsonb_build_object(
          'order_number', v_order.number,
          'role', 'provider_fee',
          'provider', 'saspay',
          'provider_fee', p_fee,
          'payment_currency', p_currency,
          'fee_amount', v_fee_store,
          'currency', v_order.currency
        ),
        jsonb_build_array(
          jsonb_build_object('account', 'fees', 'direction', 'debit',
            'amount', v_fee_store, 'currency', v_order.currency),
          jsonb_build_object('account', 'available', 'direction', 'credit',
            'amount', v_fee_store, 'currency', v_order.currency)
        )
      );
    end if;
  end if;

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
revoke execute on function public.confirm_saspay_payment(text, numeric, text, numeric, numeric)
  from public, anon, authenticated;
grant execute on function public.confirm_saspay_payment(text, numeric, text, numeric, numeric)
  to service_role;

revoke execute on function public.checkout_payment_methods(text, boolean, text, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.checkout_payment_methods(text, boolean, text, text, integer, boolean)
  to anon, authenticated;
