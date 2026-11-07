-- PASHOVE — Règles de paiement par plan au checkout
--
-- Free : le mobile money est autorisé, la carte seulement à partir de
-- 25 000 (frais SasPay absorbés par Pashove).
-- Standard / Pro : tous les moyens, carte comprise.
--
-- Le montant du panier est passé explicitement pour appliquer le seuil carte ;
-- il reste recalculé côté serveur, jamais lu depuis le client.

drop function if exists public.checkout_payment_methods(text, boolean, text, text);

create or replace function public.checkout_payment_methods(
  p_slug             text,
  p_has_non_physical boolean default false,
  p_country          text default null,
  p_currency         text default null,
  p_total            integer default 0
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

  v_online := exists (
    select 1 from public.payment_providers p
    where p.code in ('saspay', 'mock') and p.status = 'active'
  );

  if v_store.cod_enabled then
    v_methods := v_methods || '["cod"]'::jsonb;
  end if;

  if v_online then
    v_methods := v_methods ||
      '["orange_money","wave","mtn_money","moov_money"]'::jsonb;

    if v_plan in ('standard', 'pro') or coalesce(p_total, 0) >= 25000 then
      v_methods := v_methods || '["card"]'::jsonb;
    end if;
  end if;

  return jsonb_build_object(
    'planCode', v_plan,
    'currency', v_store.currency,
    'country', coalesce(p_country, v_store.country),
    'methods', v_methods
  );
end;
$$;

revoke execute on function public.checkout_payment_methods(text, boolean, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.checkout_payment_methods(text, boolean, text, text, integer)
  to anon, authenticated;

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
  if v_method not in ('orange_money', 'wave', 'mtn_money', 'moov_money', 'mobile_money', 'card') then
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
