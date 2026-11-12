-- PASHOVE — Centre de notifications in-app
--
-- Les événements métier importants créent une notification pour chaque membre
-- de la boutique concernée : commande payée, remboursement, retrait, KYC.
-- La lecture est personnelle ; l'écriture reste serveur.

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  store_id   uuid references public.stores (id) on delete cascade,
  type       text not null,
  title      text not null check (char_length(title) between 1 and 160),
  body       text,
  href       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index notifications_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;

create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
  set read_at = now()
  where user_id = (select auth.uid())
    and read_at is null
    and (p_ids is null or id = any (p_ids));
end;
$$;

revoke execute on function public.mark_notifications_read(uuid[])
  from public, anon, authenticated;
grant execute on function public.mark_notifications_read(uuid[])
  to authenticated;

create or replace function public.notify_store_members(
  p_store_id uuid,
  p_type     text,
  p_title    text,
  p_body     text default null,
  p_href     text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, store_id, type, title, body, href)
  select sm.user_id, p_store_id, p_type, p_title, p_body, p_href
  from public.store_members sm
  where sm.store_id = p_store_id;
$$;

revoke execute on function public.notify_store_members(uuid, text, text, text, text)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Commandes et remboursements
 * ------------------------------------------------------------------ */

create or replace function public.notify_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_number integer;
  v_total  integer;
  v_title  text;
  v_body   text;
  v_type   text := new.type;
begin
  if v_type not in ('payment_collected', 'refund_requested', 'refunded') then
    return new;
  end if;

  select o.number, o.total_amount into v_number, v_total
  from public.orders o
  where o.id = new.order_id;

  if v_type = 'payment_collected' then
    v_title := 'Nouvelle commande payée';
    v_body := 'Commande #' || coalesce(v_number, 0)::text || ' · ' || coalesce(v_total, 0)::text || ' FCFA';
  elsif v_type = 'refund_requested' then
    v_title := 'Demande de remboursement';
    v_body := 'Commande #' || coalesce(v_number, 0)::text || ' : une demande attend la confirmation SasPay.';
  else
    v_title := 'Commande remboursée';
    v_body := 'Commande #' || coalesce(v_number, 0)::text || ' remboursée.';
  end if;

  perform public.notify_store_members(
    new.store_id,
    v_type,
    v_title,
    v_body,
    '/app/orders/' || new.order_id::text
  );

  return new;
end;
$$;

revoke execute on function public.notify_order_event()
  from public, anon, authenticated;

drop trigger if exists order_events_notify on public.order_events;
create trigger order_events_notify
  after insert on public.order_events
  for each row execute function public.notify_order_event();

/* ------------------------------------------------------------------ *
 *  Retraits
 * ------------------------------------------------------------------ */

create or replace function public.notify_payout_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  if tg_op = 'INSERT' then
    perform public.notify_store_members(
      new.store_id, 'payout_requested', 'Demande de retrait enregistrée',
      'Montant : ' || new.amount::text || ' ' || new.currency,
      '/app/finance/payouts'
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'paid' then
      v_title := 'Retrait payé';
    elsif new.status = 'failed' then
      v_title := 'Retrait échoué';
    else
      return new;
    end if;

    perform public.notify_store_members(
      new.store_id, 'payout_' || new.status, v_title,
      'Montant : ' || new.amount::text || ' ' || new.currency,
      '/app/finance/payouts'
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.notify_payout_event()
  from public, anon, authenticated;

drop trigger if exists payouts_notify on public.payouts;
create trigger payouts_notify
  after insert or update on public.payouts
  for each row execute function public.notify_payout_event();

/* ------------------------------------------------------------------ *
 *  KYC
 * ------------------------------------------------------------------ */

create or replace function public.notify_kyc_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'approved' then
    perform public.notify_store_members(
      new.store_id, 'kyc_approved', 'Vérification approuvée',
      'Ton KYC est validé. Tu peux demander un retrait.',
      '/app/finance/kyc'
    );
  elsif new.status in ('rejected', 'resubmission_required') then
    perform public.notify_store_members(
      new.store_id, 'kyc_action', 'Vérification à corriger',
      coalesce(new.rejection_reason, 'Ouvre ton dossier KYC pour connaître le motif.'),
      '/app/finance/kyc'
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.notify_kyc_event()
  from public, anon, authenticated;

drop trigger if exists kyc_cases_notify on public.kyc_cases;
create trigger kyc_cases_notify
  after update on public.kyc_cases
  for each row execute function public.notify_kyc_event();
