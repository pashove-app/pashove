-- PASHOVE — FX4 : confirmation multi-devises
--
-- Le montant du webhook est comparé au montant figé pour le marché
-- (`orders.payment_amount`) quand il existe, sinon au total de la commande
-- converti dans la devise de paiement. Le ledger reste tenu dans la devise de
-- la boutique : Pashove absorbe l'écart d'arrondi.

create or replace function public.currency_decimals(p_currency text)
returns integer
language sql
immutable
as $$
  select case upper(btrim(coalesce(p_currency, '')))
    when 'XOF' then 0
    when 'XAF' then 0
    when 'GNF' then 0
    when 'UGX' then 0
    when 'RWF' then 0
    else 2
  end;
$$;

grant execute on function public.currency_decimals(text)
  to anon, authenticated;

create index if not exists fx_rates_source_idx on public.fx_rates (source);

drop function if exists public.confirm_saspay_payment(text, integer, text);

create or replace function public.confirm_saspay_payment(
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
      amount_charged = round(p_amount, 2)
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
  perform public.post_online_commission(v_order.id);

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

revoke execute on function public.confirm_saspay_payment(text, numeric, text)
  from public, anon, authenticated;
grant execute on function public.confirm_saspay_payment(text, numeric, text)
  to service_role;

revoke execute on function public.fail_saspay_payment(text)
  from public, anon, authenticated;
grant execute on function public.fail_saspay_payment(text)
  to service_role;

/* Taux et provenance en une seule lecture, pour figer `orders.fx_source`. */
create or replace function public.public_fx_quote(p_from text, p_to text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from text := upper(btrim(coalesce(p_from, '')));
  v_to   text := upper(btrim(coalesce(p_to, '')));
  v_row  public.fx_rates%rowtype;
begin
  if v_from = '' or v_to = '' or v_from = v_to then
    return null;
  end if;

  select * into v_row from public.fx_rates r
  where r.from_currency = v_from and r.to_currency = v_to;

  if v_row.rate is not null then
    return jsonb_build_object('rate', v_row.rate, 'source', v_row.source);
  end if;

  select * into v_row from public.fx_rates r
  where r.from_currency = v_to and r.to_currency = v_from;

  if v_row.rate is not null then
    return jsonb_build_object('rate', 1 / v_row.rate, 'source', v_row.source);
  end if;

  return null;
end;
$$;

revoke execute on function public.public_fx_quote(text, text)
  from public, anon, authenticated;
grant execute on function public.public_fx_quote(text, text)
  to anon, authenticated;
