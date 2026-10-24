-- Commissions et remboursements.
--
-- Plan gratuit : 10 % du sous-total hors livraison. Le taux est porté par la
-- boutique, mais chaque transaction en garde une copie : changer de plan ne
-- réécrit jamais le passé.
--
-- Une vente COD crée une créance de Pashove envers le marchand
-- (`commission_due`). Un remboursement l'annule par écritures compensatoires.

alter table public.stores
  add column commission_bps integer not null default 1000
    check (commission_bps between 0 and 10000);

create or replace function public.post_cod_commission(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders%rowtype;
  v_bps     integer;
  v_amount  integer;
begin
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id;

  select s.commission_bps into v_bps
  from public.stores s
  where s.id = v_order.store_id;

  if v_order.id is null
     or v_order.payment_method <> 'cod'
     or v_order.payment_status <> 'paid'
     or v_order.subtotal_amount <= 0
     or v_bps <= 0 then
    return null;
  end if;

  v_amount := round(v_order.subtotal_amount * v_bps / 10000.0)::integer;

  if v_amount <= 0 then
    return null;
  end if;

  return public.post_ledger_transaction(
    v_order.store_id,
    'commission',
    'order',
    v_order.id,
    'cod-commission:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'charge',
      'commission_bps', v_bps,
      'base_amount', v_order.subtotal_amount,
      'commission_amount', v_amount
    ),
    jsonb_build_array(
      jsonb_build_object(
        'account', 'fees', 'direction', 'debit',
        'amount', v_amount, 'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'commission_due', 'direction', 'credit',
        'amount', v_amount, 'currency', v_order.currency
      )
    )
  );
end;
$$;

revoke execute on function public.post_cod_commission(uuid)
  from public, anon, authenticated;

create or replace function public.post_cod_sale(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders%rowtype;
  v_entries jsonb;
  v_sale    uuid;
begin
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id;

  if v_order.id is null
     or v_order.payment_method <> 'cod'
     or v_order.payment_status <> 'paid'
     or v_order.total_amount <= 0 then
    return null;
  end if;

  if v_order.total_amount <> v_order.subtotal_amount + v_order.shipping_amount then
    raise exception 'invalid_order_amounts' using errcode = '22023';
  end if;

  select jsonb_agg(entry)
  into v_entries
  from jsonb_array_elements(
    jsonb_build_array(
      jsonb_build_object(
        'account', 'cod_cash', 'direction', 'debit',
        'amount', v_order.total_amount, 'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'sales', 'direction', 'credit',
        'amount', v_order.subtotal_amount, 'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'shipping_income', 'direction', 'credit',
        'amount', v_order.shipping_amount, 'currency', v_order.currency
      )
    )
  ) as entry
  where (entry->>'amount')::bigint > 0;

  if v_entries is null then
    return null;
  end if;

  v_sale := public.post_ledger_transaction(
    v_order.store_id,
    'cod_sale',
    'order',
    v_order.id,
    'cod-sale:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'payment_method', 'cod'
    ),
    v_entries
  );

  perform public.post_cod_commission(v_order.id);

  return v_sale;
end;
$$;

revoke execute on function public.post_cod_sale(uuid)
  from public, anon, authenticated;

/**
 * Remboursement intégral d'une commande COD payée.
 *
 * Deux écritures compensatoires : la vente (espèces, ventes, livraison) et la
 * commission. Aucune ligne n'est modifiée ni supprimée. La commande passe en
 * `refunded`, sans toucher à son statut logistique.
 */
create or replace function public.refund_cod_order(
  p_order_id uuid,
  p_reason   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order      public.orders%rowtype;
  v_reason     text := nullif(btrim(coalesce(p_reason, '')), '');
  v_commission integer := 0;
  v_entries    jsonb;
begin
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if v_order.id is null or not public.is_store_member(v_order.store_id) then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  if v_order.payment_status = 'refunded' then
    return jsonb_build_object('status', 'refunded', 'already', true);
  end if;

  if v_order.payment_status <> 'paid'
     or v_order.payment_method <> 'cod' then
    raise exception 'refund_not_allowed' using errcode = '22023';
  end if;

  -- S'assure que la vente et la commission existent, puis lit la commission
  -- réellement postée (le taux a pu changer depuis la vente).
  perform public.post_cod_sale(v_order.id);

  select coalesce((t.metadata->>'commission_amount')::integer, 0)
  into v_commission
  from public.ledger_transactions t
  where t.store_id = v_order.store_id
    and t.idempotency_key = 'cod-commission:' || v_order.id::text;

  select jsonb_agg(entry)
  into v_entries
  from jsonb_array_elements(
    jsonb_build_array(
      jsonb_build_object(
        'account', 'sales', 'direction', 'debit',
        'amount', v_order.subtotal_amount, 'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'shipping_income', 'direction', 'debit',
        'amount', v_order.shipping_amount, 'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'cod_cash', 'direction', 'credit',
        'amount', v_order.total_amount, 'currency', v_order.currency
      )
    )
  ) as entry
  where (entry->>'amount')::bigint > 0;

  perform public.post_ledger_transaction(
    v_order.store_id,
    'refund',
    'order',
    v_order.id,
    'cod-refund:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'refund',
      'amount', v_order.total_amount,
      'reason', v_reason
    ),
    v_entries
  );

  if v_commission > 0 then
    perform public.post_ledger_transaction(
      v_order.store_id,
      'commission',
      'order',
      v_order.id,
      'cod-commission-refund:' || v_order.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'reversal',
        'commission_amount', v_commission,
        'reason', v_reason
      ),
      jsonb_build_array(
        jsonb_build_object(
          'account', 'commission_due', 'direction', 'debit',
          'amount', v_commission, 'currency', v_order.currency
        ),
        jsonb_build_object(
          'account', 'fees', 'direction', 'credit',
          'amount', v_commission, 'currency', v_order.currency
        )
      )
    );
  end if;

  update public.orders
  set payment_status = 'refunded'
  where id = v_order.id;

  update public.payments
  set status = 'refunded'
  where order_id = v_order.id
    and provider = 'cod'
    and status = 'captured';

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order.id,
    v_order.store_id,
    'refunded',
    jsonb_build_object(
      'amount', v_order.total_amount,
      'reason', v_reason
    )
  );

  return jsonb_build_object('status', 'refunded');
end;
$$;

revoke execute on function public.refund_cod_order(uuid, text)
  from public, anon, authenticated;
grant execute on function public.refund_cod_order(uuid, text)
  to authenticated;

-- Commission des ventes COD déjà encaissées. La vente existe déjà : la clé
-- d'idempotence la laisse intacte, seule la commission est ajoutée.
do $$
declare
  v_order uuid;
begin
  for v_order in
    select o.id
    from public.orders o
    where o.payment_method = 'cod'
      and o.payment_status = 'paid'
  loop
    perform public.post_cod_sale(v_order);
  end loop;
end;
$$;
