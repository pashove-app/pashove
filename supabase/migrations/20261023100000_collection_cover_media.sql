-- La couverture d'une collection est une image publique, pas forcément un
-- visuel produit : l'uploader la range en `banner`. La RPC n'acceptait que
-- `product`, ce qui rejetait toute couverture envoyée depuis le formulaire.
-- On accepte désormais toute image publique de la boutique ; les fichiers
-- vendus (`digital_file`) restent exclus.

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
      and a.kind <> 'digital_file'
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
