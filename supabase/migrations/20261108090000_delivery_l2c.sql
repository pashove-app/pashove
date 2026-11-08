-- PASHOVE — L2c : OTP, escrow et litiges
--
-- À la création de la course, les frais de livraison sont déplacés de
-- `available` vers `reserved` : le marchand ne peut pas les retirer avant la
-- livraison. Le code à 4 chiffres est généré à l'acceptation de la course,
-- haché en SHA-256, envoyé au client par e-mail, et validé par le livreur.
--
-- À la validation :
--   marchand : reserved -> fees (la livraison sort de son solde) ;
--   livreur  : available + 90 %, delivery_income ;
--   Pashove  : fees / delivery_commission_income, 10 % de la course.
-- Tout est idempotent par commande.

alter table public.deliveries
  drop constraint if exists deliveries_status_check;

alter table public.deliveries
  add constraint deliveries_status_check
  check (status in (
    'pending', 'searching', 'assigned', 'accepted', 'declined',
    'timeout', 'delivered', 'failed', 'disputed', 'cancelled'
  ));

alter table public.deliveries
  add column if not exists otp_attempts integer not null default 0
    check (otp_attempts >= 0);

alter table public.ledger_accounts drop constraint if exists ledger_accounts_code_check;
alter table public.ledger_accounts
  add constraint ledger_accounts_code_check
  check (code in (
    'pending', 'available', 'reserved', 'cod_cash',
    'commission_due', 'sales', 'shipping_income', 'fees', 'payouts',
    'saspay_fees_absorbed', 'affiliate_commission', 'affiliate_income',
    'delivery_income', 'delivery_commission_income'
  ));

/* ------------------------------------------------------------------ *
 *  Mise sous séquestre à la création de la course
 * ------------------------------------------------------------------ */

create or replace function public.hold_delivery_fee(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;

  if v_order.id is null or v_order.shipping_amount <= 0 then
    return;
  end if;

  perform public.post_ledger_transaction(
    v_order.store_id, 'adjustment', 'order', v_order.id,
    'delivery-hold:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'delivery_hold',
      'fee_amount', v_order.shipping_amount,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'available', 'direction', 'credit',
        'amount', v_order.shipping_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'reserved', 'direction', 'debit',
        'amount', v_order.shipping_amount, 'currency', v_order.currency)
    )
  );
end;
$$;

revoke execute on function public.hold_delivery_fee(uuid)
  from public, anon, authenticated;

/* La course met désormais les frais sous séquestre dès sa création. */
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

  if v_store.id is null
     or v_store.delivery_mode <> 'pashove'
     or not (NEW.shipping_country = any (v_store.delivery_countries)) then
    return NEW;
  end if;

  if not exists (
    select 1 from public.order_items oi
    where oi.order_id = NEW.id
      and oi.product_type in ('physical', 'bundle')
  ) then
    return NEW;
  end if;

  insert into public.deliveries (
    order_id, store_id, status, fee_amount, currency
  )
  values (
    NEW.id, NEW.store_id, 'searching', NEW.shipping_amount, NEW.currency
  )
  on conflict (order_id) do nothing;

  select id into v_delivery_id
  from public.deliveries
  where order_id = NEW.id;

  if v_delivery_id is not null then
    perform public.hold_delivery_fee(NEW.id);
    perform public.dispatch_delivery(v_delivery_id);
  end if;

  return NEW;
end;
$$;

/* ------------------------------------------------------------------ *
 *  OTP : génération et validation
 * ------------------------------------------------------------------ */

create or replace function public.issue_delivery_otp(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_order public.orders%rowtype;
  v_store public.stores%rowtype;
  v_code text;
begin
  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_delivery.id is null or v_delivery.status <> 'accepted' then
    return null;
  end if;

  -- Un code encore valide n'est jamais réémis.
  if v_delivery.otp_hash is not null
     and v_delivery.otp_expires_at is not null
     and v_delivery.otp_expires_at > now() then
    return null;
  end if;

  v_code := lpad((floor(random() * 10000))::integer::text, 4, '0');

  update public.deliveries
  set otp_hash = encode(sha256(convert_to(v_code, 'UTF8')), 'hex'),
      otp_expires_at = now() + interval '24 hours',
      otp_attempts = 0
  where id = p_delivery_id;

  select * into v_order from public.orders where id = v_delivery.order_id;
  select * into v_store from public.stores where id = v_delivery.store_id;

  return jsonb_build_object(
    'code', v_code,
    'email', v_order.customer_email,
    'customerName', v_order.customer_name,
    'orderNumber', v_order.number,
    'storeName', v_store.name,
    'currency', v_delivery.currency,
    'feeAmount', v_delivery.fee_amount
  );
end;
$$;

revoke execute on function public.issue_delivery_otp(uuid)
  from public, anon, authenticated;
grant execute on function public.issue_delivery_otp(uuid)
  to service_role;

/* ------------------------------------------------------------------ *
 *  Split à la livraison validée
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
  v_courier_share integer;
  v_platform_share integer;
begin
  select * into v_delivery from public.deliveries where id = p_delivery_id;
  if v_delivery.id is null or v_delivery.fee_amount <= 0 then
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

  v_courier_share := round(v_delivery.fee_amount * 0.9)::integer;
  v_platform_share := v_delivery.fee_amount - v_courier_share;

  -- Le séquestre sort du solde marchand.
  perform public.post_ledger_transaction(
    v_delivery.store_id, 'adjustment', 'order', v_order.id,
    'delivery-settle:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'delivery_settle',
      'fee_amount', v_delivery.fee_amount,
      'currency', v_delivery.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'reserved', 'direction', 'credit',
        'amount', v_delivery.fee_amount, 'currency', v_delivery.currency),
      jsonb_build_object('account', 'fees', 'direction', 'debit',
        'amount', v_delivery.fee_amount, 'currency', v_delivery.currency)
    )
  );

  -- Revenu du livreur, sur le ledger de sa boutique.
  perform public.post_ledger_transaction(
    v_courier_store, 'adjustment', 'order', v_order.id,
    'delivery-income:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'delivery_income',
      'source_store_id', v_delivery.store_id,
      'fee_amount', v_delivery.fee_amount,
      'currency', v_delivery.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'available', 'direction', 'debit',
        'amount', v_courier_share, 'currency', v_delivery.currency),
      jsonb_build_object('account', 'delivery_income', 'direction', 'credit',
        'amount', v_courier_share, 'currency', v_delivery.currency)
    )
  );

  -- 10 % de la course pour Pashove.
  if v_platform_share > 0 then
    perform public.post_ledger_transaction(
      v_delivery.store_id, 'adjustment', 'order', v_order.id,
      'delivery-platform:' || v_order.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'delivery_platform',
        'fee_amount', v_delivery.fee_amount,
        'currency', v_delivery.currency
      ),
      jsonb_build_array(
        jsonb_build_object('account', 'fees', 'direction', 'debit',
          'amount', v_platform_share, 'currency', v_delivery.currency),
        jsonb_build_object('account', 'delivery_commission_income', 'direction', 'credit',
          'amount', v_platform_share, 'currency', v_delivery.currency)
      )
    );
  end if;
end;
$$;

revoke execute on function public.settle_delivery(uuid)
  from public, anon, authenticated;

create or replace function public.deliver_delivery(
  p_delivery_id uuid,
  p_otp         text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_courier public.couriers%rowtype;
  v_delivery public.deliveries%rowtype;
  v_hash text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_courier from public.couriers where user_id = v_user;

  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_courier.id is null
     or v_delivery.id is null
     or v_delivery.courier_id <> v_courier.id
     or v_delivery.status <> 'accepted' then
    raise exception 'not_assigned' using errcode = '22023';
  end if;

  if v_delivery.otp_hash is null then
    raise exception 'otp_not_issued' using errcode = '22023';
  end if;

  if v_delivery.otp_expires_at is null
     or v_delivery.otp_expires_at <= now() then
    raise exception 'otp_expired' using errcode = '22023';
  end if;

  if v_delivery.otp_attempts >= 5 then
    raise exception 'otp_locked' using errcode = '22023';
  end if;

  v_hash := encode(
    sha256(convert_to(btrim(coalesce(p_otp, '')), 'UTF8')),
    'hex'
  );

  if v_hash <> v_delivery.otp_hash then
    update public.deliveries
    set otp_attempts = otp_attempts + 1
    where id = p_delivery_id;

    raise exception 'otp_invalid' using errcode = '22023';
  end if;

  update public.deliveries
  set status = 'delivered',
      delivered_at = now(),
      otp_hash = null,
      otp_expires_at = null
  where id = p_delivery_id;

  perform public.settle_delivery(p_delivery_id);

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_delivery.order_id, v_delivery.store_id, 'delivered',
    jsonb_build_object('courier_id', v_courier.id, 'fee', v_delivery.fee_amount)
  );

  return jsonb_build_object('status', 'delivered');
end;
$$;

revoke execute on function public.deliver_delivery(uuid, text)
  from public, anon, authenticated;
grant execute on function public.deliver_delivery(uuid, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Litige : le séquestre reste bloqué
 * ------------------------------------------------------------------ */

create or replace function public.report_delivery_problem(
  p_delivery_id uuid,
  p_reason      text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_courier public.couriers%rowtype;
  v_delivery public.deliveries%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_user is null or v_reason is null then
    raise exception 'invalid_request' using errcode = '22023';
  end if;

  select * into v_courier from public.couriers where user_id = v_user;

  select * into v_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if v_courier.id is null
     or v_delivery.id is null
     or v_delivery.courier_id <> v_courier.id
     or v_delivery.status <> 'accepted' then
    raise exception 'not_assigned' using errcode = '22023';
  end if;

  update public.deliveries
  set status = 'disputed',
      failure_reason = left(v_reason, 300),
      offer_expires_at = null
  where id = p_delivery_id;

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_delivery.order_id, v_delivery.store_id, 'delivery_disputed',
    jsonb_build_object(
      'courier_id', v_courier.id,
      'reason', left(v_reason, 300),
      'fee', v_delivery.fee_amount
    )
  );

  return jsonb_build_object('status', 'disputed');
end;
$$;

revoke execute on function public.report_delivery_problem(uuid, text)
  from public, anon, authenticated;
grant execute on function public.report_delivery_problem(uuid, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Administration
 * ------------------------------------------------------------------ */

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

revoke execute on function public.admin_deliveries()
  from public, anon, authenticated;
grant execute on function public.admin_deliveries()
  to authenticated;
