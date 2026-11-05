-- E1 : e-mails transactionnels.
--
-- Deux tables seulement. `store_email_preferences` est lisible par la vitrine :
-- l'acheteur anonyme doit savoir si le marchand veut être prévenu d'une
-- nouvelle commande. Elle ne contient que des booléens, jamais d'adresse.
--
-- `email_messages` est la boîte d'envoi interne : chaque e-mail y laisse une
-- trace, avec son statut et ses tentatives, pour que la console d'administration
-- puisse diagnostiquer un envoi manquant. Aucun rôle applicatif ne peut la lire
-- en dehors des administrateurs plateforme ; le service role seul y écrit.

create table if not exists public.store_email_preferences (
  store_id   uuid not null references public.stores (id) on delete cascade,
  kind       text not null
    check (kind in ('new_order', 'order_cancelled', 'kyc', 'payout')),
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (store_id, kind)
);

alter table public.store_email_preferences enable row level security;

create policy store_email_preferences_read
  on public.store_email_preferences
  for select to anon, authenticated
  using (true);

create policy store_email_preferences_write
  on public.store_email_preferences
  for all to authenticated
  using (
    public.has_store_role(
      store_id,
      array['owner', 'admin']::public.store_role[]
    )
  )
  with check (
    public.has_store_role(
      store_id,
      array['owner', 'admin']::public.store_role[]
    )
  );

grant select on public.store_email_preferences to anon, authenticated;
grant insert, update, delete on public.store_email_preferences to authenticated;

create table if not exists public.email_messages (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid references public.stores (id) on delete set null,
  template     text not null,
  recipient    text not null,
  subject      text not null,
  html         text not null,
  text_body    text,
  status       text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempts     integer not null default 0 check (attempts >= 0),
  last_error   text,
  provider     text,
  provider_id  text,
  scheduled_at timestamptz not null default now(),
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists email_messages_queue_idx
  on public.email_messages (status, scheduled_at);

create index if not exists email_messages_created_idx
  on public.email_messages (created_at desc);

alter table public.email_messages enable row level security;
revoke all on public.email_messages from public, anon, authenticated;

create policy email_messages_admin_read
  on public.email_messages
  for select to authenticated
  using (public.is_platform_admin());

grant select on public.email_messages to authenticated;

/* ------------------------------------------------------------------ *
 *  Réglages par défaut : tout est activé tant que le marchand n'a rien
 *  changé. On n'insère aucune ligne ici — l'absence de ligne vaut `true`,
 *  ce qui évite de remplir la table à chaque création de boutique.
 * ------------------------------------------------------------------ */
