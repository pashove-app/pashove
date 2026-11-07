-- PASHOVE — Famille comptable `mobile_money`
--
-- Les réseaux SasPay qui ne relèvent ni d'Orange, ni de Moov, ni de MTN, ni de
-- Wave (Djamo, Celtiis, Airtel, Wizall, Mobi Cash…) sont enregistrés sous la
-- famille `mobile_money`. Le code réseau exact reste dans `payments.network_code`.
--
-- Le remboursement par ledger est désormais réservé au Mock : SasPay n'expose
-- aucun endpoint de remboursement, et marquer une commande remboursée sans
-- rendre l'argent fausserait le ledger.

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments
  add constraint payments_method_check
  check (method in ('cod', 'orange_money', 'wave', 'mtn_money', 'moov_money', 'mobile_money', 'card'));

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cod', 'orange_money', 'wave', 'mtn_money', 'moov_money', 'mobile_money', 'card'));

create or replace function public.place_online_order(
  p_token           uuid,
  p_customer        jsonb,
  p_idempotency_key uuid,
  p_method          text,
  p_provider        text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_method  text := lower(btrim(coalesce(p_method, '')));
  v_provider text := lower(btrim(coalesce(p_provider, 'mock')));
  v_result  jsonb;
  v_order_id uuid;
  v_order   public.orders%rowtype;
  v_plan    text := 'free';
  v_physical boolean;
begin
  if v_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'mobile_money', 'card') then
    raise exception 'payment_method_invalid' using errcode = '22023';
  end if;

  if v_provider not in ('mock', 'saspay') then
    raise exception 'payment_provider_invalid' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.payment_providers p
    where p.code = v_provider and p.status = 'active'
  ) then
    raise exception 'payment_method_unavailable' using errcode = '22023';
  end if;

  v_result := public.place_order(p_token, p_customer, p_idempotency_key);
  v_order_id := (v_result->>'orderId')::uuid;

  select o.* into v_order from public.orders o where o.id = v_order_id for update;

  select exists (
    select 1 from public.order_items oi
    where oi.order_id = v_order_id
      and oi.product_type in ('physical', 'bundle')
  ) into v_physical;

  select coalesce(ap.plan_code, 'free') into v_plan
  from public.store_members sm
  left join public.account_plans ap on ap.user_id = sm.user_id
  where sm.store_id = v_order.store_id
    and sm.role = 'owner'
  order by sm.created_at
  limit 1;

  if v_plan is null then
    v_plan := 'free';
  end if;

  if v_plan not in ('standard', 'pro') and v_physical then
    raise exception 'payment_method_unavailable' using errcode = '22023';
  end if;

  update public.orders
  set payment_method = v_method,
      payment_status = 'pending',
      status = 'pending'
  where id = v_order_id
    and payment_status = 'pending';

  update public.payments
  set provider = v_provider,
      method = v_method,
      status = 'pending',
      reference = null,
      idempotency_key = p_idempotency_key::text
  where order_id = v_order_id
    and provider = 'cod';

  return v_result || jsonb_build_object(
    'method', v_method,
    'provider', v_provider,
    'total', v_order.total_amount,
    'currency', v_order.currency
  );
end;
$$;

create or replace function public.post_online_sale(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_entries jsonb;
begin
  select o.* into v_order from public.orders o where o.id = p_order_id;

  if v_order.id is null
     or v_order.payment_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'mobile_money', 'card')
     or v_order.payment_status <> 'paid'
     or v_order.total_amount <= 0 then
    return null;
  end if;

  if v_order.total_amount
     <> v_order.subtotal_amount + v_order.shipping_amount - v_order.discount_amount then
    raise exception 'invalid_order_amounts' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.payments p
    where p.order_id = v_order.id
      and p.provider in ('mock', 'saspay')
      and p.status = 'captured'
  ) then
    raise exception 'online_capture_missing' using errcode = '22023';
  end if;

  select jsonb_agg(entry)
  into v_entries
  from jsonb_array_elements(
    jsonb_build_array(
      jsonb_build_object('account', 'available', 'direction', 'debit',
        'amount', v_order.total_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'sales', 'direction', 'credit',
        'amount', v_order.subtotal_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'shipping_income', 'direction', 'credit',
        'amount', v_order.shipping_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'discounts', 'direction', 'debit',
        'amount', v_order.discount_amount, 'currency', v_order.currency)
    )
  ) as entry
  where (entry->>'amount')::bigint > 0;

  if v_entries is null then return null; end if;

  return public.post_ledger_transaction(
    v_order.store_id, 'online_capture', 'order', v_order.id,
    'online-sale:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'payment_method', v_order.payment_method,
      'provider', (
        select p.provider from public.payments p
        where p.order_id = v_order.id and p.status = 'captured'
        order by p.created_at desc limit 1
      ),
      'discount_code', v_order.discount_code,
      'discount_amount', v_order.discount_amount
    ),
    v_entries
  );
end;
$$;

create or replace function public.post_online_commission(p_order_id uuid)
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
begin
  select o.* into v_order from public.orders o where o.id = p_order_id;
  select s.commission_bps into v_bps from public.stores s where s.id = v_order.store_id;

  if v_order.id is null
     or v_order.payment_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'mobile_money', 'card')
     or v_order.payment_status <> 'paid' then
    return null;
  end if;

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
      'commission_amount', v_amount
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

create or replace function public.refund_online_order(
  p_order_id uuid,
  p_reason   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_commission integer := 0;
  v_entries jsonb;
begin
  select o.* into v_order from public.orders o where o.id = p_order_id for update;

  if v_order.id is null
     or not (public.is_store_member(v_order.store_id) or public.is_platform_admin()) then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  if v_order.payment_status = 'refunded' then
    return jsonb_build_object('status', 'refunded', 'already', true);
  end if;

  if not exists (
    select 1 from public.payments p
    where p.order_id = v_order.id
      and p.provider = 'mock'
      and p.status = 'captured'
  ) then
    raise exception 'refund_not_supported' using errcode = '22023';
  end if;

  if v_order.payment_status <> 'paid'
     or v_order.payment_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'mobile_money', 'card') then
    raise exception 'refund_not_allowed' using errcode = '22023';
  end if;

  perform public.post_online_sale(v_order.id);
  perform public.post_online_commission(v_order.id);

  select coalesce((t.metadata->>'commission_amount')::integer, 0)
  into v_commission
  from public.ledger_transactions t
  where t.store_id = v_order.store_id
    and t.idempotency_key = 'online-commission:' || v_order.id::text;

  select jsonb_agg(entry)
  into v_entries
  from jsonb_array_elements(
    jsonb_build_array(
      jsonb_build_object('account', 'sales', 'direction', 'debit',
        'amount', v_order.subtotal_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'shipping_income', 'direction', 'debit',
        'amount', v_order.shipping_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'available', 'direction', 'credit',
        'amount', v_order.total_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'discounts', 'direction', 'credit',
        'amount', v_order.discount_amount, 'currency', v_order.currency)
    )
  ) as entry
  where (entry->>'amount')::bigint > 0;

  perform public.post_ledger_transaction(
    v_order.store_id, 'refund', 'order', v_order.id,
    'online-refund:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'refund',
      'provider', 'mock',
      'amount', v_order.total_amount,
      'discount_amount', v_order.discount_amount,
      'reason', v_reason
    ),
    v_entries
  );

  if v_commission > 0 then
    perform public.post_ledger_transaction(
      v_order.store_id, 'commission', 'order', v_order.id,
      'online-commission-refund:' || v_order.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'reversal',
        'commission_amount', v_commission,
        'reason', v_reason
      ),
      jsonb_build_array(
        jsonb_build_object('account', 'commission_due', 'direction', 'debit',
          'amount', v_commission, 'currency', v_order.currency),
        jsonb_build_object('account', 'fees', 'direction', 'credit',
          'amount', v_commission, 'currency', v_order.currency)
      )
    );
  end if;

  update public.orders set payment_status = 'refunded' where id = v_order.id;
  update public.payments
  set status = 'refunded'
  where order_id = v_order.id and provider = 'mock' and status = 'captured';

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order.id, v_order.store_id, 'refunded',
    jsonb_build_object('amount', v_order.total_amount, 'reason', v_reason, 'provider', 'mock')
  );

  return jsonb_build_object('status', 'refunded');
end;
$$;
