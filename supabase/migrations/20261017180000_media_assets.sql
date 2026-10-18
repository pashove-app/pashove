-- Médias : les images vivent sur R2, la base ne garde que la référence.
--
-- Une ligne décrit un objet du bucket : sa clé, son type, sa taille. L'URL
-- publique se déduit de la clé — changer de domaine de diffusion ne demandera
-- donc aucune migration.

create table public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  kind         text not null check (kind in ('logo', 'banner', 'product')),
  object_key   text not null unique,
  content_type text not null,
  size_bytes   integer not null check (size_bytes > 0),
  width        integer check (width is null or width > 0),
  height       integer check (height is null or height > 0),
  created_at   timestamptz not null default now()
);

create index media_assets_store_idx on public.media_assets (store_id);

alter table public.stores
  add column logo_media_id uuid references public.media_assets (id) on delete set null,
  add column banner_media_id uuid references public.media_assets (id) on delete set null;

-- Les adresses collées à la main disparaissent : l'import devient la seule
-- voie. Leurs contraintes de forme tombent avec les colonnes.
alter table public.stores
  drop column logo_url,
  drop column banner_url;

alter table public.media_assets enable row level security;

-- Les membres gèrent les médias de leur boutique. Pas de politique de mise à
-- jour : une image se remplace, elle ne se modifie pas.
create policy media_assets_select_member on public.media_assets
  for select to authenticated
  using (public.is_store_member(store_id));

create policy media_assets_insert_member on public.media_assets
  for insert to authenticated
  with check (public.is_store_member(store_id));

create policy media_assets_delete_member on public.media_assets
  for delete to authenticated
  using (public.is_store_member(store_id));

-- La vitrine lit les médias d'une boutique ouverte, et seulement ceux-là.
create policy media_assets_select_public on public.media_assets
  for select to anon, authenticated
  using (public.is_public_store(store_id));
