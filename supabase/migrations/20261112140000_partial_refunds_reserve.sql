-- PASHOVE — Remboursements partiels et réserve de remboursement
--
-- Un remboursement peut cibler des lignes de commande précises. Le montant est
-- calculé côté serveur (prix unitaire × quantité, moins la quote-part de
-- remise). Le stock physique est rendu à la confirmation.
--
-- Une réserve de 5 % du chiffre d'affaires des 30 derniers jours est maintenue
-- par boutique et déduite du montant retirable. Les remboursements demandés
-- immobilisent aussi leur montant sur le compte `refund_reserve` du ledger.

alter table public.ledger_accounts drop constraint if exists ledger_accounts_code_check;
alter table public.ledger_accounts
  add constraint ledger_accounts_code_check
  check (code in (
    'affiliate_commission', 'affiliate_income', 'available', 'cod_cash',
    'commission_due', 'delivery_commission_income', 'delivery_income',
    'discounts', 'fees', 'partner_payable', 'partner_receivable',
    'payouts', 'pending', 'refund_reserve', 'reserved', 'sales',
    'shipping_income', 'saspay_fees_absorbed'
  ));

create table public.store_financial_reserves (
  store_id       uuid primary key references public.stores (id) on delete cascade,
  reserved_fcfa  integer not null default 0 check (reserved_fcfa >= 0),
  updated_at     timestamptz not null default now()
);

alter table public.store_financial_reserves enable row level security;
revoke all on public.store_financial_reserves from public, anon, authenticated;
grant select on public.store_financial_reserves to authenticated;

create policy store_financial_reserves_select on public.store_financial_reserves
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create table public.refund_items (
  id            uuid primary key default gen_random_uuid(),
  refund_id     uuid not null references public.refunds (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  quantity      integer not null check (quantity > 0),
  amount        integer not null check (amount >= 0),
  unique (refund_id, order_item_id)
);

create index refund_items_refund_idx on public.refund_items (refund_id);

alter table public.refund_items enable row level security;
revoke all on public.refund_items from public, anon, authenticated;
grant select on public.refund_items to authenticated;

create policy refund_items_select on public.refund_items
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.refunds r
      where r.id = refund_id and public.is_store_member(r.store_id)
    )
  );

/* ------------------------------------------------------------------ *
 *  Réserve sur le ledger
 * ------------------------------------------------------------------ */

create or replace function public.reserve_refund_funds()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'requested' and new.amount > 0 then
    perform public.post_ledger_transaction(
      new.store_id, 'adjustment', 'refund', new.id,
      'refund-reserve:' || new.id::text,
      jsonb_build_object('role', 'refund_reserve', 'amount', new.amount),
      jsonb_build_array(
        jsonb_build_object('account', 'available', 'direction', 'credit',
          'amount', new.amount, 'currency', new.currency),
        jsonb_build_object('account', 'refund_reserve', 'direction', 'debit',
          'amount', new.amount, 'currency', new.currency)
      )
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.reserve_refund_funds()
  from public, anon, authenticated;

drop trigger if exists refunds_reserve_funds on public.refunds;
create trigger refunds_reserve_funds
  after insert on public.refunds
  for each row execute function public.reserve_refund_funds();

create or replace function public.release_refund_funds()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'requested'
     and new.status in ('completed', 'failed', 'rejected')
     and old.amount > 0 then
    perform public.post_ledger_transaction(
      new.store_id, 'adjustment', 'refund', new.id,
      'refund-release:' || new.id::text,
      jsonb_build_object('role', 'refund_release', 'amount', old.amount),
      jsonb_build_array(
        jsonb_build_object('account', 'available', 'direction', 'debit',
          'amount', old.amount, 'currency', new.currency),
        jsonb_build_object('account', 'refund_reserve', 'direction', 'credit',
          'amount', old.amount, 'currency', new.currency)
      )
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.release_refund_funds()
  from public, anon, authenticated;

drop trigger if exists refunds_release_funds on public.refunds;
create trigger refunds_release_funds
  after update on public.refunds
  for each row execute function public.release_refund_funds();

/* ------------------------------------------------------------------ *
 *  Demande de remboursement partiel
 * ------------------------------------------------------------------ */

create or replace function public.request_partial_refund(
  p_order_id uuid,
  p_items    jsonb,
  p_reason   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order     public.orders%rowtype;
  v_payment   public.payments%rowtype;
  v_item      jsonb;
  v_order_item public.order_items%rowtype;
  v_quantity  integer;
  v_already   integer;
  v_amount    integer := 0;
  v_total     integer := 0;
  v_discount  integer;
  v_refund_id uuid;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  if not (
    public.is_platform_admin()
    or public.has_store_role(
      v_order.store_id,
      array['owner', 'admin']::public.store_role[]
    )
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if v_order.payment_status <> 'paid' then
    raise exception 'refund_not_allowed' using errcode = '22023';
  end if;

  select * into v_payment
  from public.payments
  where order_id = v_order.id and provider = 'saspay' and status = 'captured'
  order by created_at desc
  limit 1
  for update;

  if v_payment.id is null then
    raise exception 'refund_not_supported' using errcode = '22023';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'refund_items_empty' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_order_item
    from public.order_items
    where id = (v_item->>'order_item_id')::uuid
      and order_id = v_order.id
    for update;

    if v_order_item.id is null then
      raise exception 'refund_item_unknown' using errcode = '22023';
    end if;

    v_quantity := greatest(coalesce((v_item->>'quantity')::integer, 0), 0);

    if v_quantity <= 0 or v_quantity > v_order_item.quantity then
      raise exception 'refund_quantity_invalid' using errcode = '22023';
    end if;

    select coalesce(sum(ri.quantity), 0)
    into v_already
    from public.refund_items ri
    join public.refunds r on r.id = ri.refund_id
    where ri.order_item_id = v_order_item.id
      and r.status in ('requested', 'processing', 'completed');

    if v_already + v_quantity > v_order_item.quantity then
      raise exception 'refund_quantity_exceeded' using errcode = '22023';
    end if;

    v_total := v_total + v_order_item.unit_price * v_quantity;
  end loop;

  v_discount := case
    when v_order.subtotal_amount > 0 then
      least(
        v_order.discount_amount,
        round(v_order.discount_amount * v_total / v_order.subtotal_amount::numeric)::integer
      )
    else 0
  end;

  v_amount := greatest(v_total - v_discount, 0);

  if v_amount <= 0 then
    raise exception 'refund_amount_invalid' using errcode = '22023';
  end if;

  insert into public.refunds (
    store_id, order_id, payment_id, amount, currency, reason, provider,
    requested_by, metadata
  )
  values (
    v_order.store_id, v_order.id, v_payment.id, v_amount, v_order.currency,
    nullif(btrim(coalesce(p_reason, '')), ''), 'saspay', auth.uid(),
    jsonb_build_object(
      'kind', 'partial',
      'subtotal', v_total,
      'discount_share', v_discount
    )
  )
  returning id into v_refund_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_order_item
    from public.order_items
    where id = (v_item->>'order_item_id')::uuid
      and order_id = v_order.id;

    v_quantity := (v_item->>'quantity')::integer;

    insert into public.refund_items (refund_id, order_item_id, quantity, amount)
    values (
      v_refund_id, v_order_item.id, v_quantity,
      v_order_item.unit_price * v_quantity
    );
  end loop;

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order.id, v_order.store_id, 'refund_requested',
    jsonb_build_object('amount', v_amount, 'partial', true)
  );

  return jsonb_build_object(
    'status', 'requested',
    'refundId', v_refund_id,
    'amount', v_amount
  );
end;
$$;

revoke execute on function public.request_partial_refund(uuid, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.request_partial_refund(uuid, jsonb, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Calcul de la réserve (5 % du CA des 30 derniers jours)
 * ------------------------------------------------------------------ */

create or replace function public.refresh_refund_reserves()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.store_financial_reserves (store_id, reserved_fcfa, updated_at)
  select
    s.id,
    round(
      0.05 * coalesce(
        sum(o.total_amount) filter (
          where o.created_at >= now() - interval '30 days'
            and o.payment_status = 'paid'
        ),
        0
      )
    )::integer,
    now()
  from public.stores s
  left join public.orders o on o.store_id = s.id
  group by s.id
  on conflict (store_id) do update
    set reserved_fcfa = excluded.reserved_fcfa,
        updated_at = excluded.updated_at;

  get diagnostics v_count = row_count;

  return jsonb_build_object('stores', v_count);
end;
$$;

revoke execute on function public.refresh_refund_reserves()
  from public, anon, authenticated;
grant execute on function public.refresh_refund_reserves()
  to service_role;

/* ------------------------------------------------------------------ *
 *  Retraits : déduire la réserve de remboursement
 * ------------------------------------------------------------------ */

create or replace function public.enforce_payout_kyc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_available bigint;
  v_reserve   integer;
begin
  if new.owner_type = 'store' then
    if not exists (
      select 1 from public.kyc_cases c
      where c.store_id = new.store_id and c.status = 'approved'
    ) then
      raise exception 'kyc_required' using errcode = '22023';
    end if;
  elsif new.owner_type = 'courier' then
    if not exists (
      select 1
      from public.couriers c
      join public.store_members sm on sm.user_id = c.user_id
      where sm.store_id = new.store_id and sm.role = 'owner'
        and c.status = 'approved'
    ) then
      raise exception 'kyc_required' using errcode = '22023';
    end if;
  end if;

  select coalesce(sum(
    case e.direction when 'debit' then e.amount else -e.amount end
  ), 0)
  into v_available
  from public.ledger_accounts a
  left join public.ledger_entries e on e.account_id = a.id
  where a.store_id = new.store_id
    and a.code = 'available'
    and a.currency = new.currency;

  select coalesce(r.reserved_fcfa, 0)
  into v_reserve
  from public.store_financial_reserves r
  where r.store_id = new.store_id;

  if new.amount > greatest(coalesce(v_available, 0) - coalesce(v_reserve, 0), 0) then
    raise exception 'refund_reserve_locked' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_payout_kyc()
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Confirmation d'un remboursement (partiel ou total)
 * ------------------------------------------------------------------ */

create or replace function public.complete_saspay_refund(
  p_refund_id uuid,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_refund      public.refunds%rowtype;
  v_order       public.orders%rowtype;
  v_commission  integer := 0;
  v_reversal    integer := 0;
  v_entries     jsonb;
  v_reason      text;
  v_items       integer := 0;
  v_subtotal    integer := 0;
  v_discount    integer := 0;
  v_amount      integer := 0;
  v_item        record;
  v_component   record;
  v_total_refunded integer := 0;
  v_full        boolean := false;
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into v_refund from public.refunds where id = p_refund_id for update;
  if v_refund.id is null then
    raise exception 'refund_unknown' using errcode = '22023';
  end if;

  if v_refund.status = 'completed' then
    return jsonb_build_object('status', 'refunded', 'already', true);
  end if;

  if v_refund.status not in ('requested', 'processing') then
    raise exception 'refund_not_pending' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = v_refund.order_id for update;
  if v_order.id is null or v_order.payment_status <> 'paid' then
    raise exception 'refund_not_allowed' using errcode = '22023';
  end if;

  select count(*) into v_items
  from public.refund_items ri where ri.refund_id = v_refund.id;

  v_full := v_items = 0;
  v_reason := nullif(btrim(coalesce(v_refund.reason, '')), '');

  perform public.post_online_sale(v_order.id);
  perform public.post_online_commission(v_order.id);

  select coalesce((t.metadata->>'commission_amount')::integer, 0)
  into v_commission
  from public.ledger_transactions t
  where t.store_id = v_order.store_id
    and t.idempotency_key = 'online-commission:' || v_order.id::text;

  if v_full then
    v_amount := v_order.total_amount;
    v_subtotal := v_order.subtotal_amount;
    v_discount := v_order.discount_amount;

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
  else
    v_amount := v_refund.amount;

    select coalesce(sum(ri.amount), 0) into v_subtotal
    from public.refund_items ri where ri.refund_id = v_refund.id;

    v_discount := least(
      v_order.discount_amount,
      case when v_order.subtotal_amount > 0
        then round(v_order.discount_amount * v_subtotal / v_order.subtotal_amount::numeric)::integer
        else 0
      end
    );

    select jsonb_agg(entry)
    into v_entries
    from jsonb_array_elements(
      jsonb_build_array(
        jsonb_build_object('account', 'sales', 'direction', 'debit',
          'amount', v_subtotal, 'currency', v_order.currency),
        jsonb_build_object('account', 'discounts', 'direction', 'credit',
          'amount', v_discount, 'currency', v_order.currency),
        jsonb_build_object('account', 'available', 'direction', 'credit',
          'amount', v_amount, 'currency', v_order.currency)
      )
    ) as entry
    where (entry->>'amount')::bigint > 0;
  end if;

  if v_entries is not null then
    perform public.post_ledger_transaction(
      v_order.store_id, 'refund', 'order', v_order.id,
      'saspay-refund:' || v_refund.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'refund',
        'provider', 'saspay',
        'partial', not v_full,
        'amount', v_amount,
        'subtotal', v_subtotal,
        'discount_share', v_discount,
        'provider_reference', btrim(coalesce(p_reference, '')),
        'reason', v_reason
      ),
      v_entries
    );
  end if;

  v_reversal := case
    when v_commission > 0 and v_order.subtotal_amount - v_order.discount_amount > 0
      then least(
        v_commission,
        round(
          v_commission::numeric * v_amount
          / greatest(v_order.subtotal_amount - v_order.discount_amount, 1)
        )::integer
      )
    else 0
  end;

  if v_full then
    v_reversal := v_commission;
  end if;

  if v_reversal > 0 then
    perform public.post_ledger_transaction(
      v_order.store_id, 'commission', 'order', v_order.id,
      'saspay-commission-refund:' || v_refund.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'reversal',
        'commission_amount', v_reversal,
        'partial', not v_full,
        'reason', v_reason
      ),
      jsonb_build_array(
        jsonb_build_object('account', 'commission_due', 'direction', 'debit',
          'amount', v_reversal, 'currency', v_order.currency),
        jsonb_build_object('account', 'fees', 'direction', 'credit',
          'amount', v_reversal, 'currency', v_order.currency)
      )
    );
  end if;

  -- Stock rendu pour les lignes physiques.
  if not v_full then
    for v_item in
      select ri.quantity, oi.product_id, oi.variant_id, oi.bundle_id
      from public.refund_items ri
      join public.order_items oi on oi.id = ri.order_item_id
      where ri.refund_id = v_refund.id
    loop
      if v_item.bundle_id is not null then
        for v_component in
          select product_id, variant_id
          from public.bundle_items
          where bundle_id = v_item.bundle_id
        loop
          if v_component.variant_id is not null then
            update public.product_variants
            set stock_quantity = stock_quantity + v_item.quantity
            where id = v_component.variant_id;
          elsif v_component.product_id is not null then
            update public.products
            set stock_quantity = stock_quantity + v_item.quantity
            where id = v_component.product_id and product_type = 'physical';
          end if;
        end loop;
      elsif v_item.variant_id is not null then
        update public.product_variants
        set stock_quantity = stock_quantity + v_item.quantity
        where id = v_item.variant_id;
      elsif v_item.product_id is not null then
        update public.products
        set stock_quantity = stock_quantity + v_item.quantity
        where id = v_item.product_id and product_type = 'physical';
      end if;
    end loop;
  end if;

  select coalesce(sum(r.amount), 0) + v_amount
  into v_total_refunded
  from public.refunds r
  where r.order_id = v_order.id
    and r.status = 'completed'
    and r.id <> v_refund.id;

  update public.refunds
  set status = 'completed',
      provider_reference = nullif(btrim(coalesce(p_reference, '')), ''),
      completed_at = now()
  where id = v_refund.id;

  if v_full or v_total_refunded >= v_order.total_amount then
    update public.orders set payment_status = 'refunded' where id = v_order.id;
    update public.payments
    set status = 'refunded'
    where order_id = v_order.id and provider = 'saspay' and status = 'captured';
  end if;

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order.id, v_order.store_id, 'refunded',
    jsonb_build_object(
      'amount', v_amount,
      'partial', not v_full,
      'reason', v_reason,
      'provider', 'saspay',
      'provider_reference', btrim(coalesce(p_reference, ''))
    )
  );

  return jsonb_build_object('status', 'refunded', 'partial', not v_full);
end;
$$;

revoke execute on function public.complete_saspay_refund(uuid, text)
  from public, anon, authenticated;
grant execute on function public.complete_saspay_refund(uuid, text)
  to authenticated;
