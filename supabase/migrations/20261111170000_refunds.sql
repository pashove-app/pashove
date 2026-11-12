-- PASHOVE — Remboursements en ligne (SasPay)
--
-- SasPay n'expose pas d'endpoint de remboursement dans son API 1.0.0. Le
-- remboursement est donc exécuté par l'équipe dans le tableau SasPay/PayDunya,
-- puis confirmé ici avec la référence du prestataire. La confirmation écrit
-- les écritures compensatoires du ledger et ferme la commande.
--
-- Le marchand ne fait que demander le remboursement ; seul un administrateur
-- plateforme peut le confirmer après l'avoir exécuté chez SasPay.

create table public.refunds (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores (id) on delete cascade,
  order_id           uuid not null references public.orders (id) on delete cascade,
  payment_id         uuid references public.payments (id) on delete set null,
  amount             integer not null check (amount > 0),
  currency           text not null,
  reason             text,
  provider           text not null default 'saspay',
  provider_reference text,
  status             text not null default 'requested'
    check (status in ('requested', 'processing', 'completed', 'failed', 'rejected')),
  requested_by       uuid references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  completed_at       timestamptz,
  metadata           jsonb not null default '{}'::jsonb
);

create index refunds_store_idx on public.refunds (store_id, created_at desc);
create index refunds_status_idx on public.refunds (status, created_at desc);
create unique index refunds_open_order_idx
  on public.refunds (order_id)
  where status in ('requested', 'processing');

alter table public.refunds enable row level security;
revoke all on public.refunds from public, anon, authenticated;
grant select on public.refunds to authenticated;

create policy refunds_select on public.refunds
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

/**
 * Demande de remboursement.
 *
 * COD : remboursement immédiat via refund_cod_order.
 * En ligne : création d'une demande, traitée par l'administration.
 */
create or replace function public.request_refund(
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
  v_payment public.payments%rowtype;
  v_existing public.refunds%rowtype;
  v_id uuid;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

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

  if v_order.payment_status = 'refunded' then
    return jsonb_build_object('status', 'refunded', 'already', true);
  end if;

  if v_order.payment_status <> 'paid' then
    raise exception 'refund_not_allowed' using errcode = '22023';
  end if;

  if v_order.payment_method = 'cod' then
    perform public.refund_cod_order(v_order.id, p_reason);
    return jsonb_build_object('status', 'refunded');
  end if;

  select * into v_payment
  from public.payments
  where order_id = v_order.id
    and provider = 'saspay'
    and status = 'captured'
  order by created_at desc
  limit 1
  for update;

  if v_payment.id is null then
    raise exception 'refund_not_supported' using errcode = '22023';
  end if;

  select * into v_existing
  from public.refunds
  where order_id = v_order.id
    and status in ('requested', 'processing')
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    return jsonb_build_object(
      'status', 'requested',
      'already', true,
      'refundId', v_existing.id
    );
  end if;

  insert into public.refunds (
    store_id, order_id, payment_id, amount, currency, reason,
    provider, requested_by
  )
  values (
    v_order.store_id, v_order.id, v_payment.id, v_order.total_amount,
    v_order.currency, nullif(btrim(coalesce(p_reason, '')), ''),
    'saspay', auth.uid()
  )
  returning id into v_id;

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order.id, v_order.store_id, 'refund_requested',
    jsonb_build_object(
      'amount', v_order.total_amount,
      'reason', nullif(btrim(coalesce(p_reason, '')), '')
    )
  );

  return jsonb_build_object('status', 'requested', 'refundId', v_id);
end;
$$;

revoke execute on function public.request_refund(uuid, text)
  from public, anon, authenticated;
grant execute on function public.request_refund(uuid, text)
  to authenticated;

/**
 * Confirmation d'un remboursement SasPay exécuté hors API.
 *
 * Réservé aux administrateurs plateforme. Écrit les mêmes compensations que
 * refund_online_order, avec les comptes du ledger et une référence SasPay.
 */
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
  v_refund public.refunds%rowtype;
  v_order  public.orders%rowtype;
  v_commission integer := 0;
  v_entries jsonb;
  v_reason text;
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into v_refund
  from public.refunds
  where id = p_refund_id
  for update;

  if v_refund.id is null then
    raise exception 'refund_unknown' using errcode = '22023';
  end if;

  if v_refund.status = 'completed' then
    return jsonb_build_object('status', 'refunded', 'already', true);
  end if;

  if v_refund.status not in ('requested', 'processing') then
    raise exception 'refund_not_pending' using errcode = '22023';
  end if;

  select * into v_order
  from public.orders
  where id = v_refund.order_id
  for update;

  if v_order.id is null or v_order.payment_status <> 'paid' then
    raise exception 'refund_not_allowed' using errcode = '22023';
  end if;

  if v_refund.amount <> v_order.total_amount then
    raise exception 'partial_refund_unsupported' using errcode = '22023';
  end if;

  v_reason := nullif(btrim(coalesce(v_refund.reason, '')), '');

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
    'saspay-refund:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'refund',
      'provider', 'saspay',
      'provider_reference', btrim(coalesce(p_reference, '')),
      'amount', v_order.total_amount,
      'discount_amount', v_order.discount_amount,
      'reason', v_reason
    ),
    v_entries
  );

  if v_commission > 0 then
    perform public.post_ledger_transaction(
      v_order.store_id, 'commission', 'order', v_order.id,
      'saspay-commission-refund:' || v_order.id::text,
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

  update public.orders
  set payment_status = 'refunded'
  where id = v_order.id;

  update public.payments
  set status = 'refunded'
  where order_id = v_order.id
    and provider = 'saspay'
    and status = 'captured';

  update public.refunds
  set status = 'completed',
      provider_reference = nullif(btrim(coalesce(p_reference, '')), ''),
      completed_at = now()
  where id = v_refund.id;

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order.id, v_order.store_id, 'refunded',
    jsonb_build_object(
      'amount', v_order.total_amount,
      'reason', v_reason,
      'provider', 'saspay',
      'provider_reference', btrim(coalesce(p_reference, ''))
    )
  );

  return jsonb_build_object('status', 'refunded');
end;
$$;

revoke execute on function public.complete_saspay_refund(uuid, text)
  from public, anon, authenticated;
grant execute on function public.complete_saspay_refund(uuid, text)
  to authenticated;
