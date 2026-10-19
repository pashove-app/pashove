-- Variantes : options, matrice et stock global.

alter table public.products
  add column options jsonb not null default '[]'::jsonb;

alter table public.products
  add constraint products_options_shape check (
    jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) <= 3
  );

/* ------------------------------------------------------------------ *
 *  Table des variantes
 *
 *  `store_id` est toujours recopié depuis le produit par un trigger :
 *  le client ne le fournit jamais. RLS : mêmes frontières que le produit.
 * ------------------------------------------------------------------ */

create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  product_id     uuid not null references public.products (id) on delete cascade,
  -- {"Taille": "M", "Couleur": "Rouge"}
  option_values  jsonb not null check (jsonb_typeof(option_values) = 'object'),
  sku            text check (sku is null or char_length(sku) <= 64),
  barcode        text check (barcode is null or char_length(barcode) <= 64),
  -- Unité mineure, comme le produit : jamais de flottant.
  price_amount   integer not null check (price_amount >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  position       integer not null default 0 check (position >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (product_id, sku)
);

create index product_variants_product_idx
  on public.product_variants (product_id, position);

create index product_variants_store_idx
  on public.product_variants (store_id);

create or replace function public.product_variants_assign_store()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid;
begin
  select p.store_id into v_store
  from public.products p
  where p.id = new.product_id;

  if v_store is null then
    raise exception 'invalid_product' using errcode = '22023';
  end if;

  new.store_id := v_store;
  return new;
end;
$$;

create or replace function public.sync_product_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product uuid;
begin
  v_product := case when tg_op = 'DELETE' then old.product_id else new.product_id end;

  update public.products p
  set stock_quantity = coalesce(
    (
      select sum(v.stock_quantity)::int
      from public.product_variants v
      where v.product_id = v_product
    ),
    0
  )
  where p.id = v_product;

  return null;
end;
$$;

revoke execute on function public.product_variants_assign_store() from public, anon, authenticated;
revoke execute on function public.sync_product_stock() from public, anon, authenticated;

create trigger product_variants_assign_store
  before insert or update on public.product_variants
  for each row execute function public.product_variants_assign_store();

create trigger product_variants_touch_updated_at
  before update on public.product_variants
  for each row execute function public.touch_updated_at();

-- Le stock global du produit est toujours la somme de ses variantes.
create trigger product_variants_sync_stock
  after insert or update or delete on public.product_variants
  for each row execute function public.sync_product_stock();

alter table public.product_variants enable row level security;

create policy product_variants_select_member on public.product_variants
  for select to authenticated
  using (public.is_store_member(store_id));

create policy product_variants_insert_member on public.product_variants
  for insert to authenticated
  with check (public.owns_product(product_id));

create policy product_variants_update_member on public.product_variants
  for update to authenticated
  using (public.owns_product(product_id))
  with check (public.owns_product(product_id));

create policy product_variants_delete_member on public.product_variants
  for delete to authenticated
  using (public.owns_product(product_id));

-- Vitrine : les variantes d'un produit public sont lisibles par tous.
create policy product_variants_select_public on public.product_variants
  for select to anon, authenticated
  using (public.is_public_product(product_id));

/* ------------------------------------------------------------------ *
 *  Validation commune aux deux RPC
 *
 *  Le serveur ne fait jamais confiance au JSON du client : structure,
 *  limites et cohérence des options sont vérifiées ici, en base.
 * ------------------------------------------------------------------ */

create or replace function public.validate_product_variants(
  p_options  jsonb,
  p_variants jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_options  jsonb := coalesce(p_options, '[]'::jsonb);
  v_variants jsonb := coalesce(p_variants, '[]'::jsonb);
  v_names    text[];
begin
  if jsonb_typeof(v_options) <> 'array' or jsonb_array_length(v_options) > 3 then
    raise exception 'invalid_options' using errcode = '22023';
  end if;

  if jsonb_typeof(v_variants) <> 'array' or jsonb_array_length(v_variants) > 100 then
    raise exception 'invalid_variants' using errcode = '22023';
  end if;

  select array_agg(o.item->>'name') into v_names
  from jsonb_array_elements(v_options) as o(item);

  if v_names is not null and (
    exists (select 1 from unnest(v_names) as n where n is null or btrim(n) = '')
    or (select count(distinct n) from unnest(v_names) as n) <> array_length(v_names, 1)
  ) then
    raise exception 'invalid_options' using errcode = '22023';
  end if;

  if jsonb_array_length(v_options) = 0 and jsonb_array_length(v_variants) > 0 then
    raise exception 'invalid_variants' using errcode = '22023';
  end if;

  if jsonb_array_length(v_options) > 0 and jsonb_array_length(v_variants) = 0 then
    raise exception 'invalid_variants' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_variants) as v(item)
    where jsonb_typeof(v.item->'option_values') <> 'object'
      or (v.item->>'price_amount') is null
      or (v.item->>'stock_quantity') is null
      or (v.item->>'price_amount') !~ '^\d{1,7}$'
      or (v.item->>'stock_quantity') !~ '^\d{1,7}$'
  ) then
    raise exception 'invalid_variants' using errcode = '22023';
  end if;

  -- Chaque variante porte exactement les options du produit.
  if jsonb_array_length(v_variants) > 0 and exists (
    select 1
    from jsonb_array_elements(v_variants) as v(item)
    where (
      select array_agg(k order by k)
      from jsonb_object_keys(v.item->'option_values') as k
    ) is distinct from (
      select array_agg(k order by k) from unnest(v_names) as k
    )
  ) then
    raise exception 'invalid_variants' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.validate_product_variants(jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.validate_product_variants(jsonb, jsonb)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Création atomique — produit, galerie et variantes
 * ------------------------------------------------------------------ */

drop function if exists public.create_product(
  uuid, text, text, text, integer, text, text, integer, integer,
  integer, text, text[], text, uuid, uuid[], integer, integer, integer,
  integer, text[]
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
  p_shipping_countries text[] default '{}',
  p_options           jsonb default '[]'::jsonb,
  p_variants          jsonb default '[]'::jsonb
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

  perform public.validate_product_variants(p_options, p_variants);

  insert into public.products (
    store_id, name, slug, description, price_amount, compare_at_amount,
    status, published_at, product_type, stock_quantity, weight_grams,
    duration_minutes, service_location, tags, video_url, digital_file_id,
    length_mm, width_mm, height_mm, shipping_countries, options
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
    coalesce(p_shipping_countries, '{}'),
    coalesce(p_options, '[]'::jsonb)
  )
  returning id into v_id;

  if p_image_ids is not null then
    insert into public.product_images (product_id, media_id, position)
    select v_id, m.id, (m.ord - 1)::int
    from unnest(p_image_ids) with ordinality as m(id, ord);
  end if;

  if p_variants is not null and jsonb_array_length(p_variants) > 0 then
    insert into public.product_variants (
      store_id, product_id, option_values, sku, barcode,
      price_amount, stock_quantity, position
    )
    select
      p_store_id,
      v_id,
      item.option_values,
      nullif(btrim(coalesce(item.sku, '')), ''),
      nullif(btrim(coalesce(item.barcode, '')), ''),
      item.price_amount,
      item.stock_quantity,
      coalesce(item.position, 0)
    from jsonb_to_recordset(p_variants) as item(
      option_values jsonb, sku text, barcode text,
      price_amount integer, stock_quantity integer, position integer
    );
  end if;

  return v_id;
end;
$$;

revoke execute on function public.create_product(
  uuid, text, text, text, integer, text, text, integer, integer,
  integer, text, text[], text, uuid, uuid[], integer, integer, integer,
  integer, text[], jsonb, jsonb
) from public, anon, authenticated;

grant execute on function public.create_product(
  uuid, text, text, text, integer, text, text, integer, integer,
  integer, text, text[], text, uuid, uuid[], integer, integer, integer,
  integer, text[], jsonb, jsonb
) to authenticated;

/* ------------------------------------------------------------------ *
 *  Mise à jour — les variantes sont remplacées dans la transaction
 * ------------------------------------------------------------------ */

drop function if exists public.update_product(
  uuid, text, text, text, integer, text, integer, integer, integer,
  text, text[], text, uuid, uuid[], integer, integer, integer, integer,
  text[]
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
  p_shipping_countries text[] default '{}',
  p_options           jsonb default '[]'::jsonb,
  p_variants          jsonb default '[]'::jsonb
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

  perform public.validate_product_variants(p_options, p_variants);

  -- Supprimées avant la mise à jour : le stock manuel reprend la main si
  -- le marchand retire toutes les options, sinon les inserts le recalculent.
  delete from public.product_variants where product_id = p_product_id;

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
    shipping_countries = coalesce(p_shipping_countries, '{}'),
    options = coalesce(p_options, '[]'::jsonb)
  where id = p_product_id;

  delete from public.product_images where product_id = p_product_id;

  if p_image_ids is not null then
    insert into public.product_images (product_id, media_id, position)
    select p_product_id, m.id, (m.ord - 1)::int
    from unnest(p_image_ids) with ordinality as m(id, ord);
  end if;

  if p_variants is not null and jsonb_array_length(p_variants) > 0 then
    insert into public.product_variants (
      store_id, product_id, option_values, sku, barcode,
      price_amount, stock_quantity, position
    )
    select
      v_store,
      p_product_id,
      item.option_values,
      nullif(btrim(coalesce(item.sku, '')), ''),
      nullif(btrim(coalesce(item.barcode, '')), ''),
      item.price_amount,
      item.stock_quantity,
      coalesce(item.position, 0)
    from jsonb_to_recordset(p_variants) as item(
      option_values jsonb, sku text, barcode text,
      price_amount integer, stock_quantity integer, position integer
    );
  end if;

  return p_product_id;
end;
$$;

revoke execute on function public.update_product(
  uuid, text, text, text, integer, text, integer, integer, integer,
  text, text[], text, uuid, uuid[], integer, integer, integer, integer,
  text[], jsonb, jsonb
) from public, anon, authenticated;

grant execute on function public.update_product(
  uuid, text, text, text, integer, text, integer, integer, integer,
  text, text[], text, uuid, uuid[], integer, integer, integer, integer,
  text[], jsonb, jsonb
) to authenticated;
