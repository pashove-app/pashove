
/* ------------------------------------------------------------------ *
 *  Ventilation partenaire dans le ledger
 * ------------------------------------------------------------------ */

create or replace function public.post_partner_sales(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders%rowtype;
  v_group   record;
  v_fee     integer;
  v_revenue integer;
begin
  select o.* into v_order
  from public.orders o
  where o.id = p_order_id;

  if v_order.id is null then
    return;
  end if;

  for v_group in
    select
      source_store_id,
      sum(amount)::integer as amount,
      sum(partner_commission)::integer as partner_commission,
      sum(platform_commission)::integer as platform_commission,
      sum(source_revenue)::integer as source_revenue
    from public.partner_sales
    where order_id = p_order_id
      and status <> 'reversed'
    group by source_store_id
  loop
    v_fee := least(
      v_group.platform_commission,
      greatest(v_group.amount - v_group.partner_commission, 0)
    );
    v_revenue := greatest(
      v_group.amount - v_group.partner_commission - v_fee,
      0
    );

    -- B : la vente brute devient sa commission + une dette envers A.
    perform public.post_ledger_transaction(
      v_order.store_id,
      'partner_sale',
      'order',
      p_order_id,
      'partner-reclass:' || p_order_id::text || ':' || v_group.source_store_id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'partner_reclass',
        'source_store_id', v_group.source_store_id,
        'amount', v_group.amount,
        'partner_commission', v_group.partner_commission
      ),
      jsonb_build_array(
        jsonb_build_object(
          'account', 'sales', 'direction', 'debit',
          'amount', v_group.amount, 'currency', v_order.currency
        ),
        jsonb_build_object(
          'account', 'sales', 'direction', 'credit',
          'amount', v_group.partner_commission, 'currency', v_order.currency
        ),
        jsonb_build_object(
          'account', 'partner_payable', 'direction', 'credit',
          'amount', v_group.amount - v_group.partner_commission,
          'currency', v_order.currency
        )
      )
    );

    -- B : la commission Pashove de cette ligne est portée par A.
    if v_fee > 0 then
      perform public.post_ledger_transaction(
        v_order.store_id,
        'partner_sale',
        'order',
        p_order_id,
        'partner-fee:' || p_order_id::text || ':' || v_group.source_store_id::text,
        jsonb_build_object(
          'order_number', v_order.number,
          'role', 'partner_fee_reclass',
          'amount', v_fee
        ),
        jsonb_build_array(
          jsonb_build_object(
            'account', 'commission_due', 'direction', 'debit',
            'amount', v_fee, 'currency', v_order.currency
          ),
          jsonb_build_object(
            'account', 'fees', 'direction', 'credit',
            'amount', v_fee, 'currency', v_order.currency
          )
        )
      );
    end if;

    -- A : créance sur B, revenu net, commission Pashove.
    perform public.post_ledger_transaction(
      v_group.source_store_id,
      'partner_sale',
      'order',
      p_order_id,
      'partner-revenue:' || p_order_id::text || ':' || v_group.source_store_id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'partner_revenue',
        'partner_store_id', v_order.store_id,
        'amount', v_group.amount,
        'partner_commission', v_group.partner_commission,
        'platform_commission', v_fee,
        'source_revenue', v_revenue
      ),
      (
        select jsonb_agg(entry)
        from jsonb_array_elements(
          jsonb_build_array(
            jsonb_build_object(
              'account', 'partner_receivable', 'direction', 'debit',
              'amount', v_group.amount - v_group.partner_commission,
              'currency', v_order.currency
            ),
            jsonb_build_object(
              'account', 'sales', 'direction', 'credit',
              'amount', v_revenue, 'currency', v_order.currency
            ),
            jsonb_build_object(
              'account', 'commission_due', 'direction', 'credit',
              'amount', v_fee, 'currency', v_order.currency
            )
          )
        ) as entry
        where (entry->>'amount')::bigint > 0
      )
    );
  end loop;
end;
$$;

revoke execute on function public.post_partner_sales(uuid)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Vente COD : ajoute la ventilation partenaire après la vente
 * ------------------------------------------------------------------ */

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

  if v_order.total_amount
     <> v_order.subtotal_amount + v_order.shipping_amount - v_order.discount_amount then
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
      ),
      jsonb_build_object(
        'account', 'discounts', 'direction', 'debit',
        'amount', v_order.discount_amount, 'currency', v_order.currency
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
      'payment_method', 'cod',
      'discount_code', v_order.discount_code,
      'discount_amount', v_order.discount_amount
    ),
    v_entries
  );

  perform public.post_cod_commission(v_order.id);
  perform public.post_partner_sales(v_order.id);

  return v_sale;
end;
$$;

revoke execute on function public.post_cod_sale(uuid)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Remboursement d'une commande partenaire
 * ------------------------------------------------------------------ */

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
  v_partner_amount integer := 0;
  v_partner_commission integer := 0;
  v_partner_fee integer := 0;
  v_own_fee integer := 0;
  v_group      record;
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

  perform public.post_cod_sale(v_order.id);

  select
    coalesce(sum(amount), 0)::integer,
    coalesce(sum(partner_commission), 0)::integer,
    coalesce(sum(platform_commission), 0)::integer
  into v_partner_amount, v_partner_commission, v_partner_fee
  from public.partner_sales
  where order_id = v_order.id
    and status <> 'reversed';

  select coalesce((t.metadata->>'commission_amount')::integer, 0)
  into v_commission
  from public.ledger_transactions t
  where t.store_id = v_order.store_id
    and t.idempotency_key = 'cod-commission:' || v_order.id::text;

  v_own_fee := greatest(v_commission - v_partner_fee, 0);

  select jsonb_agg(entry)
  into v_entries
  from jsonb_array_elements(
    jsonb_build_array(
      jsonb_build_object(
        'account', 'sales', 'direction', 'debit',
        'amount', v_order.subtotal_amount - v_partner_amount + v_partner_commission,
        'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'partner_payable', 'direction', 'debit',
        'amount', v_partner_amount - v_partner_commission,
        'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'shipping_income', 'direction', 'debit',
        'amount', v_order.shipping_amount, 'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'cod_cash', 'direction', 'credit',
        'amount', v_order.total_amount, 'currency', v_order.currency
      ),
      jsonb_build_object(
        'account', 'discounts', 'direction', 'credit',
        'amount', v_order.discount_amount, 'currency', v_order.currency
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
      'discount_amount', v_order.discount_amount,
      'partner_amount', v_partner_amount,
      'reason', v_reason
    ),
    v_entries
  );

  if v_own_fee > 0 then
    perform public.post_ledger_transaction(
      v_order.store_id,
      'commission',
      'order',
      v_order.id,
      'cod-commission-refund:' || v_order.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'reversal',
        'commission_amount', v_own_fee,
        'reason', v_reason
      ),
      jsonb_build_array(
        jsonb_build_object(
          'account', 'commission_due', 'direction', 'debit',
          'amount', v_own_fee, 'currency', v_order.currency
        ),
        jsonb_build_object(
          'account', 'fees', 'direction', 'credit',
          'amount', v_own_fee, 'currency', v_order.currency
        )
      )
    );
  end if;

  -- Annulation du revenu source et de la commission Pashove chez A.
  for v_group in
    select
      source_store_id,
      sum(amount)::integer as amount,
      sum(partner_commission)::integer as partner_commission,
      sum(platform_commission)::integer as platform_commission,
      sum(source_revenue)::integer as source_revenue
    from public.partner_sales
    where order_id = v_order.id
      and status <> 'reversed'
    group by source_store_id
  loop
    perform public.post_ledger_transaction(
      v_group.source_store_id,
      'partner_sale',
      'order',
      v_order.id,
      'partner-refund:' || v_order.id::text || ':' || v_group.source_store_id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'partner_refund',
        'partner_store_id', v_order.store_id,
        'reason', v_reason
      ),
      (
        select jsonb_agg(entry)
        from jsonb_array_elements(
          jsonb_build_array(
            jsonb_build_object(
              'account', 'sales', 'direction', 'debit',
              'amount', v_group.source_revenue, 'currency', v_order.currency
            ),
            jsonb_build_object(
              'account', 'commission_due', 'direction', 'debit',
              'amount', v_group.platform_commission, 'currency', v_order.currency
            ),
            jsonb_build_object(
              'account', 'partner_receivable', 'direction', 'credit',
              'amount', v_group.amount - v_group.partner_commission,
              'currency', v_order.currency
            )
          )
        ) as entry
        where (entry->>'amount')::bigint > 0
      )
    );
  end loop;

  update public.partner_sales
  set status = 'reversed'
  where order_id = v_order.id
    and status <> 'reversed';

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
