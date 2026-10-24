-- Demandes de retrait.
--
-- Une demande immobilise immédiatement le montant : available → reserved.
-- Aucun argent ne sort ici ; l'exécution réelle viendra avec le PSP. Une
-- demande reste `requested` tant que le KYC et la validation admin ne sont pas
-- en place.

create table public.payouts (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores (id) on delete restrict,
  method_id           uuid not null references public.payout_methods (id) on delete restrict,
  amount              integer not null check (amount > 0),
  currency            text not null check (char_length(currency) = 3),
  status              text not null default 'requested'
    check (status in (
      'requested', 'security_check', 'processing', 'sent',
      'completed', 'failed', 'reversed', 'cancelled'
    )),
  -- Instantané de la destination au moment de la demande.
  provider            text not null,
  account_name        text not null,
  account_last4       text not null,
  idempotency_key     text not null check (char_length(idempotency_key) between 1 and 120),
  requested_by        uuid references auth.users (id) on delete set null,
  requested_at        timestamptz not null default now(),
  reviewed_at         timestamptz,
  sent_at             timestamptz,
  completed_at        timestamptz,
  cancelled_at        timestamptz,
  provider_reference  text,
  failure_code        text,
  failure_reason      text,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (store_id, idempotency_key)
);

create index payouts_store_time_idx
  on public.payouts (store_id, created_at desc);

create index payouts_status_idx
  on public.payouts (status);

create trigger payouts_touch_updated_at
  before update on public.payouts
  for each row execute function public.touch_updated_at();

create table public.payout_events (
  id         uuid primary key default gen_random_uuid(),
  payout_id  uuid not null references public.payouts (id) on delete restrict,
  store_id   uuid not null references public.stores (id) on delete restrict,
  status     text not null,
  actor_id   uuid references auth.users (id) on delete set null,
  note       text,
  created_at timestamptz not null default now()
);

create index payout_events_payout_idx
  on public.payout_events (payout_id, created_at);

/* ------------------------------------------------------------------ *
 *  Demande de retrait
 * ------------------------------------------------------------------ */

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
    and a.code = 'available'
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

revoke execute on function public.request_payout(uuid, uuid, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.request_payout(uuid, uuid, integer, text, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Annulation avant traitement
 * ------------------------------------------------------------------ */

create or replace function public.cancel_payout(p_payout_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.payouts%rowtype;
begin
  select p.* into v_payout
  from public.payouts p
  where p.id = p_payout_id
  for update;

  if v_payout.id is null
     or not public.has_store_role(
       v_payout.store_id, array['owner', 'admin']::public.store_role[]
     ) then
    raise exception 'payout_not_found' using errcode = '22023';
  end if;

  if v_payout.status = 'cancelled' then
    return jsonb_build_object('status', 'cancelled', 'already', true);
  end if;

  if v_payout.status not in ('requested', 'security_check') then
    raise exception 'cancel_not_allowed' using errcode = '22023';
  end if;

  update public.payouts
  set status = 'cancelled',
      cancelled_at = now()
  where id = p_payout_id;

  perform public.post_ledger_transaction(
    v_payout.store_id,
    'payout_released',
    'payout',
    v_payout.id,
    'payout-release:' || v_payout.id::text,
    jsonb_build_object('payout_id', v_payout.id),
    jsonb_build_array(
      jsonb_build_object(
        'account', 'available', 'direction', 'debit',
        'amount', v_payout.amount, 'currency', v_payout.currency
      ),
      jsonb_build_object(
        'account', 'reserved', 'direction', 'credit',
        'amount', v_payout.amount, 'currency', v_payout.currency
      )
    )
  );

  insert into public.payout_events (payout_id, store_id, status, actor_id)
  values (v_payout.id, v_payout.store_id, 'cancelled', auth.uid());

  return jsonb_build_object('status', 'cancelled');
end;
$$;

revoke execute on function public.cancel_payout(uuid)
  from public, anon, authenticated;
grant execute on function public.cancel_payout(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Accès en lecture
 * ------------------------------------------------------------------ */

alter table public.payouts enable row level security;
alter table public.payout_events enable row level security;

create policy payouts_select_member on public.payouts
  for select to authenticated
  using (public.is_store_member(store_id));

create policy payout_events_select_member on public.payout_events
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.payouts from public, anon, authenticated;
revoke all on public.payout_events from public, anon, authenticated;

grant select on public.payouts to authenticated;
grant select on public.payout_events to authenticated;

