-- Produits et images de produits.

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 2 and 120),
  -- Identifiant public du produit dans l'URL de la boutique.
  slug         text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$'),
  description  text check (description is null or char_length(description) <= 5000),
  -- Unité mineure de la devise de la boutique : le franc pour XOF, le centime
  -- pour EUR et USD. Jamais de flottant.
  price_amount integer not null check (price_amount >= 0),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (store_id, slug)
);

create index products_store_created_idx
  on public.products (store_id, created_at desc);

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- Une galerie, même si l'interface n'en montre qu'une image pour l'instant :
-- la position 0 est l'image principale.
create table public.product_images (
  product_id uuid not null references public.products (id) on delete cascade,
  media_id   uuid not null references public.media_assets (id) on delete cascade,
  position   integer not null default 0 check (position >= 0),

  primary key (product_id, media_id)
);

/* ------------------------------------------------------------------ *
 *  Appartenance et visibilité
 *
 *  `security definer` : les politiques de `product_images` interrogent les
 *  produits sans repasser par la RLS de `products`, ce qui évite deux couches
 *  de politiques pour une seule décision.
 * ------------------------------------------------------------------ */

create or replace function public.owns_product(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    where p.id = target
      and public.is_store_member(p.store_id)
  );
$$;

create or replace function public.is_public_product(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    where p.id = target
      and p.status = 'published'
      and public.is_public_store(p.store_id)
  );
$$;

revoke execute on function public.owns_product(uuid) from public, anon, authenticated;
grant execute on function public.owns_product(uuid) to authenticated;

revoke execute on function public.is_public_product(uuid) from public, anon, authenticated;
grant execute on function public.is_public_product(uuid) to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Création atomique
 *
 *  Le produit et son image naissent dans la même transaction : pas de fiche
 *  sans image si le second insert échoue. La fonction s'exécute avec les
 *  droits de l'appelant, donc les politiques RLS s'appliquent — et le
 *  `store_id` fourni ne peut pas désigner la boutique d'un autre.
 * ------------------------------------------------------------------ */

create or replace function public.create_product(
  p_store_id     uuid,
  p_name         text,
  p_slug         text,
  p_description  text,
  p_price_amount integer,
  p_status       text,
  p_media_id     uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_media_id is not null then
    if not exists (
      select 1
      from public.media_assets m
      where m.id = p_media_id
        and m.store_id = p_store_id
        and m.kind = 'product'
    ) then
      raise exception 'invalid_media' using errcode = '22023';
    end if;
  end if;

  insert into public.products (
    store_id, name, slug, description, price_amount, status, published_at
  )
  values (
    p_store_id,
    btrim(p_name),
    lower(btrim(p_slug)),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_price_amount,
    p_status,
    case when p_status = 'published' then now() else null end
  )
  returning id into v_id;

  if p_media_id is not null then
    insert into public.product_images (product_id, media_id, position)
    values (v_id, p_media_id, 0);
  end if;

  return v_id;
end;
$$;

revoke execute on function public.create_product(uuid, text, text, text, integer, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_product(uuid, text, text, text, integer, text, uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Politiques
 * ------------------------------------------------------------------ */

alter table public.products enable row level security;

create policy products_select_member on public.products
  for select to authenticated
  using (public.is_store_member(store_id));

create policy products_insert_member on public.products
  for insert to authenticated
  with check (public.is_store_member(store_id));

create policy products_update_member on public.products
  for update to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy products_delete_member on public.products
  for delete to authenticated
  using (public.is_store_member(store_id));

-- Vitrine : un produit n'est public que s'il est publié dans une boutique
-- ouverte. Un brouillon reste invisible, y compris à qui en devine l'URL.
create policy products_select_public on public.products
  for select to anon, authenticated
  using (status = 'published' and public.is_public_store(store_id));

alter table public.product_images enable row level security;

create policy product_images_select_member on public.product_images
  for select to authenticated
  using (public.owns_product(product_id));

create policy product_images_insert_member on public.product_images
  for insert to authenticated
  with check (public.owns_product(product_id));

create policy product_images_delete_member on public.product_images
  for delete to authenticated
  using (public.owns_product(product_id));

create policy product_images_select_public on public.product_images
  for select to anon, authenticated
  using (public.is_public_product(product_id));
