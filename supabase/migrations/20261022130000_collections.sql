-- Collections marchandes : curation de produits, publiées à la demande.

create table public.collections (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  name           text not null
    check (char_length(btrim(name)) between 2 and 80),
  slug           text not null
    check (slug ~ '^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$'),
  description    text check (description is null or char_length(description) <= 500),
  image_media_id uuid references public.media_assets (id) on delete set null,
  is_published   boolean not null default false,
  position       integer not null default 0 check (position >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (store_id, slug)
);

create index collections_store_created_idx
  on public.collections (store_id, created_at desc);

create trigger collections_touch_updated_at
  before update on public.collections
  for each row execute function public.touch_updated_at();

create table public.collection_products (
  store_id      uuid not null references public.stores (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  position      integer not null default 0 check (position >= 0),

  primary key (collection_id, product_id)
);

create index collection_products_product_idx
  on public.collection_products (product_id);

create or replace function public.collection_products_assign_store()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid;
begin
  select c.store_id into v_store
  from public.collections c
  where c.id = new.collection_id;

  if v_store is null then
    raise exception 'invalid_collection' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.store_id = v_store
  ) then
    raise exception 'invalid_product' using errcode = '22023';
  end if;

  new.store_id := v_store;
  return new;
end;
$$;

revoke execute on function public.collection_products_assign_store()
  from public, anon, authenticated;

create trigger collection_products_assign_store
  before insert or update on public.collection_products
  for each row execute function public.collection_products_assign_store();

/* ------------------------------------------------------------------ *
 *  Appartenance et visibilité
 * ------------------------------------------------------------------ */

create or replace function public.owns_collection(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.collections c
    where c.id = target
      and public.is_store_member(c.store_id)
  );
$$;

create or replace function public.is_public_collection(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.collections c
    where c.id = target
      and c.is_published
      and public.is_public_store(c.store_id)
  );
$$;

revoke execute on function public.owns_collection(uuid)
  from public, anon, authenticated;
grant execute on function public.owns_collection(uuid) to authenticated;

revoke execute on function public.is_public_collection(uuid)
  from public, anon, authenticated;
grant execute on function public.is_public_collection(uuid) to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Politiques
 * ------------------------------------------------------------------ */

alter table public.collections enable row level security;
alter table public.collection_products enable row level security;

create policy collections_select_member on public.collections
  for select to authenticated
  using (public.is_store_member(store_id));

create policy collections_insert_member on public.collections
  for insert to authenticated
  with check (public.is_store_member(store_id));

create policy collections_update_member on public.collections
  for update to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy collections_delete_member on public.collections
  for delete to authenticated
  using (public.is_store_member(store_id));

create policy collections_select_public on public.collections
  for select to anon, authenticated
  using (is_published and public.is_public_store(store_id));

create policy collection_products_select_member on public.collection_products
  for select to authenticated
  using (public.owns_collection(collection_id));

create policy collection_products_insert_member on public.collection_products
  for insert to authenticated
  with check (public.owns_collection(collection_id));

create policy collection_products_update_member on public.collection_products
  for update to authenticated
  using (public.owns_collection(collection_id))
  with check (public.owns_collection(collection_id));

create policy collection_products_delete_member on public.collection_products
  for delete to authenticated
  using (public.owns_collection(collection_id));

create policy collection_products_select_public on public.collection_products
  for select to anon, authenticated
  using (public.is_public_collection(collection_id));

/* ------------------------------------------------------------------ *
 *  Enregistrement atomique
 * ------------------------------------------------------------------ */

create or replace function public.save_collection(
  p_collection_id uuid,
  p_store_id      uuid,
  p_name          text,
  p_slug          text,
  p_description   text,
  p_image_media_id uuid,
  p_is_published  boolean,
  p_product_ids   uuid[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id       uuid;
  v_existing public.collections%rowtype;
begin
  if p_image_media_id is not null and not exists (
    select 1
    from public.media_assets a
    where a.id = p_image_media_id
      and a.store_id = p_store_id
      and a.kind = 'product'
  ) then
    raise exception 'invalid_media' using errcode = '22023';
  end if;

  if p_product_ids is not null then
    if (select count(*) from unnest(p_product_ids) as id)
       <> (select count(distinct id) from unnest(p_product_ids) as id) then
      raise exception 'invalid_products' using errcode = '22023';
    end if;

    if exists (
      select 1
      from unnest(p_product_ids) as id
      where not exists (
        select 1
        from public.products p
        where p.id = id
          and p.store_id = p_store_id
      )
    ) then
      raise exception 'invalid_products' using errcode = '22023';
    end if;
  end if;

  if p_is_published
     and (p_product_ids is null or array_length(p_product_ids, 1) is null) then
    raise exception 'collection_empty' using errcode = '22023';
  end if;

  if p_collection_id is null then
    insert into public.collections (
      store_id, name, slug, description, image_media_id, is_published
    )
    values (
      p_store_id,
      btrim(p_name),
      lower(btrim(p_slug)),
      nullif(btrim(coalesce(p_description, '')), ''),
      p_image_media_id,
      p_is_published
    )
    returning id into v_id;
  else
    if not public.owns_collection(p_collection_id) then
      raise exception 'not_owner' using errcode = '42501';
    end if;

    select c.* into v_existing
    from public.collections c
    where c.id = p_collection_id
      and c.store_id = p_store_id;

    if v_existing.id is null then
      raise exception 'not_owner' using errcode = '42501';
    end if;

    update public.collections
    set name = btrim(p_name),
        slug = lower(btrim(p_slug)),
        description = nullif(btrim(coalesce(p_description, '')), ''),
        image_media_id = p_image_media_id,
        is_published = p_is_published
    where id = p_collection_id;

    delete from public.collection_products
    where collection_id = p_collection_id;

    v_id := p_collection_id;
  end if;

  if p_product_ids is not null then
    insert into public.collection_products (collection_id, product_id, position)
    select v_id, item.id, (item.ord - 1)::int
    from unnest(p_product_ids) with ordinality as item(id, ord);
  end if;

  return v_id;
end;
$$;

revoke execute on function public.save_collection(
  uuid, uuid, text, text, text, uuid, boolean, uuid[]
) from public, anon, authenticated;
grant execute on function public.save_collection(
  uuid, uuid, text, text, text, uuid, boolean, uuid[]
) to authenticated;
