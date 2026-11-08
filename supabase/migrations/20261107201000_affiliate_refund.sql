-- PASHOVE — P2b (complément) : annulation de la commission d'affiliation
--
-- Un remboursement reverse le split : le propriétaire récupère sa part et
-- l'affilié perd la commission, par écritures compensatoires idempotentes.

create or replace function public.reverse_affiliate_commission(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;

  if v_order.id is null
     or v_order.payment_status <> 'refunded'
     or v_order.affiliate_commission <= 0
     or v_order.affiliate_store_id is null
     or v_order.affiliate_store_id = v_order.store_id then
    return null;
  end if;

  perform public.post_ledger_transaction(
    v_order.store_id, 'adjustment', 'order', v_order.id,
    'affiliate-owner-reversal:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'affiliate_reversal',
      'affiliate_store_id', v_order.affiliate_store_id,
      'commission_amount', v_order.affiliate_commission,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'available', 'direction', 'debit',
        'amount', v_order.affiliate_commission, 'currency', v_order.currency),
      jsonb_build_object('account', 'affiliate_commission', 'direction', 'credit',
        'amount', v_order.affiliate_commission, 'currency', v_order.currency)
    )
  );

  perform public.post_ledger_transaction(
    v_order.affiliate_store_id, 'adjustment', 'order', v_order.id,
    'affiliate-income-reversal:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'affiliate_income_reversal',
      'source_store_id', v_order.store_id,
      'commission_amount', v_order.affiliate_commission,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'available', 'direction', 'credit',
        'amount', v_order.affiliate_commission, 'currency', v_order.currency),
      jsonb_build_object('account', 'affiliate_income', 'direction', 'debit',
        'amount', v_order.affiliate_commission, 'currency', v_order.currency)
    )
  );

  return v_order.id;
end;
$$;

revoke execute on function public.reverse_affiliate_commission(uuid)
  from public, anon, authenticated;

create or replace function public.ledger_on_order_paid_affiliate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if NEW.payment_status = 'paid'
     and OLD.payment_status is distinct from 'paid' then
    perform public.post_affiliate_commission(NEW.id);
  elsif NEW.payment_status = 'refunded'
        and OLD.payment_status is distinct from 'refunded' then
    perform public.reverse_affiliate_commission(NEW.id);
  end if;

  return NEW;
end;
$$;

revoke execute on function public.ledger_on_order_paid_affiliate()
  from public, anon, authenticated;
