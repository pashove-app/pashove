-- Correction : la suppression passe avant l'insertion des nouvelles variantes
-- (sinon une combinaison créée dans le même enregistrement était effacée).

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

  -- 2. Les variantes retirées de la matrice sont supprimées.
  delete from public.product_variants pv
  where pv.product_id = p_product_id
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_variants, '[]'::jsonb)) as v(item)
      where v.item->>'id' = pv.id::text
    );

  -- 3. Les nouvelles combinaisons sont insérées.
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

  -- 4. Le produit est mis à jour avec le stock final.
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
