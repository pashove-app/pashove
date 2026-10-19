-- Galerie, prix comparé et livraison.

alter table public.products
  add column compare_at_amount   integer,
  add column length_mm           integer,
  add column width_mm            integer,
  add column height_mm           integer,
  add column shipping_countries  text[] not null default '{}';

alter table public.products
  add constraint products_compare_at_valid
    check (compare_at_amount is null or compare_at_amount > price_amount),
  add constraint products_dimensions_valid check (
    (length_mm is null or length_mm > 0)
    and (width_mm is null or width_mm > 0)
    and (height_mm is null or height_mm > 0)
  ),
  -- Vide signifie « livre partout ».
  add constraint products_shipping_countries_shape
    check (
      array_length(shipping_countries, 1) is null
      or array_length(shipping_countries, 1) <= 20
    );

/* ------------------------------------------------------------------ *
 *  Création — mêmes règles, cinq champs de plus
 * ------------------------------------------------------------------ */

drop function if exists public.create_product(
  uuid, text, text, text, integer, text, text, integer, integer,
  integer, text, text[], text, uuid, uuid[]
);

create or replace function public.create_product(
  p_store_id          uuid,
  p_name              text,
  p_slug              text,
  p_description       text,
  p_price_amount      integer,
  p_status            text,
  p_product_type      text,
  p_stock_quantity    integer default null,
  p_weight_grams      integer default null,
  p_duration_minutes  integer default null,
  p_service_location  text default null,
  p_tags              text[] default '{}',
  p_video_url         text default null,
  p_digital_file_id   uuid default null,
  p_image_ids         uuid[] default '{}',
  p_compare_at_amount integer default null,
  p_length_mm         integer default null,
  p_width_mm          integer default null,
  p_height_mm         integer default null,
  p_shipping_countries text[] default '{}'
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
    store_id, name, slug, description, price_amount, compare_at_amount,
    status, published_at, product_type, stock_quantity, weight_grams,
    duration_minutes, service_location, tags, video_url, digital_file_id,
    length_mm, width_mm, height_mm, shipping_countries
  )
  values (
    p_store_id,
    btrim(p_name),
    lower(btrim(p_slug)),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_price_amount,
    p_compare_at_amount,
    p_status,
    case when p_status = 'published' then now() else null end,
    p_product_type,
    p_stock_quantity,
    p_weight_grams,
    p_duration_minutes,
    p_service_location,
    coalesce(p_tags, '{}'),
    nullif(btrim(coalesce(p_video_url, '')), ''),
    p_digital_file_id,
    p_length_mm,
    p_width_mm,
    p_height_mm,
    coalesce(p_shipping_countries, '{}')
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
  integer, text, text[], text, uuid, uuid[], integer, integer, integer,
  integer, text[]
) from public, anon, authenticated;

grant execute on function public.create_product(
  uuid, text, text, text, integer, text, text, integer, integer,
  integer, text, text[], text, uuid, uuid[], integer, integer, integer,
  integer, text[]
) to authenticated;

/* ------------------------------------------------------------------ *
 *  Mise à jour
 * ------------------------------------------------------------------ */

drop function if exists public.update_product(
  uuid, text, text, text, integer, text, integer, integer, integer,
  text, text[], text, uuid, uuid[]
);

create or replace function public.update_product(
  p_product_id        uuid,
  p_name              text,
  p_slug              text,
  p_description       text,
  p_price_amount      integer,
  p_status            text,
  p_stock_quantity    integer default null,
  p_weight_grams      integer default null,
  p_duration_minutes  integer default null,
  p_service_location  text default null,
  p_tags              text[] default '{}',
  p_video_url         text default null,
  p_digital_file_id   uuid default null,
  p_image_ids         uuid[] default '{}',
  p_compare_at_amount integer default null,
  p_length_mm         integer default null,
  p_width_mm          integer default null,
  p_height_mm         integer default null,
  p_shipping_countries text[] default '{}'
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
    compare_at_amount = p_compare_at_amount,
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
    digital_file_id = p_digital_file_id,
    length_mm = p_length_mm,
    width_mm = p_width_mm,
    height_mm = p_height_mm,
    shipping_countries = coalesce(p_shipping_countries, '{}')
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
  text, text[], text, uuid, uuid[], integer, integer, integer, integer, text[]
) from public, anon, authenticated;

grant execute on function public.update_product(
  uuid, text, text, text, integer, text, integer, integer, integer,
  text, text[], text, uuid, uuid[], integer, integer, integer, integer, text[]
) to authenticated;
