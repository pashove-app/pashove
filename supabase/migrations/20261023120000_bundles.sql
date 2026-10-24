-- Paquets : deux ou trois produits (variante comprise) vendus ensemble à un
-- prix inférieur à la somme de leurs prix. L'achat arrive en B3 ; ce lot pose
-- le modèle, les écrans et les règles de prix.

create table public.bundles (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  name           text not null
    check (char_length(btrim(name)) between 2 and 120),
  slug           text not null
    check (slug ~ '^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$'),
  description    text check (description is null or char_length(description) <= 1000),
  image_media_id uuid references public.media_assets (id) on delete set null,
  -- Unité mineure, comme les produits. Toujours strictement inférieur à la
  -- somme des articles, vérifié par la RPC et à chaque écriture.
  price_amount   integer not null check (price_amount > 0),
  status         text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (store_id, slug)
);

create index bundles_store_created_idx
  on public.bundles (store_id, created_at desc);

create trigger bundles_touch_updated_at
  before update on public.bundles
  for each row execute function public.touch_updated_at();

create table public.bundle_items (
  store_id   uuid not null references public.stores (id) on delete cascade,
  bundle_id  uuid not null references public.bundles (id) on delete cascade,
  -- Un produit lié ne peut pas être supprimé : le marchand doit d'abord le
  -- retirer du paquet. NO ACTION laisse les suppressions en cascade d'une
  -- boutique aboutir, puis vérifie à la fin de l'instruction.
  product_id uuid not null references public.products (id) on delete no action,
  variant_id uuid references public.product_variants (id) on delete no action,
  position   smallint not null check (position between 0 and 2),

  primary key (bundle_id, position)
);

create unique index bundle_items_unique
  on public.bundle_items (bundle_id, product_id, variant_id) nulls not distinct;

create index bundle_items_product_idx
  on public.bundle_items (product_id);

create index bundle_items_variant_idx
  on public.bundle_items (variant_id);

create or replace function public.bundle_items_assign_store()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid;
begin
  select b.store_id into v_store
  from public.bundles b
  where b.id = new.bundle_id;

  if v_store is null then
    raise exception 'invalid_bundle' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.store_id = v_store
  ) then
    raise exception 'invalid_product' using errcode = '22023';
  end if;

  if new.variant_id is not null and not exists (
    select 1
    from public.product_variants v
    where v.id = new.variant_id
      and v.product_id = new.product_id
      and v.store_id = v_store
  ) then
    raise exception 'invalid_variant' using errcode = '22023';
  end if;

  new.store_id := v_store;
  return new;
end;
$$;

revoke execute on function public.bundle_items_assign_store()
  from public, anon, authenticated;

create trigger bundle_items_assign_store
  before insert or update on public.bundle_items
  for each row execute function public.bundle_items_assign_store();

/* ------------------------------------------------------------------ *
 *  Appartenance et visibilité
 * ------------------------------------------------------------------ */

create or replace function public.owns_bundle(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bundles b
    where b.id = target
      and public.is_store_member(b.store_id)
  );
$$;

create or replace function public.is_public_bundle(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bundles b
    where b.id = target
      and b.status = 'published'
      and public.is_public_store(b.store_id)
  );
$$;

revoke execute on function public.owns_bundle(uuid)
  from public, anon, authenticated;
grant execute on function public.owns_bundle(uuid) to authenticated;

revoke execute on function public.is_public_bundle(uuid)
  from public, anon, authenticated;
grant execute on function public.is_public_bundle(uuid) to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Politiques
 * ------------------------------------------------------------------ */

alter table public.bundles enable row level security;
alter table public.bundle_items enable row level security;

create policy bundles_select_member on public.bundles
  for select to authenticated
  using (public.is_store_member(store_id));

create policy bundles_insert_member on public.bundles
  for insert to authenticated
  with check (public.is_store_member(store_id));

create policy bundles_update_member on public.bundles
  for update to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy bundles_delete_member on public.bundles
  for delete to authenticated
  using (public.is_store_member(store_id));

create policy bundles_select_public on public.bundles
  for select to anon, authenticated
  using (status = 'published' and public.is_public_store(store_id));

create policy bundle_items_select_member on public.bundle_items
  for select to authenticated
  using (public.owns_bundle(bundle_id));

create policy bundle_items_insert_member on public.bundle_items
  for insert to authenticated
  with check (public.owns_bundle(bundle_id));

create policy bundle_items_update_member on public.bundle_items
  for update to authenticated
  using (public.owns_bundle(bundle_id))
  with check (public.owns_bundle(bundle_id));

create policy bundle_items_delete_member on public.bundle_items
  for delete to authenticated
  using (public.owns_bundle(bundle_id));

create policy bundle_items_select_public on public.bundle_items
  for select to anon, authenticated
  using (public.is_public_bundle(bundle_id));

/* ------------------------------------------------------------------ *
 *  Enregistrement atomique
 * ------------------------------------------------------------------ */

create or replace function public.save_bundle(
  p_bundle_id      uuid,
  p_store_id       uuid,
  p_name           text,
  p_slug           text,
  p_description    text,
  p_image_media_id uuid,
  p_price_amount   integer,
  p_status         text,
  p_items          jsonb default '[]'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id       uuid;
  v_existing public.bundles%rowtype;
  v_count    integer;
  v_sum      bigint := 0;
  v_price    integer;
  v_item     record;
begin
  if p_image_media_id is not null and not exists (
    select 1
    from public.media_assets a
    where a.id = p_image_media_id
      and a.store_id = p_store_id
      and a.kind <> 'digital_file'
  ) then
    raise exception 'invalid_media' using errcode = '22023';
  end if;

  if p_price_amount is null or p_price_amount <= 0 then
    raise exception 'bundle_price_invalid' using errcode = '22023';
  end if;

  if p_status is null or p_status not in ('draft', 'published') then
    raise exception 'bundle_status_invalid' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_items' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_items);

  if v_count < 2 or v_count > 3 then
    raise exception 'bundle_items_count' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) e
    where jsonb_typeof(e) <> 'object'
       or e->>'product_id' is null
  ) then
    raise exception 'invalid_items' using errcode = '22023';
  end if;

  if v_count <> (
    select count(distinct
      (e->>'product_id') || ':' || coalesce(e->>'variant_id', ''))
    from jsonb_array_elements(p_items) e
  ) then
    raise exception 'duplicate_items' using errcode = '22023';
  end if;

  for v_item in
    select (e->>'product_id')::uuid as product_id,
           nullif(e->>'variant_id', '')::uuid as variant_id
    from jsonb_array_elements(p_items) e
  loop
    select p.price_amount into v_price
    from public.products p
    where p.id = v_item.product_id
      and p.store_id = p_store_id;

    if v_price is null then
      raise exception 'invalid_items' using errcode = '22023';
    end if;

    if v_item.variant_id is not null then
      select v.price_amount into v_price
      from public.product_variants v
      where v.id = v_item.variant_id
        and v.product_id = v_item.product_id
        and v.store_id = p_store_id;

      if v_price is null then
        raise exception 'invalid_items' using errcode = '22023';
      end if;
    end if;

    v_sum := v_sum + v_price;
  end loop;

  if p_price_amount >= v_sum then
    raise exception 'bundle_price_too_high' using errcode = '22023';
  end if;

  if p_bundle_id is null then
    insert into public.bundles (
      store_id, name, slug, description, image_media_id, price_amount, status
    )
    values (
      p_store_id,
      btrim(p_name),
      lower(btrim(p_slug)),
      nullif(btrim(coalesce(p_description, '')), ''),
      p_image_media_id,
      p_price_amount,
      p_status
    )
    returning id into v_id;
  else
    if not public.owns_bundle(p_bundle_id) then
      raise exception 'not_owner' using errcode = '42501';
    end if;

    select b.* into v_existing
    from public.bundles b
    where b.id = p_bundle_id
      and b.store_id = p_store_id;

    if v_existing.id is null then
      raise exception 'not_owner' using errcode = '42501';
    end if;

    update public.bundles
    set name = btrim(p_name),
        slug = lower(btrim(p_slug)),
        description = nullif(btrim(coalesce(p_description, '')), ''),
        image_media_id = p_image_media_id,
        price_amount = p_price_amount,
        status = p_status
    where id = p_bundle_id;

    delete from public.bundle_items
    where bundle_id = p_bundle_id;

    v_id := p_bundle_id;
  end if;

  insert into public.bundle_items (bundle_id, product_id, variant_id, position)
  select
    v_id,
    (e->>'product_id')::uuid,
    nullif(e->>'variant_id', '')::uuid,
    (item.ord - 1)::smallint
  from jsonb_array_elements(p_items) with ordinality as item(e, ord);

  return v_id;
end;
$$;

revoke execute on function public.save_bundle(
  uuid, uuid, text, text, text, uuid, integer, text, jsonb
) from public, anon, authenticated;
grant execute on function public.save_bundle(
  uuid, uuid, text, text, text, uuid, integer, text, jsonb
) to authenticated;
