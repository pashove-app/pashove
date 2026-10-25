-- KYC manuel et administration plateforme.
--
-- Le KYC n'est exigé qu'au premier retrait. Les documents sont privés, la
-- revue est manuelle en v1, et toute décision passe par un rôle plateforme
-- tracé dans l'audit. Smile Identity remplacera la revue manuelle plus tard
-- sans changer les états ni les écrans.

create table public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in (
    'super_admin', 'kyc_reviewer', 'payout_operator', 'finance_operator', 'auditor'
  )),
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_platform_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.user_id = (select auth.uid())
      and a.role = any (roles)
  );
$$;

revoke execute on function public.is_platform_admin()
  from public, anon, authenticated;
grant execute on function public.is_platform_admin() to authenticated;

revoke execute on function public.has_platform_role(text[])
  from public, anon, authenticated;
grant execute on function public.has_platform_role(text[]) to authenticated;

create policy platform_admins_select_self on public.platform_admins
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_admin());

revoke all on public.platform_admins from public, anon, authenticated;
grant select on public.platform_admins to authenticated;

create table public.kyc_cases (
  id                        uuid primary key default gen_random_uuid(),
  store_id                  uuid not null unique references public.stores (id) on delete restrict,
  status                    text not null default 'submitted'
    check (status in (
      'submitted', 'under_review', 'approved', 'rejected',
      'resubmission_required', 'expired'
    )),
  legal_name                text not null check (char_length(btrim(legal_name)) between 2 and 160),
  birth_date                date not null,
  country                   text not null check (char_length(country) = 2),
  document_type             text not null check (document_type in (
    'national_id', 'passport', 'driver_license', 'residence_permit'
  )),
  document_number_encrypted text not null,
  document_last4            text not null check (document_last4 ~ '^[A-Za-z0-9]{4}$'),
  front_media_id            uuid not null references public.media_assets (id) on delete restrict,
  back_media_id             uuid references public.media_assets (id) on delete restrict,
  selfie_media_id           uuid not null references public.media_assets (id) on delete restrict,
  submitted_at              timestamptz not null default now(),
  reviewed_at               timestamptz,
  reviewed_by               uuid references auth.users (id) on delete set null,
  rejection_reason          text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger kyc_cases_touch_updated_at
  before update on public.kyc_cases
  for each row execute function public.touch_updated_at();

create table public.kyc_events (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references public.kyc_cases (id) on delete restrict,
  store_id   uuid not null references public.stores (id) on delete restrict,
  status     text not null,
  actor_id   uuid references auth.users (id) on delete set null,
  note       text,
  created_at timestamptz not null default now()
);

create index kyc_events_case_idx on public.kyc_events (case_id, created_at);

create table public.platform_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

/* ------------------------------------------------------------------ *
 *  Documents KYC : types et visibilité
 * ------------------------------------------------------------------ */

alter table public.media_assets
  drop constraint media_assets_kind_check;

alter table public.media_assets
  add constraint media_assets_kind_check
  check (kind in ('logo', 'banner', 'product', 'digital_file', 'kyc_document'));

drop policy media_assets_select_public on public.media_assets;
create policy media_assets_select_public on public.media_assets
  for select to anon, authenticated
  using (
    public.is_public_store(store_id)
    and kind not in ('digital_file', 'kyc_document')
  );

create policy media_assets_select_staff_kyc on public.media_assets
  for select to authenticated
  using (public.is_platform_admin() and kind = 'kyc_document');

/* ------------------------------------------------------------------ *
 *  Soumission marchand
 * ------------------------------------------------------------------ */

create or replace function public.submit_kyc(
  p_store_id                  uuid,
  p_legal_name                text,
  p_birth_date                date,
  p_country                   text,
  p_document_type             text,
  p_document_number_encrypted text,
  p_document_last4            text,
  p_front_media_id            uuid,
  p_back_media_id             uuid,
  p_selfie_media_id           uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case public.kyc_cases%rowtype;
  v_id   uuid;
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select c.* into v_case
  from public.kyc_cases c
  where c.store_id = p_store_id
  for update;

  if v_case.status = 'approved' then
    raise exception 'kyc_already_approved' using errcode = '22023';
  end if;

  if v_case.status in ('submitted', 'under_review') then
    raise exception 'kyc_pending' using errcode = '22023';
  end if;

  if p_legal_name is null or char_length(btrim(p_legal_name)) < 2 then
    raise exception 'invalid_kyc_name' using errcode = '22023';
  end if;

  if p_birth_date is null or p_birth_date > current_date - interval '18 years' then
    raise exception 'invalid_kyc_birth_date' using errcode = '22023';
  end if;

  if p_country is null or char_length(p_country) <> 2 then
    raise exception 'invalid_kyc_country' using errcode = '22023';
  end if;

  if p_document_type not in (
    'national_id', 'passport', 'driver_license', 'residence_permit'
  ) then
    raise exception 'invalid_kyc_document' using errcode = '22023';
  end if;

  if p_document_number_encrypted is null or char_length(p_document_number_encrypted) < 20 then
    raise exception 'invalid_kyc_document' using errcode = '22023';
  end if;

  if p_front_media_id is null or p_selfie_media_id is null then
    raise exception 'invalid_kyc_documents' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.media_assets m
    where m.id = p_front_media_id
      and m.store_id = p_store_id
      and m.kind = 'kyc_document'
  ) or not exists (
    select 1 from public.media_assets m
    where m.id = p_selfie_media_id
      and m.store_id = p_store_id
      and m.kind = 'kyc_document'
  ) or (
    p_back_media_id is not null and not exists (
      select 1 from public.media_assets m
      where m.id = p_back_media_id
        and m.store_id = p_store_id
        and m.kind = 'kyc_document'
    )
  ) then
    raise exception 'invalid_kyc_documents' using errcode = '22023';
  end if;

  insert into public.kyc_cases (
    store_id, status, legal_name, birth_date, country, document_type,
    document_number_encrypted, document_last4,
    front_media_id, back_media_id, selfie_media_id, submitted_at
  )
  values (
    p_store_id, 'submitted', btrim(p_legal_name), p_birth_date, upper(p_country),
    p_document_type, p_document_number_encrypted, upper(p_document_last4),
    p_front_media_id, p_back_media_id, p_selfie_media_id, now()
  )
  on conflict (store_id) do update
  set status = 'submitted',
      legal_name = excluded.legal_name,
      birth_date = excluded.birth_date,
      country = excluded.country,
      document_type = excluded.document_type,
      document_number_encrypted = excluded.document_number_encrypted,
      document_last4 = excluded.document_last4,
      front_media_id = excluded.front_media_id,
      back_media_id = excluded.back_media_id,
      selfie_media_id = excluded.selfie_media_id,
      submitted_at = now(),
      reviewed_at = null,
      reviewed_by = null,
      rejection_reason = null,
      updated_at = now()
  returning id into v_id;

  insert into public.kyc_events (case_id, store_id, status, actor_id)
  values (v_id, p_store_id, 'submitted', auth.uid());

  insert into public.platform_audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(), 'kyc.submitted', 'store', p_store_id,
    jsonb_build_object('case_id', v_id)
  );

  return v_id;
end;
$$;

revoke execute on function public.submit_kyc(
  uuid, text, date, text, text, text, text, uuid, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.submit_kyc(
  uuid, text, date, text, text, text, text, uuid, uuid, uuid
) to authenticated;

/* ------------------------------------------------------------------ *
 *  Revue plateforme
 * ------------------------------------------------------------------ */

create or replace function public.review_kyc(
  p_case_id  uuid,
  p_decision text,
  p_reason   text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case   public.kyc_cases%rowtype;
  v_status text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.has_platform_role(array['super_admin', 'kyc_reviewer']) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select c.* into v_case
  from public.kyc_cases c
  where c.id = p_case_id
  for update;

  if v_case.id is null then
    raise exception 'kyc_not_found' using errcode = '22023';
  end if;

  v_status := case p_decision
    when 'approved' then 'approved'
    when 'rejected' then 'rejected'
    when 'resubmission' then 'resubmission_required'
    else null
  end;

  if v_status is null then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;

  if v_status in ('rejected', 'resubmission_required') and v_reason is null then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  update public.kyc_cases
  set status = v_status,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      rejection_reason = case when v_status = 'approved' then null else v_reason end
  where id = p_case_id;

  insert into public.kyc_events (case_id, store_id, status, actor_id, note)
  values (p_case_id, v_case.store_id, v_status, auth.uid(), v_reason);

  insert into public.platform_audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'kyc.' || v_status,
    'store',
    v_case.store_id,
    jsonb_build_object('case_id', p_case_id, 'reason', v_reason)
  );
end;
$$;

revoke execute on function public.review_kyc(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_kyc(uuid, text, text)
  to authenticated;

create or replace function public.store_kyc_status(p_store_id uuid)
returns table (
  status           text,
  submitted_at     timestamptz,
  reviewed_at      timestamptz,
  rejection_reason text,
  legal_name       text,
  document_last4   text
)
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
    c.status, c.submitted_at, c.reviewed_at, c.rejection_reason,
    c.legal_name, c.document_last4
  from public.kyc_cases c
  where c.store_id = p_store_id;

  if not found then
    return query select
      'not_started'::text, null::timestamptz, null::timestamptz,
      null::text, null::text, null::text;
  end if;
end;
$$;

revoke execute on function public.store_kyc_status(uuid)
  from public, anon, authenticated;
grant execute on function public.store_kyc_status(uuid) to authenticated;

/* ------------------------------------------------------------------ *
 *  Le retrait exige un KYC soumis ou approuvé
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
  v_kyc       text;
  v_available bigint;
  v_status    text;
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select s.* into v_store from public.stores s where s.id = p_store_id;
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
    select 1 from public.payouts p
    where p.store_id = p_store_id and p.idempotency_key = p_idempotency_key
  ) then
    select p.* into v_payout from public.payouts p
    where p.store_id = p_store_id and p.idempotency_key = p_idempotency_key;

    return jsonb_build_object(
      'status', 'already', 'payout_id', v_payout.id,
      'payout_status', v_payout.status
    );
  end if;

  select c.status into v_kyc
  from public.kyc_cases c
  where c.store_id = p_store_id;

  if v_kyc is null or v_kyc not in ('submitted', 'under_review', 'approved') then
    raise exception 'kyc_required' using errcode = '22023';
  end if;

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

  v_status := case when v_kyc = 'approved' then 'requested' else 'security_check' end;

  insert into public.payouts (
    store_id, method_id, amount, currency, status,
    provider, account_name, account_last4,
    idempotency_key, requested_by
  )
  values (
    p_store_id, p_method_id, p_amount, v_store.currency, v_status,
    v_method.provider, v_method.account_name, v_method.account_last4,
    p_idempotency_key, auth.uid()
  )
  returning * into v_payout;

  perform public.post_ledger_transaction(
    p_store_id, 'payout_request', 'payout', v_payout.id,
    'payout-request:' || v_payout.id::text,
    jsonb_build_object(
      'payout_id', v_payout.id, 'provider', v_method.provider,
      'account_last4', v_method.account_last4, 'kyc_status', v_kyc
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'reserved', 'direction', 'debit',
        'amount', p_amount, 'currency', v_store.currency),
      jsonb_build_object('account', 'available', 'direction', 'credit',
        'amount', p_amount, 'currency', v_store.currency)
    )
  );

  insert into public.payout_events (payout_id, store_id, status, actor_id)
  values (v_payout.id, p_store_id, v_status, auth.uid());

  return jsonb_build_object(
    'status', v_status, 'payout_id', v_payout.id,
    'amount', p_amount, 'currency', v_store.currency
  );
end;
$$;

revoke execute on function public.request_payout(uuid, uuid, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.request_payout(uuid, uuid, integer, text, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Transitions administrateur d'un retrait
 * ------------------------------------------------------------------ */

create or replace function public.admin_transition_payout(
  p_payout_id uuid,
  p_action    text,
  p_reference text default null,
  p_reason    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.payouts%rowtype;
  v_kyc    text;
  v_status text;
begin
  if not public.has_platform_role(
    array['super_admin', 'payout_operator', 'finance_operator']
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select p.* into v_payout
  from public.payouts p
  where p.id = p_payout_id
  for update;

  if v_payout.id is null then
    raise exception 'payout_not_found' using errcode = '22023';
  end if;

  select c.status into v_kyc
  from public.kyc_cases c
  where c.store_id = v_payout.store_id;

  if p_action in ('processing', 'sent', 'completed') and v_kyc <> 'approved' then
    raise exception 'kyc_required' using errcode = '22023';
  end if;

  v_status := case p_action
    when 'processing' then 'processing'
    when 'sent' then 'sent'
    when 'completed' then 'completed'
    when 'failed' then 'failed'
    else null
  end;

  if v_status is null then
    raise exception 'invalid_action' using errcode = '22023';
  end if;

  if p_action = 'processing' and v_payout.status not in ('requested', 'security_check') then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_action = 'sent' and v_payout.status <> 'processing' then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_action = 'completed' and v_payout.status <> 'sent' then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_action = 'failed' and v_payout.status not in ('requested', 'security_check', 'processing', 'sent') then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  if p_action = 'sent' and (p_reference is null or char_length(btrim(p_reference)) = 0) then
    raise exception 'reference_required' using errcode = '22023';
  end if;

  update public.payouts
  set status = v_status,
      reviewed_at = case when p_action = 'processing' then now() else reviewed_at end,
      sent_at = case when p_action = 'sent' then now() else sent_at end,
      completed_at = case when p_action = 'completed' then now() else completed_at end,
      provider_reference = case when p_action = 'sent' then btrim(p_reference) else provider_reference end,
      failure_reason = case when p_action = 'failed' then nullif(btrim(coalesce(p_reason, '')), '') else failure_reason end
  where id = p_payout_id;

  if p_action = 'completed' then
    perform public.post_ledger_transaction(
      v_payout.store_id, 'payout_paid', 'payout', v_payout.id,
      'payout-paid:' || v_payout.id::text,
      jsonb_build_object('payout_id', v_payout.id, 'reference', p_reference),
      jsonb_build_array(
        jsonb_build_object('account', 'payouts', 'direction', 'debit',
          'amount', v_payout.amount, 'currency', v_payout.currency),
        jsonb_build_object('account', 'reserved', 'direction', 'credit',
          'amount', v_payout.amount, 'currency', v_payout.currency)
      )
    );
  elsif p_action = 'failed' then
    perform public.post_ledger_transaction(
      v_payout.store_id, 'payout_released', 'payout', v_payout.id,
      'payout-failed-release:' || v_payout.id::text,
      jsonb_build_object('payout_id', v_payout.id, 'reason', p_reason),
      jsonb_build_array(
        jsonb_build_object('account', 'available', 'direction', 'debit',
          'amount', v_payout.amount, 'currency', v_payout.currency),
        jsonb_build_object('account', 'reserved', 'direction', 'credit',
          'amount', v_payout.amount, 'currency', v_payout.currency)
      )
    );
  end if;

  insert into public.payout_events (payout_id, store_id, status, actor_id, note)
  values (v_payout.id, v_payout.store_id, v_status, auth.uid(), nullif(btrim(coalesce(p_reason, '')), ''));

  insert into public.platform_audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(), 'payout.' || v_status, 'payout', v_payout.id,
    jsonb_build_object('reference', p_reference, 'reason', p_reason)
  );

  return jsonb_build_object('status', v_status);
end;
$$;

revoke execute on function public.admin_transition_payout(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_transition_payout(uuid, text, text, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  RLS
 * ------------------------------------------------------------------ */

alter table public.kyc_cases enable row level security;
alter table public.kyc_events enable row level security;
alter table public.platform_audit_log enable row level security;

create policy kyc_cases_select_member on public.kyc_cases
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create policy kyc_events_select_member on public.kyc_events
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create policy audit_log_select_staff on public.platform_audit_log
  for select to authenticated
  using (public.is_platform_admin());

create policy payouts_select_staff on public.payouts
  for select to authenticated
  using (public.is_platform_admin());

create policy stores_select_staff on public.stores
  for select to authenticated
  using (public.is_platform_admin());

revoke all on public.kyc_cases from public, anon, authenticated;
revoke all on public.kyc_events from public, anon, authenticated;
revoke all on public.platform_audit_log from public, anon, authenticated;

grant select on public.kyc_cases to authenticated;
grant select on public.kyc_events to authenticated;
grant select on public.platform_audit_log to authenticated;

/* ------------------------------------------------------------------ *
 *  Premier administrateur plateforme
 * ------------------------------------------------------------------ */

insert into public.platform_admins (user_id, role)
select u.id, 'super_admin'
from auth.users u
where u.email = 'ibrahime@pashove.com'
on conflict (user_id) do nothing;
