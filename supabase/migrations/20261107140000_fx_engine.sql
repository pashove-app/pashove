-- PASHOVE — FX2 : moteur de conversion, taux et champs de commande
--
-- Les wallets SasPay sont par (marchand, pays) : un encaissement au Ghana en
-- GHS crédite un wallet Ghana, sans conversion côté SasPay. La conversion ne
-- sert donc qu'à convertir le PRIX affiché, pas le settlement.
--
-- Le taux est figé par commande. Pashove absorbe l'écart d'arrondi : le
-- ledger reste tenu dans la devise de la boutique.

create table if not exists public.fx_rates (
  from_currency text not null check (from_currency ~ '^[A-Z]{3}$'),
  to_currency   text not null check (to_currency ~ '^[A-Z]{3}$'),
  rate          numeric(20, 8) not null check (rate > 0),
  source        text not null default 'manual'
    check (source in ('manual', 'saspay')),
  updated_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  primary key (from_currency, to_currency),
  check (from_currency <> to_currency)
);

alter table public.fx_rates enable row level security;
revoke all on public.fx_rates from public, anon, authenticated;

alter table public.orders
  add column if not exists payment_currency text
    check (payment_currency is null or payment_currency ~ '^[A-Z]{3}$'),
  add column if not exists payment_amount numeric(20, 2)
    check (payment_amount is null or payment_amount > 0),
  add column if not exists fx_rate numeric(20, 8)
    check (fx_rate is null or fx_rate > 0),
  add column if not exists fx_rate_at timestamptz,
  add column if not exists fx_source text
    check (fx_source is null or fx_source in ('saspay', 'manual', 'identity'));

alter table public.payments
  add column if not exists amount_charged numeric(20, 2)
    check (amount_charged is null or amount_charged > 0);

/* ------------------------------------------------------------------ *
 *  Lecture du taux de repli (marchand → checkout public)
 * ------------------------------------------------------------------ */

create or replace function public.public_fx_rate(p_from text, p_to text)
returns numeric
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from text := upper(btrim(coalesce(p_from, '')));
  v_to   text := upper(btrim(coalesce(p_to, '')));
  v_rate numeric;
begin
  if v_from = '' or v_to = '' or v_from = v_to then
    return null;
  end if;

  select r.rate into v_rate
  from public.fx_rates r
  where r.from_currency = v_from and r.to_currency = v_to;

  if v_rate is not null then
    return v_rate;
  end if;

  select 1 / r.rate into v_rate
  from public.fx_rates r
  where r.from_currency = v_to and r.to_currency = v_from;

  return v_rate;
end;
$$;

revoke execute on function public.public_fx_rate(text, text)
  from public, anon, authenticated;
grant execute on function public.public_fx_rate(text, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Écriture du taux manuel (admin plateforme)
 * ------------------------------------------------------------------ */

create or replace function public.save_fx_rate(
  p_from text,
  p_to   text,
  p_rate numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from text := upper(btrim(coalesce(p_from, '')));
  v_to   text := upper(btrim(coalesce(p_to, '')));
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_from !~ '^[A-Z]{3}$' or v_to !~ '^[A-Z]{3}$' or v_from = v_to then
    raise exception 'currency_invalid' using errcode = '22023';
  end if;

  if p_rate is null or p_rate <= 0 then
    raise exception 'rate_invalid' using errcode = '22023';
  end if;

  insert into public.fx_rates (from_currency, to_currency, rate, source, updated_by, updated_at)
  values (v_from, v_to, p_rate, 'manual', auth.uid(), now())
  on conflict (from_currency, to_currency) do update
    set rate = excluded.rate,
        source = 'manual',
        updated_by = excluded.updated_by,
        updated_at = now();

  return jsonb_build_object(
    'from', v_from, 'to', v_to, 'rate', p_rate, 'source', 'manual'
  );
end;
$$;

revoke execute on function public.save_fx_rate(text, text, numeric)
  from public, anon, authenticated;
grant execute on function public.save_fx_rate(text, text, numeric)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Taux figé sur la commande
 * ------------------------------------------------------------------ */

create or replace function public.set_order_fx(
  p_order_token      uuid,
  p_payment_currency text,
  p_payment_amount   numeric,
  p_fx_rate          numeric,
  p_fx_source        text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_currency text := upper(btrim(coalesce(p_payment_currency, '')));
  v_source text := lower(btrim(coalesce(p_fx_source, 'manual')));
begin
  select o.* into v_order
  from public.orders o
  where o.public_token = p_order_token
  for update;

  if v_order.id is null then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception 'order_already_paid' using errcode = '22023';
  end if;

  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'currency_invalid' using errcode = '22023';
  end if;

  if p_payment_amount is null or p_payment_amount <= 0 then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;

  if p_fx_rate is null or p_fx_rate <= 0 then
    raise exception 'rate_invalid' using errcode = '22023';
  end if;

  if v_source not in ('saspay', 'manual', 'identity') then
    raise exception 'fx_source_invalid' using errcode = '22023';
  end if;

  update public.orders
  set payment_currency = v_currency,
      payment_amount = round(p_payment_amount, 2),
      fx_rate = p_fx_rate,
      fx_rate_at = now(),
      fx_source = v_source
  where id = v_order.id;

  return jsonb_build_object(
    'paymentCurrency', v_currency,
    'paymentAmount', round(p_payment_amount, 2),
    'fxRate', p_fx_rate,
    'fxSource', v_source
  );
end;
$$;

revoke execute on function public.set_order_fx(uuid, text, numeric, numeric, text)
  from public, anon, authenticated;
grant execute on function public.set_order_fx(uuid, text, numeric, numeric, text)
  to service_role;
