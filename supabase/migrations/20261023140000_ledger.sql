-- Journal financier immuable, en double entrée.
--
-- Les ventes COD n'alimentent pas le solde retirable : le marchand encaisse
-- l'argent directement. Le ledger les enregistre tout de même comme espèces
-- reçues (`cod_cash`) et comme revenus (vente + livraison), afin que le
-- journal reste complet et que la commission puisse s'y adosser.

create table public.ledger_accounts (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete restrict,
  code       text not null check (code in (
    'pending', 'available', 'reserved', 'cod_cash',
    'commission_due', 'sales', 'shipping_income', 'fees', 'payouts'
  )),
  currency   text not null check (char_length(currency) = 3),
  created_at timestamptz not null default now(),

  unique (store_id, code, currency)
);

create index ledger_accounts_store_idx
  on public.ledger_accounts (store_id);

create table public.ledger_transactions (
  id                     uuid primary key default gen_random_uuid(),
  store_id               uuid not null references public.stores (id) on delete restrict,
  kind                   text not null check (kind in (
    'cod_sale', 'commission', 'online_capture', 'settlement', 'refund',
    'payout_request', 'payout_paid', 'payout_released', 'adjustment'
  )),
  source_type            text not null check (source_type in (
    'order', 'payment', 'payout', 'refund', 'manual'
  )),
  source_id              uuid,
  idempotency_key        text not null
    check (char_length(idempotency_key) between 1 and 120),
  reverses_transaction_id uuid references public.ledger_transactions (id),
  occurred_at            timestamptz not null default now(),
  created_by             uuid references auth.users (id) on delete set null,
  metadata               jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),

  unique (store_id, idempotency_key)
);

create index ledger_transactions_store_time_idx
  on public.ledger_transactions (store_id, occurred_at desc);

create table public.ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions (id) on delete restrict,
  store_id       uuid not null references public.stores (id) on delete restrict,
  account_id     uuid not null references public.ledger_accounts (id) on delete restrict,
  direction      text not null check (direction in ('debit', 'credit')),
  amount         bigint not null check (amount > 0),
  currency       text not null check (char_length(currency) = 3),
  created_at     timestamptz not null default now()
);

create index ledger_entries_transaction_idx
  on public.ledger_entries (transaction_id);

create index ledger_entries_account_idx
  on public.ledger_entries (account_id);

create index ledger_entries_store_idx
  on public.ledger_entries (store_id);

/* ------------------------------------------------------------------ *
 *  Invariants : cohérence, équilibre, immuabilité
 * ------------------------------------------------------------------ */

create or replace function public.ledger_validate_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store    uuid;
  v_currency text;
  v_account_store uuid;
  v_account_currency text;
begin
  select t.store_id into v_store
  from public.ledger_transactions t
  where t.id = new.transaction_id;

  if v_store is null or v_store <> new.store_id then
    raise exception 'invalid_ledger_store' using errcode = '22023';
  end if;

  select a.store_id, a.currency into v_account_store, v_account_currency
  from public.ledger_accounts a
  where a.id = new.account_id;

  if v_account_store is null
     or v_account_store <> new.store_id
     or v_account_currency <> new.currency then
    raise exception 'invalid_ledger_account' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke execute on function public.ledger_validate_entry()
  from public, anon, authenticated;

create trigger ledger_entries_validate
  before insert on public.ledger_entries
  for each row execute function public.ledger_validate_entry();

create or replace function public.ledger_assert_balanced()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_debit  bigint;
  v_credit bigint;
begin
  select
    coalesce(sum(e.amount) filter (where e.direction = 'debit'), 0),
    coalesce(sum(e.amount) filter (where e.direction = 'credit'), 0)
  into v_debit, v_credit
  from public.ledger_entries e
  where e.transaction_id = new.transaction_id;

  if v_debit <> v_credit then
    raise exception 'ledger_unbalanced' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke execute on function public.ledger_assert_balanced()
  from public, anon, authenticated;

create constraint trigger ledger_entries_balanced
  after insert on public.ledger_entries
  deferrable initially deferred
  for each row execute function public.ledger_assert_balanced();

create or replace function public.ledger_block_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'ledger_immutable' using errcode = '42501';
end;
$$;

revoke execute on function public.ledger_block_mutation()
  from public, anon, authenticated;

create trigger ledger_transactions_immutable
  before update or delete on public.ledger_transactions
  for each row execute function public.ledger_block_mutation();

create trigger ledger_entries_immutable
  before update or delete on public.ledger_entries
  for each row execute function public.ledger_block_mutation();

/* ------------------------------------------------------------------ *
 *  Écriture interne
 * ------------------------------------------------------------------ */

create or replace function public.ensure_ledger_account(
  p_store_id uuid,
  p_code     text,
  p_currency text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.ledger_accounts (store_id, code, currency)
  values (p_store_id, p_code, p_currency)
  on conflict (store_id, code, currency) do nothing;

  select a.id into v_id
  from public.ledger_accounts a
  where a.store_id = p_store_id
    and a.code = p_code
    and a.currency = p_currency;

  return v_id;
end;
$$;

revoke execute on function public.ensure_ledger_account(uuid, text, text)
  from public, anon, authenticated;

create or replace function public.post_ledger_transaction(
  p_store_id        uuid,
  p_kind            text,
  p_source_type     text,
  p_source_id       uuid,
  p_idempotency_key text,
  p_metadata        jsonb,
  p_entries         jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id       uuid;
  v_entry    jsonb;
  v_code     text;
  v_direction text;
  v_amount   bigint;
  v_currency text;
  v_account  uuid;
  v_debit    bigint := 0;
  v_credit   bigint := 0;
begin
  if not exists (select 1 from public.stores s where s.id = p_store_id) then
    raise exception 'invalid_store' using errcode = '22023';
  end if;

  if p_entries is null
     or jsonb_typeof(p_entries) <> 'array'
     or jsonb_array_length(p_entries) = 0 then
    raise exception 'invalid_entries' using errcode = '22023';
  end if;

  insert into public.ledger_transactions (
    store_id, kind, source_type, source_id, idempotency_key, metadata, created_by
  )
  values (
    p_store_id, p_kind, p_source_type, p_source_id, p_idempotency_key,
    coalesce(p_metadata, '{}'::jsonb), auth.uid()
  )
  on conflict (store_id, idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then
    select t.id into v_id
    from public.ledger_transactions t
    where t.store_id = p_store_id
      and t.idempotency_key = p_idempotency_key;

    return v_id;
  end if;

  for v_entry in select * from jsonb_array_elements(p_entries)
  loop
    v_code      := v_entry->>'account';
    v_direction := v_entry->>'direction';
    v_amount    := (v_entry->>'amount')::bigint;
    v_currency  := v_entry->>'currency';

    if v_code is null
       or v_direction is null
       or v_direction not in ('debit', 'credit')
       or v_amount is null
       or v_amount <= 0
       or v_currency is null then
      raise exception 'invalid_entry' using errcode = '22023';
    end if;

    v_account := public.ensure_ledger_account(p_store_id, v_code, v_currency);

    insert into public.ledger_entries (
      transaction_id, store_id, account_id, direction, amount, currency
    )
    values (v_id, p_store_id, v_account, v_direction, v_amount, v_currency);

    if v_direction = 'debit' then
      v_debit := v_debit + v_amount;
    else
      v_credit := v_credit + v_amount;
    end if;
  end loop;

  if v_debit <> v_credit then
    raise exception 'ledger_unbalanced' using errcode = '22023';
  end if;

  return v_id;
end;
$$;

revoke execute on function public.post_ledger_transaction(
  uuid, text, text, uuid, text, jsonb, jsonb
) from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Ventes COD
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

  if v_order.total_amount <> v_order.subtotal_amount + v_order.shipping_amount then
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
      )
    )
  ) as entry
  where (entry->>'amount')::bigint > 0;

  if v_entries is null then
    return null;
  end if;

  return public.post_ledger_transaction(
    v_order.store_id,
    'cod_sale',
    'order',
    v_order.id,
    'cod-sale:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'payment_method', 'cod'
    ),
    v_entries
  );
end;
$$;

revoke execute on function public.post_cod_sale(uuid)
  from public, anon, authenticated;

create or replace function public.ledger_on_order_paid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.payment_method = 'cod'
     and new.payment_status = 'paid'
     and (tg_op = 'INSERT' or old.payment_status is distinct from 'paid') then
    perform public.post_cod_sale(new.id);
  end if;

  return new;
end;
$$;

revoke execute on function public.ledger_on_order_paid()
  from public, anon, authenticated;

create trigger orders_ledger_cod
  after insert or update of payment_status on public.orders
  for each row execute function public.ledger_on_order_paid();

/* ------------------------------------------------------------------ *
 *  Soldes
 * ------------------------------------------------------------------ */

create or replace function public.store_balances(p_store_id uuid)
returns table (code text, currency text, balance bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  return query
  select
    a.code,
    a.currency,
    coalesce(sum(
      case e.direction
        when 'debit' then e.amount
        else -e.amount
      end
    ), 0)::bigint as balance
  from public.ledger_accounts a
  left join public.ledger_entries e on e.account_id = a.id
  where a.store_id = p_store_id
  group by a.code, a.currency
  order by a.code;
end;
$$;

revoke execute on function public.store_balances(uuid)
  from public, anon, authenticated;
grant execute on function public.store_balances(uuid) to authenticated;

/* ------------------------------------------------------------------ *
 *  Accès en lecture seule
 * ------------------------------------------------------------------ */

alter table public.ledger_accounts enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.ledger_entries enable row level security;

create policy ledger_accounts_select_member on public.ledger_accounts
  for select to authenticated
  using (public.is_store_member(store_id));

create policy ledger_transactions_select_member on public.ledger_transactions
  for select to authenticated
  using (public.is_store_member(store_id));

create policy ledger_entries_select_member on public.ledger_entries
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.ledger_accounts from public, anon, authenticated;
revoke all on public.ledger_transactions from public, anon, authenticated;
revoke all on public.ledger_entries from public, anon, authenticated;

grant select on public.ledger_accounts to authenticated;
grant select on public.ledger_transactions to authenticated;
grant select on public.ledger_entries to authenticated;

/* ------------------------------------------------------------------ *
 *  Rejeu des ventes COD déjà encaissées
 * ------------------------------------------------------------------ */

do $$
declare
  v_order uuid;
begin
  for v_order in
    select o.id
    from public.orders o
    where o.payment_method = 'cod'
      and o.payment_status = 'paid'
  loop
    perform public.post_cod_sale(v_order);
  end loop;
end;
$$;
