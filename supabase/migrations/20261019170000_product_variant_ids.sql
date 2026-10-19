-- Identifiants de variantes stables : la mise à jour fait un UPSERT.

-- Deux variantes peuvent échanger leurs SKU dans une même sauvegarde.
alter table public.product_variants
  drop constraint product_variants_product_id_sku_key,
  add constraint product_variants_product_id_sku_key
    unique (product_id, sku) deferrable initially deferred;

/* ------------------------------------------------------------------ *
 *  Validation — l'identifiant est facultatif mais contrôlé
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

  -- Un identifiant fourni doit être un UUID, et une seule fois.
  if exists (
    select 1
    from jsonb_array_elements(v_variants) as v(item)
    where v.item->>'id' is not null
      and (v.item->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) then
    raise exception 'invalid_variants' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_variants) as v(item)
    where v.item->>'id' is not null
    group by v.item->>'id'
    having count(*) > 1
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

/* ------------------------------------------------------------------ *
 *  Mise à jour — les variantes existantes gardent leur identifiant
 * ------------------------------------------------------------------ */

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

  -- Un identifiant reçu ne peut désigner qu'une variante de CE produit.
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_variants, '[]'::jsonb)) as v(item)
    where v.item->>'id' is not null
      and not exists (
        select 1
        from public.product_variants pv
        where pv.id = (v.item->>'id')::uuid
          and pv.product_id = p_product_id
      )
  ) then
    raise exception 'invalid_variants' using errcode = '22023';
  end if;

  -- 1. Les variantes existantes sont mises à jour sur place.
  update public.product_variants pv
  set option_values  = item.option_values,
      sku            = nullif(btrim(coalesce(item.sku, '')), ''),
      barcode        = nullif(btrim(coalesce(item.barcode, '')), ''),
      price_amount   = item.price_amount,
      stock_quantity = item.stock_quantity,
      position       = coalesce(item.position, 0)
  from jsonb_to_recordset(coalesce(p_variants, '[]'::jsonb)) as item(
    id uuid, option_values jsonb, sku text, barcode text,
    price_amount integer, stock_quantity integer, position integer
  )
  where pv.id = item.id
    and pv.product_id = p_product_id;

  -- 2. Les nouvelles combinaisons sont insérées.
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
  from jsonb_to_recordset(coalesce(p_variants, '[]'::jsonb)) as item(
    id uuid, option_values jsonb, sku text, barcode text,
    price_amount integer, stock_quantity integer, position integer
  )
  where item.id is null;

  -- 3. Les variantes absentes de la matrice sont supprimées.
  delete from public.product_variants pv
  where pv.product_id = p_product_id
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_variants, '[]'::jsonb)) as v(item)
      where v.item->>'id' = pv.id::text
    );

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
    -- Somme finale si la matrice existe ; stock manuel si elle a disparu.
    stock_quantity = case
      when jsonb_array_length(coalesce(p_variants, '[]'::jsonb)) > 0 then
        coalesce(
          (
            select sum(v.stock_quantity)::int
            from public.product_variants v
            where v.product_id = p_product_id
          ),
          0
        )
      else p_stock_quantity
    end,
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

  return p_product_id;
end;
$$;
