-- PASHOVE — Règles checkout (COD, carte, minimum mobile money)
--
-- COD : seulement si la boutique l'autorise ET si le panier contient du
-- physique (un panier mixte reste éligible).
-- Carte : seulement à partir de 25 000 (tous les plans).
-- Mobile money : seulement à partir de 200 (minimum SasPay).

alter table public.payments
  add column if not exists country_code text
    check (country_code is null or country_code ~ '^[A-Z]{2}$');

drop function if exists public.checkout_payment_methods(text, boolean, text, text, integer);

create or replace function public.checkout_payment_methods(
  p_slug             text,
  p_has_non_physical boolean default false,
  p_country          text default null,
  p_currency         text default null,
  p_total            integer default 0,
  p_has_physical     boolean default true
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

  if v_store.cod_enabled and coalesce(p_has_physical, true) then
    v_methods := v_methods || '["cod"]'::jsonb;
  end if;

  if v_online and coalesce(p_total, 0) >= 200 then
    v_methods := v_methods ||
      '["orange_money","wave","mtn_money","moov_money"]'::jsonb;

    if coalesce(p_total, 0) >= 25000 then
      v_methods := v_methods || '["card"]'::jsonb;
    end if;
  end if;

  return jsonb_build_object(
    'planCode', v_plan,
    'currency', v_store.currency,
    'country', coalesce(p_country, v_store.country),
    'methods', v_methods,
    'minimumOnline', 200,
    'minimumCard', 25000
  );
end;
$$;

revoke execute on function public.checkout_payment_methods(text, boolean, text, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.checkout_payment_methods(text, boolean, text, text, integer, boolean)
  to anon, authenticated;

create or replace function public.record_saspay_intent(
  p_order_token  uuid,
  p_reference    text,
  p_method       text,
  p_network      text,
  p_redirect_url text default null,
  p_country      text default null
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
      redirect_url = nullif(btrim(coalesce(p_redirect_url, '')), ''),
      country_code = nullif(upper(btrim(coalesce(p_country, ''))), '')
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
        'network', p_network,
        'country', p_country
      )
    );
  end if;
end;
$$;

revoke execute on function public.record_saspay_intent(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_saspay_intent(uuid, text, text, text, text, text)
  to service_role;
