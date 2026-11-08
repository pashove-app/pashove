-- PASHOVE — Domaines personnalisés des boutiques
--
-- Un domaine est ajouté au projet Vercel par le serveur (jamais par le client),
-- puis vérifié par un enregistrement TXT. Tant que la vérification ou la
-- configuration DNS n'est pas terminée, `resolve_store_domain` ne renvoie rien :
-- le domaine ne peut pas servir une boutique par erreur.
--
-- Le sous-domaine gratuit `slug.pashove.com` ne passe pas par cette table : il
-- se déduit du slug de la boutique.

create table if not exists public.store_domains (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null unique references public.stores (id) on delete cascade,
  domain          text not null unique
    check (domain = lower(btrim(domain)) and char_length(domain) between 4 and 253),
  apex_name       text,
  status          text not null default 'pending'
    check (status in ('pending', 'verified', 'error')),
  verification    jsonb not null default '[]'::jsonb,
  dns             jsonb,
  last_error      text,
  last_checked_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists store_domains_status_idx
  on public.store_domains (status, updated_at);

alter table public.store_domains enable row level security;

drop policy if exists store_domains_select on public.store_domains;
create policy store_domains_select on public.store_domains
  for select to authenticated
  using (public.is_store_member(store_id));

drop policy if exists store_domains_insert on public.store_domains;
create policy store_domains_insert on public.store_domains
  for insert to authenticated
  with check (
    public.has_store_role(store_id, array['owner']::public.store_role[])
  );

drop policy if exists store_domains_update on public.store_domains;
create policy store_domains_update on public.store_domains
  for update to authenticated
  using (
    public.has_store_role(store_id, array['owner']::public.store_role[])
  )
  with check (
    public.has_store_role(store_id, array['owner']::public.store_role[])
  );

drop policy if exists store_domains_delete on public.store_domains;
create policy store_domains_delete on public.store_domains
  for delete to authenticated
  using (
    public.has_store_role(store_id, array['owner']::public.store_role[])
  );

revoke all on public.store_domains from public, anon, authenticated;
grant select, insert, update, delete on public.store_domains to authenticated;

/* Le cron de vérification et la résolution de domaine passent par le service. */
grant select, update on public.store_domains to service_role;

/* ------------------------------------------------------------------ *
 *  Résolution pour le proxy
 * ------------------------------------------------------------------ */

create or replace function public.resolve_store_domain(p_domain text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.slug
  from public.store_domains d
  join public.stores s on s.id = d.store_id
  where d.domain = lower(btrim(coalesce(p_domain, '')))
    and d.status = 'verified'
    and s.status = 'active'
  limit 1;
$$;

revoke execute on function public.resolve_store_domain(text)
  from public, anon, authenticated;
grant execute on function public.resolve_store_domain(text)
  to anon, authenticated;
