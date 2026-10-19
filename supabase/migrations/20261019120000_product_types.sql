-- Types de produit : physique, numérique, service.
--
-- Chaque type a ses champs propres, et une contrainte empêche une ligne d'être
-- à moitié physique et à moitié service. Le fichier numérique vit dans un
-- bucket privé : sa clé n'est jamais publique.

alter table public.media_assets
  drop constraint media_assets_kind_check;

alter table public.media_assets
  add constraint media_assets_kind_check
  check (kind in ('logo', 'banner', 'product', 'digital_file'));

alter table public.media_assets
  add column file_name text;

-- Une clé de fichier payant ne doit jamais être lisible par un visiteur.
drop policy media_assets_select_public on public.media_assets;

create policy media_assets_select_public on public.media_assets
  for select to anon, authenticated
  using (public.is_public_store(store_id) and kind <> 'digital_file');

alter table public.products
  add column product_type      text not null default 'physical',
  add column stock_quantity    integer,
  add column weight_grams      integer,
  add column duration_minutes  integer,
  add column service_location  text,
  add column tags              text[] not null default '{}',
  add column video_url         text,
  add column digital_file_id   uuid references public.media_assets (id) on delete set null;

-- Les produits existants sont physiques : ils reçoivent un stock nul.
update public.products
set stock_quantity = 0
where product_type = 'physical' and stock_quantity is null;

alter table public.products
  add constraint products_type_valid
    check (product_type in ('physical', 'digital', 'service')),
  add constraint products_stock_valid
    check (stock_quantity is null or stock_quantity >= 0),
  add constraint products_weight_valid
    check (weight_grams is null or weight_grams > 0),
  add constraint products_duration_valid
    check (duration_minutes is null or duration_minutes > 0),
  add constraint products_location_valid
    check (service_location is null or service_location in ('online', 'in_person')),
  add constraint products_video_shape
    check (video_url is null or video_url ~ '^https://'),
  add constraint products_tags_shape
    check (array_length(tags, 1) is null or array_length(tags, 1) <= 10),
  add constraint products_type_fields check (
    (
      product_type = 'physical'
      and stock_quantity is not null
      and digital_file_id is null
      and duration_minutes is null
      and service_location is null
    )
    or (
      product_type = 'digital'
      and stock_quantity is null
      and weight_grams is null
      and digital_file_id is not null
      and duration_minutes is null
      and service_location is null
    )
    or (
      product_type = 'service'
      and stock_quantity is null
      and weight_grams is null
      and digital_file_id is null
      and duration_minutes is not null
      and service_location is not null
    )
  );

create index products_tags_idx on public.products using gin (tags);

/* ------------------------------------------------------------------ *
 *  Création
 *
 *  La signature change : l'ancienne version est supprimée, pas surchargée.
 *  Les images arrivent dans l'ordre du tableau ; la première est la
 *  principale. Quatre au maximum.
 * ------------------------------------------------------------------ */

drop function if exists public.create_product(uuid, text, text, text, integer, text, uuid);

create or replace function public.create_product(
  p_store_id         uuid,
  p_name             text,
  p_slug             text,
  p_description      text,
  p_price_amount     integer,
  p_status           text,
  p_product_type     text,
  p_stock_quantity   integer default null,
  p_weight_grams     integer default null,
  p_duration_minutes integer default null,
  p_service_location text default null,
  p_tags             text[] default '{}',
  p_video_url        text default null,
  p_digital_file_id  uuid default null,
  p_image_ids        uuid[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_image_ids is not null and array_length(p_image_ids, 1) > 4 then
    raise exception 'too_many_images' using errcode = '22023';
  end if;

  if p_image_ids is not null and exists (
    select 1
    from unnest(p_image_ids) as m(id)
    where not exists (
      select 1
      from public.media_assets a
      where a.id = m.id
        and a.store_id = p_store_id
        and a.kind = 'product'
    )
  ) then
    raise exception 'invalid_media' using errcode = '22023';
  end if;

  if p_digital_file_id is not null and not exists (
    select 1
    from public.media_assets a
    where a.id = p_digital_file_id
      and a.store_id = p_store_id
      and a.kind = 'digital_file'
  ) then
    raise exception 'invalid_file' using errcode = '22023';
  end if;

  insert into public.products (
    store_id, name, slug, description, price_amount, status, published_at,
    product_type, stock_quantity, weight_grams, duration_minutes,
    service_location, tags, video_url, digital_file_id
  )
  values (
    p_store_id,
    btrim(p_name),
    lower(btrim(p_slug)),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_price_amount,
    p_status,
    case when p_status = 'published' then now() else null end,
    p_product_type,
    p_stock_quantity,
    p_weight_grams,
    p_duration_minutes,
    p_service_location,
    coalesce(p_tags, '{}'),
    nullif(btrim(coalesce(p_video_url, '')), ''),
    p_digital_file_id
  )
  returning id into v_id;

  if p_image_ids is not null then
    insert into public.product_images (product_id, media_id, position)
    select v_id, m.id, (m.ord - 1)::int
    from unnest(p_image_ids) with ordinality as m(id, ord);
  end if;

  return v_id;
end;
$$;

revoke execute on function public.create_product(
  uuid, text, text, text, integer, text, text, integer, integer,
  integer, text, text[], text, uuid, uuid[]
) from public, anon, authenticated;

grant execute on function public.create_product(
  uuid, text, text, text, integer, text, text, integer, integer,
  integer, text, text[], text, uuid, uuid[]
) to authenticated;

/* ------------------------------------------------------------------ *
 *  Mise à jour
 *
 *  Le type n'est jamais modifiable : il n'est pas dans les paramètres.
 *  La galerie est remplacée d'un bloc.
 * ------------------------------------------------------------------ */

create or replace function public.update_product(
  p_product_id       uuid,
  p_name             text,
  p_slug             text,
  p_description      text,
  p_price_amount     integer,
  p_status           text,
  p_stock_quantity   integer default null,
  p_weight_grams     integer default null,
  p_duration_minutes integer default null,
  p_service_location text default null,
  p_tags             text[] default '{}',
  p_video_url        text default null,
  p_digital_file_id  uuid default null,
  p_image_ids        uuid[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_store uuid;
begin
  if not public.owns_product(p_product_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select p.store_id into v_store
  from public.products p
  where p.id = p_product_id;

  if p_image_ids is not null and array_length(p_image_ids, 1) > 4 then
    raise exception 'too_many_images' using errcode = '22023';
  end if;

  if p_image_ids is not null and exists (
    select 1
    from unnest(p_image_ids) as m(id)
    where not exists (
      select 1
      from public.media_assets a
      where a.id = m.id
        and a.store_id = v_store
        and a.kind = 'product'
    )
  ) then
    raise exception 'invalid_media' using errcode = '22023';
  end if;

  if p_digital_file_id is not null and not exists (
    select 1
    from public.media_assets a
    where a.id = p_digital_file_id
      and a.store_id = v_store
      and a.kind = 'digital_file'
  ) then
    raise exception 'invalid_file' using errcode = '22023';
  end if;

  update public.products
  set
    name = btrim(p_name),
    slug = lower(btrim(p_slug)),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    price_amount = p_price_amount,
    status = p_status,
    published_at = case
      when p_status = 'published' and published_at is null then now()
      else published_at
    end,
    stock_quantity = p_stock_quantity,
    weight_grams = p_weight_grams,
    duration_minutes = p_duration_minutes,
    service_location = p_service_location,
    tags = coalesce(p_tags, '{}'),
    video_url = nullif(btrim(coalesce(p_video_url, '')), ''),
    digital_file_id = p_digital_file_id
  where id = p_product_id;

  delete from public.product_images where product_id = p_product_id;

  if p_image_ids is not null then
    insert into public.product_images (product_id, media_id, position)
    select p_product_id, m.id, (m.ord - 1)::int
    from unnest(p_image_ids) with ordinality as m(id, ord);
  end if;

  return p_product_id;
end;
$$;

revoke execute on function public.update_product(
  uuid, text, text, text, integer, text, integer, integer, integer,
  text, text[], text, uuid, uuid[]
) from public, anon, authenticated;

grant execute on function public.update_product(
  uuid, text, text, text, integer, text, integer, integer, integer,
  text, text[], text, uuid, uuid[]
) to authenticated;
