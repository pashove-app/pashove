-- PASHOVE — Support structuré : tickets, SLA, macros et base de connaissances
--
-- Les conversations instantanées existent déjà. Ce module ajoute des tickets
-- suivis avec priorité, échéance SLA, fil de messages et statut. Les macros et
-- articles sont gérés par la plateforme.

create table public.support_tickets (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores (id) on delete cascade,
  opened_by         uuid references auth.users (id) on delete set null,
  subject           text not null check (char_length(btrim(subject)) between 4 and 140),
  category          text not null default 'other'
    check (category in ('payments', 'orders', 'inventory', 'delivery', 'account', 'other')),
  priority          text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status            text not null default 'open'
    check (status in ('open', 'pending', 'resolved', 'closed')),
  assigned_to       uuid references auth.users (id) on delete set null,
  sla_due_at        timestamptz not null,
  first_response_at timestamptz,
  resolved_at       timestamptz,
  last_message_at   timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index support_tickets_store_idx
  on public.support_tickets (store_id, created_at desc);
create index support_tickets_status_idx
  on public.support_tickets (status, sla_due_at);

alter table public.support_tickets enable row level security;
revoke all on public.support_tickets from public, anon, authenticated;
grant select on public.support_tickets to authenticated;

create policy support_tickets_select on public.support_tickets
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create table public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  store_id    uuid not null references public.stores (id) on delete cascade,
  author_id   uuid references auth.users (id) on delete set null,
  author_role text not null check (author_role in ('merchant', 'admin', 'system')),
  body        text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create index support_messages_ticket_idx
  on public.support_messages (ticket_id, created_at);

alter table public.support_messages enable row level security;
revoke all on public.support_messages from public, anon, authenticated;
grant select on public.support_messages to authenticated;

create policy support_messages_select on public.support_messages
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create table public.support_macros (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(btrim(title)) between 2 and 80),
  body       text not null check (char_length(btrim(body)) between 2 and 4000),
  category   text not null default 'other'
    check (category in ('payments', 'orders', 'inventory', 'delivery', 'account', 'other')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_macros enable row level security;
revoke all on public.support_macros from public, anon, authenticated;
grant select, insert, update, delete on public.support_macros to authenticated;

create policy support_macros_admin on public.support_macros
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create table public.support_articles (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique
    check (slug ~ '^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$'),
  title      text not null check (char_length(btrim(title)) between 3 and 140),
  excerpt    text check (excerpt is null or char_length(excerpt) <= 300),
  body       text not null check (char_length(btrim(body)) between 10 and 20000),
  category   text not null default 'other'
    check (category in ('payments', 'orders', 'inventory', 'delivery', 'account', 'other')),
  published  boolean not null default true,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_articles enable row level security;
revoke all on public.support_articles from public, anon, authenticated;
grant select on public.support_articles to anon, authenticated;
grant insert, update, delete on public.support_articles to authenticated;

create policy support_articles_read on public.support_articles
  for select to anon, authenticated
  using (published or public.is_platform_admin());

create policy support_articles_admin on public.support_articles
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

/* ------------------------------------------------------------------ *
 *  Tickets
 * ------------------------------------------------------------------ */

create or replace function public.create_support_ticket(
  p_store_id uuid,
  p_subject  text,
  p_category text,
  p_priority text,
  p_body     text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subject  text := btrim(coalesce(p_subject, ''));
  v_category text := coalesce(p_category, 'other');
  v_priority text := coalesce(p_priority, 'normal');
  v_body     text := btrim(coalesce(p_body, ''));
  v_hours    integer;
  v_ticket   uuid;
  v_open     integer;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if char_length(v_subject) < 4 or char_length(v_subject) > 140 then
    raise exception 'subject_invalid' using errcode = '22023';
  end if;

  if char_length(v_body) < 2 or char_length(v_body) > 4000 then
    raise exception 'message_invalid' using errcode = '22023';
  end if;

  if v_category not in ('payments', 'orders', 'inventory', 'delivery', 'account', 'other') then
    raise exception 'category_invalid' using errcode = '22023';
  end if;

  if v_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'priority_invalid' using errcode = '22023';
  end if;

  select count(*) into v_open
  from public.support_tickets t
  where t.store_id = p_store_id and t.status in ('open', 'pending');

  if v_open >= 10 then
    raise exception 'too_many_tickets' using errcode = '22023';
  end if;

  v_hours := case v_priority
    when 'urgent' then 4
    when 'high' then 8
    when 'normal' then 24
    else 48
  end;

  insert into public.support_tickets (
    store_id, opened_by, subject, category, priority, sla_due_at
  )
  values (
    p_store_id, (select auth.uid()), v_subject, v_category, v_priority,
    now() + make_interval(hours => v_hours)
  )
  returning id into v_ticket;

  insert into public.support_messages (ticket_id, store_id, author_id, author_role, body)
  values (v_ticket, p_store_id, (select auth.uid()), 'merchant', v_body);

  return v_ticket;
end;
$$;

revoke execute on function public.create_support_ticket(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_support_ticket(uuid, text, text, text, text)
  to authenticated;

create or replace function public.reply_support_ticket(
  p_ticket_id uuid,
  p_body      text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_body   text := btrim(coalesce(p_body, ''));
  v_admin  boolean := public.is_platform_admin();
begin
  select * into v_ticket
  from public.support_tickets t
  where t.id = p_ticket_id
  for update;

  if v_ticket.id is null then
    raise exception 'ticket_unknown' using errcode = '22023';
  end if;

  if not v_admin and not public.is_store_member(v_ticket.store_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if char_length(v_body) < 1 or char_length(v_body) > 4000 then
    raise exception 'message_invalid' using errcode = '22023';
  end if;

  if not v_admin and v_ticket.status = 'closed' then
    raise exception 'ticket_closed' using errcode = '22023';
  end if;

  insert into public.support_messages (ticket_id, store_id, author_id, author_role, body)
  values (
    v_ticket.id, v_ticket.store_id, (select auth.uid()),
    case when v_admin then 'admin' else 'merchant' end,
    v_body
  );

  update public.support_tickets
  set last_message_at = now(),
      updated_at = now(),
      status = case
        when v_admin and status = 'open' then 'pending'
        when not v_admin and status in ('pending', 'resolved') then 'open'
        else status
      end,
      first_response_at = case
        when v_admin and first_response_at is null then now()
        else first_response_at
      end,
      resolved_at = case
        when not v_admin and status in ('pending', 'resolved') then null
        else resolved_at
      end
  where id = v_ticket.id;

  if v_admin then
    perform public.notify_store_members(
      v_ticket.store_id,
      'support_reply',
      'Réponse du support Pashove',
      left(v_body, 140),
      '/app/support/tickets/' || v_ticket.id::text
    );
  end if;
end;
$$;

revoke execute on function public.reply_support_ticket(uuid, text)
  from public, anon, authenticated;
grant execute on function public.reply_support_ticket(uuid, text)
  to authenticated;

create or replace function public.set_support_ticket_status(
  p_ticket_id uuid,
  p_status    text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_admin  boolean := public.is_platform_admin();
begin
  if p_status not in ('open', 'pending', 'resolved', 'closed') then
    raise exception 'status_invalid' using errcode = '22023';
  end if;

  select * into v_ticket from public.support_tickets t where t.id = p_ticket_id;
  if v_ticket.id is null then
    raise exception 'ticket_unknown' using errcode = '22023';
  end if;

  if not v_admin and not public.is_store_member(v_ticket.store_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if not v_admin and p_status not in ('resolved', 'closed', 'open') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  update public.support_tickets
  set status = p_status,
      resolved_at = case
        when p_status in ('resolved', 'closed') then coalesce(resolved_at, now())
        else null
      end,
      updated_at = now()
  where id = p_ticket_id;
end;
$$;

revoke execute on function public.set_support_ticket_status(uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_support_ticket_status(uuid, text)
  to authenticated;

create or replace function public.assign_support_ticket(
  p_ticket_id uuid,
  p_admin_id  uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  update public.support_tickets
  set assigned_to = p_admin_id, updated_at = now()
  where id = p_ticket_id;

  if not found then
    raise exception 'ticket_unknown' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.assign_support_ticket(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.assign_support_ticket(uuid, uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Base de connaissances initiale
 * ------------------------------------------------------------------ */

insert into public.support_articles (slug, title, excerpt, body, category, position)
values
  (
    'recevoir-ses-paiements',
    'Recevoir ses paiements',
    'Comment fonctionnent les retraits et la réserve de remboursement.',
    E'## Quand l''argent devient retirable\n\nLes paiements en ligne sont encaissés par le prestataire, puis crédités sur ton solde disponible. Le premier retrait exige un KYC approuvé.\n\n## Réserve de remboursement\n\n5 % du chiffre d''affaires des 30 derniers jours restent immobilisés pour couvrir d''éventuels retours. Le montant retirable affiché dans Finance tient déjà compte de cette réserve.\n\n## Délais\n\nUne demande de retrait est exécutée par l''équipe Pashove. Tu reçois une notification à chaque changement de statut.',
    'payments',
    0
  ),
  (
    'rembourser-une-commande',
    'Rembourser une commande',
    'Remboursement total ou partiel, stock et écritures comptables.',
    E'## Remboursement partiel\n\nOuvre la commande, choisis « Rembourser des articles », sélectionne les lignes et les quantités. Le montant est calculé côté serveur, remise au prorata comprise.\n\n## Confirmation\n\nSasPay n''expose pas d''API de remboursement : l''équipe Pashove exécute l''opération puis confirme la référence. Le stock physique est alors rendu et les écritures compensatoires sont postées.\n\n## Journal\n\nLe ledger reste immuable. Un remboursement crée une nouvelle transaction, jamais une modification de l''ancienne.',
    'orders',
    1
  ),
  (
    'corriger-le-stock',
    'Corriger le stock',
    'Mouvements manuels, emplacements et alertes.',
    E'## Mouvement manuel\n\nDans Inventaire, choisis le produit et la variante, puis saisis une quantité positive (ajout) ou négative (retrait). Chaque mouvement est conservé.\n\n## Seuil d''alerte\n\nUn produit dont le stock atteint son seuil apparaît dans les alertes. Une rupture est signalée en rouge.\n\n## Export\n\nLe bouton CSV exporte une ligne par variante, avec SKU, stock, seuil et état.',
    'inventory',
    2
  )
on conflict (slug) do nothing;
