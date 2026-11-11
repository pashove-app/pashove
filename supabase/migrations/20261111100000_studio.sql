-- PASHOVE STUDIO — Portefeuille, tarifs et historique des générations
--
-- Le Studio fonctionne avec un portefeuille libre : le marchand recharge le
-- montant qu'il veut (500 FCFA minimum) et chaque génération déduit son prix.
-- Chaque nouvelle boutique reçoit 500 FCFA de bienvenue.
--
-- Le portefeuille et l'historique sont en lecture seule pour le marchand :
-- les débits et crédits passent exclusivement par des fonctions serveur, afin
-- qu'aucun client ne puisse modifier un solde. Les tarifs sont publics pour
-- les comptes connectés, modifiables uniquement côté plateforme.

/* ------------------------------------------------------------------ *
 *  Portefeuille
 * ------------------------------------------------------------------ */

create table public.store_studio_balance (
  store_id        uuid primary key references public.stores (id) on delete cascade,
  balance_fcfa    integer not null default 0 check (balance_fcfa >= 0),
  -- Somme des recharges réellement payées (hors crédit de bienvenue).
  total_recharged integer not null default 0 check (total_recharged >= 0),
  total_spent     integer not null default 0 check (total_spent >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger store_studio_balance_touch
  before update on public.store_studio_balance
  for each row execute function public.touch_updated_at();

/* ------------------------------------------------------------------ *
 *  Tarifs
 * ------------------------------------------------------------------ */

create table public.studio_pricing (
  action_type text primary key,
  price_fcfa  integer not null check (price_fcfa >= 0),
  label       text not null,
  description text,
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create trigger studio_pricing_touch
  before update on public.studio_pricing
  for each row execute function public.touch_updated_at();

insert into public.studio_pricing (action_type, price_fcfa, label, description)
values
  ('chat_message', 5, 'Message Studio', 'Une réponse de l’assistant dans le chat.'),
  ('product_description', 5, 'Description de produit', 'Une description prête à publier.'),
  ('video_15s_simple', 150, 'Vidéo 15 s — simple', 'Format court, texte animé.'),
  ('video_30s_standard', 300, 'Vidéo 30 s — standard', 'Voix off et texte animé.'),
  ('video_60s_premium', 600, 'Vidéo 60 s — premium', 'Voix off et musique.'),
  ('video_110s_ultra', 1200, 'Vidéo 110 s — ultra', 'Motion design complet.'),
  ('video_modification', 50, 'Modification de vidéo', 'Une retouche après génération.')
on conflict (action_type) do nothing;

/* ------------------------------------------------------------------ *
 *  Historique des générations
 * ------------------------------------------------------------------ */

create table public.studio_generations (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores (id) on delete cascade,
  action_type     text not null references public.studio_pricing (action_type),
  prompt          text not null default '',
  price_paid_fcfa integer not null default 0 check (price_paid_fcfa >= 0),
  cost_real_fcfa  integer not null default 0 check (cost_real_fcfa >= 0),
  margin_fcfa     integer generated always as (price_paid_fcfa - cost_real_fcfa) stored,
  result_text     text,
  video_url       text,
  status          text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message   text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index studio_generations_store_idx
  on public.studio_generations (store_id, created_at desc);
create index studio_generations_status_idx
  on public.studio_generations (status);

/* ------------------------------------------------------------------ *
 *  Recharges (idempotence SasPay et gestes commerciaux)
 *
 *  La référence du prestataire est unique : un webhook rejoué ne peut pas
 *  créditer deux fois le même paiement.
 * ------------------------------------------------------------------ */

create table public.studio_topups (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores (id) on delete cascade,
  amount_fcfa        integer not null check (amount_fcfa > 0),
  status             text not null default 'pending'
    check (status in ('pending', 'paid', 'failed')),
  provider           text not null default 'saspay'
    check (provider in ('saspay', 'manual', 'welcome')),
  provider_reference text unique,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

create index studio_topups_store_idx
  on public.studio_topups (store_id, created_at desc);

/* ------------------------------------------------------------------ *
 *  Crédit de bienvenue : 500 FCFA par nouvelle boutique
 * ------------------------------------------------------------------ */

create or replace function public.studio_welcome_credit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.store_studio_balance (store_id, balance_fcfa, total_recharged)
  values (new.id, 500, 0)
  on conflict (store_id) do nothing;

  insert into public.studio_topups (
    store_id, amount_fcfa, status, provider, provider_reference, paid_at
  )
  values (
    new.id, 500, 'paid', 'welcome', 'welcome:' || new.id::text, now()
  )
  on conflict (provider_reference) do nothing;

  return new;
end;
$$;

revoke execute on function public.studio_welcome_credit()
  from public, anon, authenticated;

create trigger stores_studio_welcome
  after insert on public.stores
  for each row execute function public.studio_welcome_credit();

-- Boutiques déjà existantes : même crédit de bienvenue, une seule fois.
insert into public.store_studio_balance (store_id, balance_fcfa, total_recharged)
select s.id, 500, 0
from public.stores s
on conflict (store_id) do nothing;

insert into public.studio_topups (
  store_id, amount_fcfa, status, provider, provider_reference, paid_at
)
select s.id, 500, 'paid', 'welcome', 'welcome:' || s.id::text, now()
from public.stores s
on conflict (provider_reference) do nothing;

/* ------------------------------------------------------------------ *
 *  RLS — lecture seule côté marchand
 * ------------------------------------------------------------------ */

alter table public.store_studio_balance enable row level security;
alter table public.studio_pricing enable row level security;
alter table public.studio_generations enable row level security;
alter table public.studio_topups enable row level security;

revoke all on public.store_studio_balance from public, anon, authenticated;
revoke all on public.studio_pricing from public, anon, authenticated;
revoke all on public.studio_generations from public, anon, authenticated;
revoke all on public.studio_topups from public, anon, authenticated;

grant select on public.store_studio_balance to authenticated;
grant select on public.studio_pricing to authenticated;
grant select on public.studio_generations to authenticated;
grant select on public.studio_topups to authenticated;

create policy store_studio_balance_select on public.store_studio_balance
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create policy studio_pricing_select on public.studio_pricing
  for select to authenticated
  using (true);

create policy studio_generations_select on public.studio_generations
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create policy studio_topups_select on public.studio_topups
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());
