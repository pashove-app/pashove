-- PASHOVE — Séquestre des fonds (holding period) et résolution des litiges
--
-- 1. À l'encaissement, la part marchand est placée en `pending`, pas en
--    `available`. Elle devient retirable après 24 h :
--      - produits physiques : 24 h après la livraison ;
--      - numériques et services : 24 h après le paiement ;
--      - Pashove Delivery : 24 h après l'OTP (le livreur est payé tout de suite).
-- 2. Le solde retirable tient compte de la commission due : on ne peut plus
--    retirer l'argent de Pashove.
-- 3. L'admin peut libérer, rembourser ou annuler une course en litige.

alter table public.orders
  add column if not exists payout_available_at timestamptz,
  add column if not exists payout_hold_amount integer not null default 0
    check (payout_hold_amount >= 0),
  add column if not exists payout_released_at timestamptz;

/* ------------------------------------------------------------------ *
 *  Mise en attente de la part marchand
 * ------------------------------------------------------------------ */

create or replace function public.hold_merchant_funds(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_physical boolean;
begin
  select * into v_order from public.orders where id = p_order_id;

  if v_order.id is null
     or v_order.payment_status <> 'paid'
     or v_order.payment_method = 'cod'
     or v_order.total_amount <= 0 then
    return;
  end if;

  -- Une course Pashove Delivery a déjà son propre séquestre.
  if exists (select 1 from public.deliveries d where d.order_id = v_order.id) then
    return;
  end if;

  if v_order.payout_hold_amount > 0 then
    return;
  end if;

  select exists (
    select 1 from public.order_items oi
    where oi.order_id = v_order.id
      and oi.product_type in ('physical', 'bundle')
  ) into v_physical;

  perform public.post_ledger_transaction(
    v_order.store_id, 'adjustment', 'order', v_order.id,
    'payout-hold:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'payout_hold',
      'amount', v_order.total_amount,
      'currency', v_order.currency,
      'physical', v_physical
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'available', 'direction', 'credit',
        'amount', v_order.total_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'pending', 'direction', 'debit',
        'amount', v_order.total_amount, 'currency', v_order.currency)
    )
  );

  update public.orders
  set payout_hold_amount = v_order.total_amount,
      payout_available_at = case
        when v_physical then null
        else now() + interval '24 hours'
      end,
      payout_released_at = null
  where id = v_order.id;
end;
$$;

revoke execute on function public.hold_merchant_funds(uuid)
  from public, anon, authenticated;

/* Le trigger de L2c est recréé : sans course Pashove, on met en attente. */
create or replace function public.create_delivery_for_paid_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
  v_delivery_id uuid;
begin
  if NEW.payment_status <> 'paid' then
    return NEW;
  end if;

  if TG_OP = 'UPDATE' and OLD.payment_status = 'paid' then
    return NEW;
  end if;

  if NEW.payment_method = 'cod' then
    return NEW;
  end if;

  select * into v_store from public.stores where id = NEW.store_id;

  if v_store.id is not null
     and v_store.delivery_mode = 'pashove'
     and NEW.shipping_country = any (v_store.delivery_countries)
     and exists (
       select 1 from public.order_items oi
       where oi.order_id = NEW.id
         and oi.product_type in ('physical', 'bundle')
     ) then
    insert into public.deliveries (
      order_id, store_id, status, fee_amount, currency
    )
    values (NEW.id, NEW.store_id, 'searching', NEW.shipping_amount, NEW.currency)
    on conflict (order_id) do nothing;

    select id into v_delivery_id from public.deliveries where order_id = NEW.id;

    if v_delivery_id is not null then
      perform public.hold_delivery_fee(NEW.id);
      perform public.dispatch_delivery(v_delivery_id);
    end if;

    return NEW;
  end if;

  perform public.hold_merchant_funds(NEW.id);
  return NEW;
end;
$$;

revoke execute on function public.create_delivery_for_paid_order()
  from public, anon, authenticated;

/* La livraison d'une commande auto-livrée fixe l'échéance de 24 h. */
create or replace function public.set_order_payout_maturity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if NEW.status = 'delivered'
     and NEW.payment_status = 'paid'
     and NEW.payout_available_at is null
     and NEW.payout_hold_amount > 0 then
    update public.orders
    set payout_available_at = now() + interval '24 hours'
    where id = NEW.id;
  end if;

  return NEW;
end;
$$;

revoke execute on function public.set_order_payout_maturity()
  from public, anon, authenticated;

drop trigger if exists orders_payout_maturity on public.orders;
create trigger orders_payout_maturity
  after update of status on public.orders
  for each row execute function public.set_order_payout_maturity();

/* ------------------------------------------------------------------ *
 *  Libération des fonds arrivés à échéance
 * ------------------------------------------------------------------ */

create or replace function public.release_matured_payouts()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_count integer := 0;
begin
  for v_row in
    select id, store_id, payout_hold_amount
    from public.orders
    where payment_status = 'paid'
      and payout_released_at is null
      and payout_available_at is not null
      and payout_available_at <= now()
      and payout_hold_amount > 0
  loop
    perform public.post_ledger_transaction(
      v_row.store_id, 'adjustment', 'order', v_row.id,
      'payout-release:' || v_row.id::text,
      jsonb_build_object('role', 'payout_release'),
      jsonb_build_array(
        jsonb_build_object('account', 'pending', 'direction', 'credit',
          'amount', v_row.payout_hold_amount, 'currency',
          (select currency from public.orders where id = v_row.id)),
        jsonb_build_object('account', 'available', 'direction', 'debit',
          'amount', v_row.payout_hold_amount, 'currency',
          (select currency from public.orders where id = v_row.id))
      )
    );

    update public.orders
    set payout_released_at = now(),
        payout_hold_amount = 0
    where id = v_row.id;

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('released', v_count);
end;
$$;

revoke execute on function public.release_matured_payouts()
  from public, anon, authenticated;
grant execute on function public.release_matured_payouts()
  to service_role;

/* ------------------------------------------------------------------ *
 *  Solde retirable net de la commission due
 * ------------------------------------------------------------------ */

create or replace function public.store_withdrawable(p_store_id uuid)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_currency text;
  v_net bigint;
begin
  if not public.is_store_member(p_store_id) then
    return 0;
  end if;

  select currency into v_currency from public.stores where id = p_store_id;
  if v_currency is null then
    return 0;
  end if;

  select coalesce(sum(
    case e.direction when 'debit' then e.amount else -e.amount end
  ), 0)
  into v_net
  from public.ledger_accounts a
  left join public.ledger_entries e on e.account_id = a.id
  where a.store_id = p_store_id
    and a.currency = v_currency
    and a.code in ('available', 'commission_due');

  return greatest(v_net, 0);
end;
$$;

revoke execute on function public.store_withdrawable(uuid)
  from public, anon, authenticated;
grant execute on function public.store_withdrawable(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Litiges : remboursement, libération, annulation
 * ------------------------------------------------------------------ */

create or replace function public.refund_disputed_delivery(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_order public.orders%rowtype;
  v_courier public.couriers%rowtype;
  v_courier_store uuid;
  v_product_share integer;
  v_courier_share integer;
  v_platform_share integer;
  v_commission integer := 0;
begin
  select * into v_delivery from public.deliveries where id = p_delivery_id for update;
  if v_delivery.id is null then
    raise exception 'delivery_not_found' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = v_delivery.order_id;
  select * into v_courier from public.couriers where id = v_delivery.courier_id;

  v_product_share := greatest(v_order.subtotal_amount - v_order.discount_amount, 0);
  v_courier_share := round(v_delivery.fee_amount * 0.9)::integer;
  v_platform_share := v_delivery.fee_amount - v_courier_share;

  -- Le séquestre est libéré : produit remboursé au client, livraison payée.
  perform public.post_ledger_transaction(
    v_delivery.store_id, 'refund', 'order', v_order.id,
    'dispute-refund:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'dispute_refund',
      'product_amount', v_product_share,
      'fee_amount', v_delivery.fee_amount,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'reserved', 'direction', 'credit',
        'amount', v_order.total_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'sales', 'direction', 'debit',
        'amount', v_product_share, 'currency', v_order.currency),
      jsonb_build_object('account', 'fees', 'direction', 'debit',
        'amount', v_delivery.fee_amount, 'currency', v_order.currency)
    )
  );

  if v_courier.id is not null and v_courier_share > 0 then
    select s.id into v_courier_store
    from public.store_members sm
    join public.stores s on s.id = sm.store_id
    where sm.user_id = v_courier.user_id and sm.role = 'owner'
    order by s.created_at
    limit 1;

    if v_courier_store is not null then
      perform public.post_ledger_transaction(
        v_courier_store, 'adjustment', 'order', v_order.id,
        'dispute-refund-income:' || v_order.id::text,
        jsonb_build_object('role', 'delivery_income', 'order_number', v_order.number),
        jsonb_build_array(
          jsonb_build_object('account', 'available', 'direction', 'debit',
            'amount', v_courier_share, 'currency', v_order.currency),
          jsonb_build_object('account', 'delivery_income', 'direction', 'credit',
            'amount', v_courier_share, 'currency', v_order.currency)
        )
      );
    end if;
  end if;

  if v_platform_share > 0 then
    perform public.post_ledger_transaction(
      v_delivery.store_id, 'adjustment', 'order', v_order.id,
      'dispute-refund-platform:' || v_order.id::text,
      jsonb_build_object('role', 'delivery_platform', 'order_number', v_order.number),
      jsonb_build_array(
        jsonb_build_object('account', 'fees', 'direction', 'debit',
          'amount', v_platform_share, 'currency', v_order.currency),
        jsonb_build_object('account', 'delivery_commission_income', 'direction', 'credit',
          'amount', v_platform_share, 'currency', v_order.currency)
      )
    );
  end if;

  select coalesce((t.metadata->>'commission_amount')::integer, 0)
  into v_commission
  from public.ledger_transactions t
  where t.store_id = v_delivery.store_id
    and t.idempotency_key = 'online-commission:' || v_order.id::text;

  if v_commission > 0 then
    perform public.post_ledger_transaction(
      v_delivery.store_id, 'commission', 'order', v_order.id,
      'dispute-refund-commission:' || v_order.id::text,
      jsonb_build_object(
        'role', 'reversal',
        'order_number', v_order.number,
        'commission_amount', v_commission
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
  set payment_status = 'refunded',
      status = 'cancelled',
      payout_available_at = null,
      payout_hold_amount = 0,
      payout_released_at = now()
  where id = v_order.id;

  update public.deliveries
  set status = 'cancelled',
      failure_reason = 'refunded',
      updated_at = now()
  where id = v_delivery.id;

  return jsonb_build_object('status', 'refunded', 'refund_amount', v_product_share);
end;
$$;

revoke execute on function public.refund_disputed_delivery(uuid)
  from public, anon, authenticated;

create or replace function public.resolve_delivery_dispute(
  p_delivery_id uuid,
  p_action      text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text := lower(btrim(coalesce(p_action, '')));
  v_delivery public.deliveries%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_delivery from public.deliveries where id = p_delivery_id for update;

  if v_delivery.id is null or v_delivery.status <> 'disputed' then
    raise exception 'delivery_not_disputed' using errcode = '22023';
  end if;

  if v_action = 'release' then
    perform public.settle_delivery(p_delivery_id);
    update public.deliveries
    set status = 'delivered', delivered_at = now(), updated_at = now()
    where id = p_delivery_id;
    update public.orders set status = 'delivered' where id = v_delivery.order_id;
    return jsonb_build_object('status', 'released');
  end if;

  if v_action = 'refund' then
    return public.refund_disputed_delivery(p_delivery_id);
  end if;

  if v_action = 'cancel' then
    update public.deliveries
    set status = 'cancelled', updated_at = now()
    where id = p_delivery_id;
    return jsonb_build_object('status', 'cancelled');
  end if;

  raise exception 'action_invalid' using errcode = '22023';
end;
$$;

revoke execute on function public.resolve_delivery_dispute(uuid, text)
  from public, anon, authenticated;
grant execute on function public.resolve_delivery_dispute(uuid, text)
  to authenticated;


/* ------------------------------------------------------------------ *
 *  Correctifs des fonctions existantes
 * ------------------------------------------------------------------ */

create or replace function public.settle_delivery(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_order public.orders%rowtype;
  v_courier public.couriers%rowtype;
  v_courier_store uuid;
  v_product_share integer;
  v_courier_share integer;
  v_platform_share integer;
begin
  select * into v_delivery from public.deliveries where id = p_delivery_id;
  if v_delivery.id is null then
    return;
  end if;

  select * into v_order from public.orders where id = v_delivery.order_id;
  select * into v_courier from public.couriers where id = v_delivery.courier_id;

  if v_courier.id is null then
    raise exception 'courier_missing' using errcode = '22023';
  end if;

  select s.id into v_courier_store
  from public.store_members sm
  join public.stores s on s.id = sm.store_id
  where sm.user_id = v_courier.user_id
    and sm.role = 'owner'
  order by s.created_at
  limit 1;

  if v_courier_store is null then
    raise exception 'courier_store_missing' using errcode = '22023';
  end if;

  v_product_share := greatest(
    v_order.subtotal_amount - v_order.discount_amount,
    0
  );
  v_courier_share := round(v_delivery.fee_amount * 0.9)::integer;
  v_platform_share := v_delivery.fee_amount - v_courier_share;

  -- Libère la part produit au marchand et sort les frais de livraison.
  perform public.post_ledger_transaction(
    v_delivery.store_id, 'adjustment', 'order', v_order.id,
    'delivery-settle:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'delivery_settle',
      'product_share', v_product_share,
      'fee_amount', v_delivery.fee_amount,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'reserved', 'direction', 'credit',
        'amount', v_order.total_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'pending', 'direction', 'debit',
        'amount', v_product_share, 'currency', v_order.currency),
      jsonb_build_object('account', 'fees', 'direction', 'debit',
        'amount', v_delivery.fee_amount, 'currency', v_order.currency)
    )
  );

  update public.orders
  set status = 'delivered',
      payout_hold_amount = v_product_share,
      payout_available_at = now() + interval '24 hours',
      payout_released_at = null
  where id = v_order.id;

  -- Revenu du livreur, sur le ledger de sa boutique.
  if v_courier_share > 0 then
    perform public.post_ledger_transaction(
      v_courier_store, 'adjustment', 'order', v_order.id,
      'delivery-income:' || v_order.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'delivery_income',
        'source_store_id', v_delivery.store_id,
        'fee_amount', v_delivery.fee_amount,
        'currency', v_order.currency
      ),
      jsonb_build_array(
        jsonb_build_object('account', 'available', 'direction', 'debit',
          'amount', v_courier_share, 'currency', v_order.currency),
        jsonb_build_object('account', 'delivery_income', 'direction', 'credit',
          'amount', v_courier_share, 'currency', v_order.currency)
      )
    );
  end if;

  -- 10 % de la course pour Pashove.
  if v_platform_share > 0 then
    perform public.post_ledger_transaction(
      v_delivery.store_id, 'adjustment', 'order', v_order.id,
      'delivery-platform:' || v_order.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'delivery_platform',
        'fee_amount', v_delivery.fee_amount,
        'currency', v_order.currency
      ),
      jsonb_build_array(
        jsonb_build_object('account', 'fees', 'direction', 'debit',
          'amount', v_platform_share, 'currency', v_order.currency),
        jsonb_build_object('account', 'delivery_commission_income', 'direction', 'credit',
          'amount', v_platform_share, 'currency', v_order.currency)
      )
    );
  end if;
end;
$$;

create or replace function public.request_payout(
  p_store_id        uuid,
  p_method_id       uuid,
  p_amount          integer,
  p_pin             text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store     public.stores%rowtype;
  v_method    public.payout_methods%rowtype;
  v_payout    public.payouts%rowtype;
  v_available bigint;
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select s.* into v_store
  from public.stores s
  where s.id = p_store_id;

  if v_store.id is null then
    raise exception 'invalid_store' using errcode = '22023';
  end if;

  select m.* into v_method
  from public.payout_methods m
  where m.id = p_method_id
    and m.store_id = p_store_id
    and m.archived_at is null;

  if v_method.id is null then
    raise exception 'method_not_found' using errcode = '22023';
  end if;

  if p_amount is null or p_amount < 1000 then
    raise exception 'payout_amount_too_low' using errcode = '22023';
  end if;

  if p_idempotency_key is null
     or char_length(p_idempotency_key) < 8
     or char_length(p_idempotency_key) > 120 then
    raise exception 'invalid_idempotency_key' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.payouts p
    where p.store_id = p_store_id
      and p.idempotency_key = p_idempotency_key
  ) then
    select p.* into v_payout
    from public.payouts p
    where p.store_id = p_store_id
      and p.idempotency_key = p_idempotency_key;

    return jsonb_build_object(
      'status', 'already',
      'payout_id', v_payout.id,
      'payout_status', v_payout.status
    );
  end if;

  -- Une seule demande à la fois par boutique : impossible de dépasser le
  -- solde avec deux onglets ou deux clics.
  perform pg_advisory_xact_lock(hashtext(p_store_id::text));

  select coalesce(sum(
    case e.direction when 'debit' then e.amount else -e.amount end
  ), 0)
  into v_available
  from public.ledger_accounts a
  left join public.ledger_entries e on e.account_id = a.id
  where a.store_id = p_store_id
    and a.code in ('available', 'commission_due')
    and a.currency = v_store.currency;

  if v_available < p_amount then
    raise exception 'insufficient_funds' using errcode = '22023';
  end if;

  if not public.verify_payout_pin(p_store_id, p_pin) then
    return jsonb_build_object('status', 'pin_invalid');
  end if;

  insert into public.payouts (
    store_id, method_id, amount, currency, status,
    provider, account_name, account_last4,
    idempotency_key, requested_by
  )
  values (
    p_store_id, p_method_id, p_amount, v_store.currency, 'requested',
    v_method.provider, v_method.account_name, v_method.account_last4,
    p_idempotency_key, auth.uid()
  )
  returning * into v_payout;

  perform public.post_ledger_transaction(
    p_store_id,
    'payout_request',
    'payout',
    v_payout.id,
    'payout-request:' || v_payout.id::text,
    jsonb_build_object(
      'payout_id', v_payout.id,
      'provider', v_method.provider,
      'account_last4', v_method.account_last4
    ),
    jsonb_build_array(
      jsonb_build_object(
        'account', 'reserved', 'direction', 'debit',
        'amount', p_amount, 'currency', v_store.currency
      ),
      jsonb_build_object(
        'account', 'available', 'direction', 'credit',
        'amount', p_amount, 'currency', v_store.currency
      )
    )
  );

  insert into public.payout_events (payout_id, store_id, status, actor_id)
  values (v_payout.id, p_store_id, 'requested', auth.uid());

  return jsonb_build_object(
    'status', 'requested',
    'payout_id', v_payout.id,
    'amount', p_amount,
    'currency', v_store.currency
  );
end;
$$;

create or replace function public.admin_deliveries()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'status', d.status,
          'feeAmount', d.fee_amount,
          'currency', d.currency,
          'failureReason', d.failure_reason,
          'createdAt', d.created_at,
          'acceptedAt', d.accepted_at,
          'deliveredAt', d.delivered_at,
          'orderNumber', o.number,
          'productAmount', greatest(o.subtotal_amount - o.discount_amount, 0),
          'shippingAmount', o.shipping_amount,
          'storeName', s.name,
          'courierName', c.full_name
        )
        order by d.created_at desc
      )
      from public.deliveries d
      join public.orders o on o.id = d.order_id
      join public.stores s on s.id = d.store_id
      left join public.couriers c on c.id = d.courier_id
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.request_payout(uuid, uuid, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.request_payout(uuid, uuid, integer, text, text)
  to authenticated;

revoke execute on function public.admin_deliveries()
  from public, anon, authenticated;
grant execute on function public.admin_deliveries()
  to authenticated;
