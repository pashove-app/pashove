-- Socle des boutiques.
--
-- La boutique est le locataire (*tenant*) de la plateforme : toute donnée
-- marchande portera son `store_id`. L'isolation vit **en base**, par RLS, et
-- jamais dans le code applicatif — un `store_id` venu du client n'est jamais
-- digne de confiance (règle 2 du projet).

create type public.store_role as enum ('owner', 'admin', 'staff');
create type public.store_status as enum ('draft', 'active', 'suspended');

create table public.stores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 2 and 80),
  -- Identifiant public, appelé à devenir le sous-domaine `slug.pashove.com`.
  slug       text not null unique
             check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$'),
  country    text not null check (country ~ '^[A-Z]{2}$'),
  currency   text not null default 'XOF' check (currency ~ '^[A-Z]{3}$'),
  -- Renseigné à l'étape « catégorie » de l'onboarding.
  category   text,
  status     public.store_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_members (
  store_id   uuid not null references public.stores (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.store_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create index store_members_user_idx on public.store_members (user_id);

/* ------------------------------------------------------------------ *
 *  Appartenance
 *
 *  `security definer` : ces fonctions lisent `store_members` en contournant
 *  RLS, sans quoi une politique posée sur cette table se rappellerait
 *  elle-même à l'infini. Elles ne renvoient qu'un booléen, jamais une ligne,
 *  et se limitent à l'utilisateur de la requête (`auth.uid()`).
 * ------------------------------------------------------------------ */

create or replace function public.is_store_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members m
    where m.store_id = target
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_store_role(target uuid, roles public.store_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members m
    where m.store_id = target
      and m.user_id = (select auth.uid())
      and m.role = any (roles)
  );
$$;

/* ------------------------------------------------------------------ *
 *  Création
 *
 *  Seule voie d'écriture vers `stores` : aucune politique
 *  d'insertion n'existe sur `stores`, donc un client ne peut pas fabriquer une
 *  boutique orpheline ni s'attribuer celle d'un autre. La boutique et son
 *  propriétaire naissent dans la même transaction.
 * ------------------------------------------------------------------ */

create or replace function public.create_store(
  p_name     text,
  p_slug     text,
  p_country  text,
  p_currency text default 'XOF'
)
returns public.stores
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := (select auth.uid());
  v_store public.stores;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.stores (name, slug, country, currency)
  values (
    btrim(p_name),
    lower(btrim(p_slug)),
    upper(btrim(p_country)),
    upper(btrim(p_currency))
  )
  returning * into v_store;

  insert into public.store_members (store_id, user_id, role)
  values (v_store.id, v_user, 'owner');

  return v_store;
end;
$$;

-- La boutique appartient à la plateforme, pas à un utilisateur anonyme.
revoke execute on function public.create_store(text, text, text, text) from anon;

/* ------------------------------------------------------------------ *
 *  Horodatage
 * ------------------------------------------------------------------ */

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger stores_touch_updated_at
  before update on public.stores
  for each row execute function public.touch_updated_at();

/* ------------------------------------------------------------------ *
 *  Politiques
 * ------------------------------------------------------------------ */

alter table public.stores enable row level security;
alter table public.store_members enable row level security;

-- Un membre voit sa boutique, et rien d'autre.
create policy stores_select_member on public.stores
  for select to authenticated
  using (public.is_store_member(id));

-- Pas de politique d'insertion ni de suppression : la création passe par
-- `create_store()`, la fermeture par une écriture d'administration.
create policy stores_update_admin on public.stores
  for update to authenticated
  using (public.has_store_role(id, array['owner', 'admin']::public.store_role[]))
  with check (public.has_store_role(id, array['owner', 'admin']::public.store_role[]));

-- L'équipe d'une boutique se lit depuis la boutique, jamais depuis la table
-- entière : sans cette restriction, un marchand lirait la liste des membres de
-- toutes les boutiques de la plateforme.
create policy store_members_select_member on public.store_members
  for select to authenticated
  using (public.is_store_member(store_id));
