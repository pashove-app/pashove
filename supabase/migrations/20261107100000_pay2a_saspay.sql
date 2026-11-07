-- PASHOVE — PAY2a : encaissement SasPay
--
-- Ajoute le fournisseur `saspay` à côté du Mock, les moyens MTN et Moov, et
-- les RPC de confirmation écrites pour la vraie API SasPay :
--   POST /payments/softpay/            → createIntent
--   GET  /payments/{id}/verify/        → vérification
--   webhook signé                      → confirm_saspay_payment
--
-- Règle non négociable : le montant envoyé par le webhook n'est jamais cru.
-- Il est comparé en base au total de la commande avant toute écriture.

/* ------------------------------------------------------------------ *
 *  Fournisseur et moyens de paiement
 * ------------------------------------------------------------------ */

alter table public.payment_providers drop constraint if exists payment_providers_code_check;
alter table public.payment_providers
  add constraint payment_providers_code_check
  check (code in ('mock', 'saspay', 'flutterwave', 'cinetpay', 'paydunya'));

insert into public.payment_providers (code, name, status, mode)
values ('saspay', 'SasPay', 'active', 'live')
on conflict (code) do nothing;

alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments
  add constraint payments_provider_check
  check (provider in ('cod', 'mock', 'saspay', 'flutterwave', 'cinetpay', 'paydunya'));

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments
  add constraint payments_method_check
  check (method in ('cod', 'orange_money', 'wave', 'mtn_money', 'moov_money', 'card'));

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cod', 'orange_money', 'wave', 'mtn_money', 'moov_money', 'card'));

alter table public.payments
  add column if not exists network_code text,
  add column if not exists redirect_url text;

/* ------------------------------------------------------------------ *
 *  Éligibilité : MTN et Moov rejoignent la liste
 * ------------------------------------------------------------------ */

create or replace function public.checkout_payment_methods(
  p_slug             text,
  p_has_non_physical boolean default false,
  p_country          text default null,
  p_currency         text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
  v_plan  text := 'free';
  v_online boolean;
  v_methods jsonb := '[]'::jsonb;
begin
  select s.* into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store.id is null then
    return null;
  end if;

  select coalesce(ap.plan_code, 'free') into v_plan
  from public.store_members sm
  left join public.account_plans ap on ap.user_id = sm.user_id
  where sm.store_id = v_store.id
    and sm.role = 'owner'
  order by sm.created_at
  limit 1;

  if v_plan is null then
    v_plan := 'free';
  end if;

  v_online := (
    v_plan in ('standard', 'pro')
    or coalesce(p_has_non_physical, false)
  ) and exists (
    select 1 from public.payment_providers p
    where p.code in ('saspay', 'mock') and p.status = 'active'
  );

  if v_store.cod_enabled then
    v_methods := v_methods || '["cod"]'::jsonb;
  end if;

  if v_online then
    v_methods := v_methods ||
      '["orange_money","wave","mtn_money","moov_money","card"]'::jsonb;
  end if;

  return jsonb_build_object(
    'planCode', v_plan,
    'currency', v_store.currency,
    'country', coalesce(p_country, v_store.country),
    'methods', v_methods
  );
end;
$$;

revoke execute on function public.checkout_payment_methods(text, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.checkout_payment_methods(text, boolean, text, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Commande en ligne, fournisseur paramétrable
 * ------------------------------------------------------------------ */

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
  if v_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'card') then
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

revoke execute on function public.place_online_order(uuid, jsonb, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.place_online_order(uuid, jsonb, uuid, text, text)
  to anon, authenticated;

-- La signature à quatre arguments reste réservée au Mock (PAY1).
create or replace function public.place_online_order(
  p_token           uuid,
  p_customer        jsonb,
  p_idempotency_key uuid,
  p_method          text
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.place_online_order($1, $2, $3, $4, 'mock');
$$;

revoke execute on function public.place_online_order(uuid, jsonb, uuid, text)
  from public, anon, authenticated;
grant execute on function public.place_online_order(uuid, jsonb, uuid, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Intention SasPay : référence, réseau, URL de redirection
 * ------------------------------------------------------------------ */

create or replace function public.record_saspay_intent(
  p_order_token  uuid,
  p_reference    text,
  p_method       text,
  p_network      text,
  p_redirect_url text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders%rowtype;
  v_payment public.payments%rowtype;
begin
  select o.* into v_order from public.orders o where o.public_token = p_order_token;
  if v_order.id is null then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  select p.* into v_payment
  from public.payments p
  where p.order_id = v_order.id and p.provider = 'saspay'
  for update;

  if v_payment.id is null then
    raise exception 'payment_unavailable' using errcode = '22023';
  end if;

  -- Une intention SasPay déjà enregistrée n'est jamais réécrite : le premier
  -- identifiant est celui que le webhook renverra.
  if v_payment.reference is not null
     and v_payment.reference <> btrim(p_reference) then
    return;
  end if;

  update public.payments
  set reference = btrim(p_reference),
      method = lower(btrim(p_method)),
      network_code = nullif(btrim(coalesce(p_network, '')), ''),
      redirect_url = nullif(btrim(coalesce(p_redirect_url, '')), '')
  where id = v_payment.id;

  if not exists (
    select 1 from public.payment_transactions t
    where t.payment_id = v_payment.id
      and t.type = 'intent_created'
      and t.provider_reference = btrim(p_reference)
  ) then
    insert into public.payment_transactions (
      payment_id, store_id, type, status, provider_reference, payload
    )
    values (
      v_payment.id, v_order.store_id, 'intent_created', 'requires_action',
      btrim(p_reference),
      jsonb_build_object(
        'order_number', v_order.number,
        'provider', 'saspay',
        'network', p_network
      )
    );
  end if;
end;
$$;

revoke execute on function public.record_saspay_intent(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_saspay_intent(uuid, text, text, text, text)
  to service_role;

/* ------------------------------------------------------------------ *
 *  Confirmation et échec, pilotés par le webhook
 * ------------------------------------------------------------------ */

create or replace function public.confirm_saspay_payment(
  p_reference text,
  p_amount    integer,
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

  -- Le montant du webhook ne fait jamais foi : il doit correspondre au total
  -- de la commande calculé côté serveur.
  if p_amount <> v_order.total_amount
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
  set status = 'captured'
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

revoke execute on function public.confirm_saspay_payment(text, integer, text)
  from public, anon, authenticated;
grant execute on function public.confirm_saspay_payment(text, integer, text)
  to service_role;

create or replace function public.fail_saspay_payment(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders%rowtype;
  v_payment public.payments%rowtype;
begin
  select p.* into v_payment
  from public.payments p
  where p.reference = btrim(p_reference)
    and p.provider = 'saspay'
  for update;

  if v_payment.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'payment_unknown');
  end if;

  if v_payment.status = 'captured' then
    return jsonb_build_object('status', 'ignored', 'reason', 'already_captured');
  end if;

  if v_payment.status = 'failed' then
    return jsonb_build_object('status', 'failed', 'already', true);
  end if;

  select o.* into v_order from public.orders o where o.id = v_payment.order_id for update;

  update public.payments set status = 'failed' where id = v_payment.id;
  update public.orders
  set payment_status = 'failed'
  where id = v_order.id
    and payment_status = 'pending';

  insert into public.payment_transactions (
    payment_id, store_id, type, status, provider_reference, payload
  )
  values (
    v_payment.id, v_order.store_id, 'capture', 'failed',
    btrim(p_reference),
    jsonb_build_object('order_number', v_order.number, 'provider', 'saspay')
  );

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order.id, v_order.store_id, 'payment_failed',
    jsonb_build_object('provider', 'saspay', 'reference', btrim(p_reference))
  );

  return jsonb_build_object('status', 'failed');
end;
$$;

revoke execute on function public.fail_saspay_payment(text)
  from public, anon, authenticated;
grant execute on function public.fail_saspay_payment(text)
  to service_role;

/* ------------------------------------------------------------------ *
 *  Écritures comptables : accepter les deux fournisseurs en ligne
 * ------------------------------------------------------------------ */

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
     or v_order.payment_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'card')
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

revoke execute on function public.post_online_sale(uuid)
  from public, anon, authenticated;

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
     or v_order.payment_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'card')
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

revoke execute on function public.post_online_commission(uuid)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Admin : ordre d'affichage
 * ------------------------------------------------------------------ */

create or replace function public.admin_payment_providers()
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
          'code', p.code,
          'name', p.name,
          'status', p.status,
          'mode', p.mode,
          'configured', p.config_encrypted is not null,
          'updatedAt', p.updated_at
        )
        order by case p.code
          when 'saspay' then 0 when 'mock' then 1
          when 'flutterwave' then 2 when 'cinetpay' then 3 else 4 end
      )
      from public.payment_providers p
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.admin_payment_providers()
  from public, anon, authenticated;
grant execute on function public.admin_payment_providers()
  to authenticated;

create or replace function public.save_payment_provider(
  p_code             text,
  p_status           text,
  p_mode             text,
  p_config_encrypted text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.payment_providers%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_code not in ('mock', 'saspay', 'flutterwave', 'cinetpay', 'paydunya')
     or p_status not in ('active', 'not_configured', 'disabled')
     or p_mode not in ('test', 'live') then
    raise exception 'provider_invalid' using errcode = '22023';
  end if;

  update public.payment_providers
  set status = p_status,
      mode = p_mode,
      config_encrypted = p_config_encrypted,
      updated_at = now()
  where code = p_code
  returning * into v_row;

  if v_row.code is null then
    raise exception 'provider_unavailable' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'code', v_row.code, 'status', v_row.status, 'mode', v_row.mode,
    'configured', v_row.config_encrypted is not null
  );
end;
$$;

revoke execute on function public.save_payment_provider(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.save_payment_provider(text, text, text, text)
  to authenticated;
