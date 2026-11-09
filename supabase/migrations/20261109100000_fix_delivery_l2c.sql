-- PASHOVE — Réparation L2c : OTP, validation et comptes de livraison
--
-- La migration L2c a été appliquée partiellement sur la base de production :
-- la contrainte ledger refusait `delivery_income` et les fonctions OTP /
-- validation étaient absentes. Cette migration répare uniquement ces éléments.
--
-- `settle_delivery` reste la version L3 (séquestre + holding 24 h) déjà en
-- place ; `deliver_delivery` l'appelle après validation du code.
--
-- Ne pas rejouer la migration L2c complète après celle-ci : elle remplacerait
-- `settle_delivery` par l'ancienne version sans holding.

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
alter table public.deliveries add column if not exists otp_hash text;
alter table public.deliveries add column if not exists otp_expires_at timestamptz;

alter table public.ledger_accounts drop constraint if exists ledger_accounts_code_check;
alter table public.ledger_accounts
  add constraint ledger_accounts_code_check
  check (code in (
    'affiliate_commission', 'affiliate_income', 'available', 'cod_cash',
    'commission_due', 'delivery_commission_income', 'delivery_income',
    'discounts', 'fees', 'partner_payable', 'partner_receivable',
    'payouts', 'pending', 'reserved', 'sales', 'shipping_income',
    'saspay_fees_absorbed'
  ));

/* ------------------------------------------------------------------ *
 *  Génération du code de livraison
 * ------------------------------------------------------------------ */

create or replace function public.issue_delivery_otp(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_order    public.orders%rowtype;
  v_store    public.stores%rowtype;
  v_code     text;
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
 *  Validation de la course par OTP
 * ------------------------------------------------------------------ */

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
  v_user     uuid := auth.uid();
  v_courier  public.couriers%rowtype;
  v_delivery public.deliveries%rowtype;
  v_hash     text;
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
