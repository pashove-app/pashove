-- PASHOVE — Inventaire
--
-- Le stock reste porté par `products.stock_quantity` et
-- `product_variants.stock_quantity`. `inventory_movements` conserve l'historique
-- des corrections manuelles et `inventory_locations` les emplacements.
-- Toute écriture passe par une fonction qui vérifie l'appartenance et empêche
-- un stock négatif.

alter table public.products
  add column low_stock_threshold integer not null default 5
    check (low_stock_threshold >= 0);

create table public.inventory_locations (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 2 and 60),
  kind       text not null default 'warehouse'
    check (kind in ('warehouse', 'shop', 'other')),
  address    text check (address is null or char_length(address) <= 300),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (store_id, name)
);

create unique index inventory_locations_default_idx
  on public.inventory_locations (store_id)
  where is_default;

alter table public.inventory_locations enable row level security;
revoke all on public.inventory_locations from public, anon, authenticated;
grant select on public.inventory_locations to authenticated;

create policy inventory_locations_select on public.inventory_locations
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create table public.inventory_movements (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  location_id    uuid references public.inventory_locations (id) on delete set null,
  product_id     uuid not null references public.products (id) on delete cascade,
  variant_id     uuid references public.product_variants (id) on delete cascade,
  delta          integer not null check (delta <> 0 and abs(delta) <= 1000000),
  reason         text not null default 'adjustment'
    check (reason in ('adjustment', 'restock', 'sale', 'refund', 'transfer', 'initial')),
  note           text check (note is null or char_length(note) <= 300),
  reference_type text check (reference_type is null or char_length(reference_type) <= 40),
  reference_id   uuid,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index inventory_movements_store_idx
  on public.inventory_movements (store_id, created_at desc);
create index inventory_movements_product_idx
  on public.inventory_movements (product_id, created_at desc);

alter table public.inventory_movements enable row level security;
revoke all on public.inventory_movements from public, anon, authenticated;
grant select on public.inventory_movements to authenticated;

create policy inventory_movements_select on public.inventory_movements
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

/* ------------------------------------------------------------------ *
 *  Emplacements
 * ------------------------------------------------------------------ */

create or replace function public.create_inventory_location(
  p_store_id   uuid,
  p_name       text,
  p_kind       text default 'warehouse',
  p_is_default boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_kind    text := coalesce(p_kind, 'warehouse');
  v_default boolean := coalesce(p_is_default, false);
  v_id      uuid;
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 60 then
    raise exception 'location_name_invalid' using errcode = '22023';
  end if;

  if v_kind not in ('warehouse', 'shop', 'other') then
    raise exception 'location_kind_invalid' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.inventory_locations l where l.store_id = p_store_id
  ) then
    v_default := true;
  end if;

  if v_default then
    update public.inventory_locations
    set is_default = false
    where store_id = p_store_id and is_default;
  end if;

  insert into public.inventory_locations (store_id, name, kind, is_default)
  values (p_store_id, v_name, v_kind, v_default)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.create_inventory_location(uuid, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.create_inventory_location(uuid, text, text, boolean)
  to authenticated;

create or replace function public.set_default_inventory_location(
  p_store_id    uuid,
  p_location_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.inventory_locations l
    where l.id = p_location_id and l.store_id = p_store_id
  ) then
    raise exception 'location_unknown' using errcode = '22023';
  end if;

  update public.inventory_locations
  set is_default = false
  where store_id = p_store_id and is_default;

  update public.inventory_locations
  set is_default = true
  where id = p_location_id and store_id = p_store_id;
end;
$$;

revoke execute on function public.set_default_inventory_location(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.set_default_inventory_location(uuid, uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Mouvement manuel
 * ------------------------------------------------------------------ */

create or replace function public.adjust_inventory(
  p_store_id    uuid,
  p_product_id  uuid,
  p_variant_id  uuid,
  p_location_id uuid,
  p_delta       integer,
  p_reason      text default 'adjustment',
  p_note        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_current integer;
  v_new     integer;
  v_reason  text := coalesce(p_reason, 'adjustment');
  v_note    text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_delta is null or p_delta = 0 or abs(p_delta) > 1000000 then
    raise exception 'delta_invalid' using errcode = '22023';
  end if;

  if v_reason not in ('adjustment', 'restock', 'sale', 'refund', 'transfer', 'initial') then
    raise exception 'reason_invalid' using errcode = '22023';
  end if;

  select * into v_product
  from public.products p
  where p.id = p_product_id and p.store_id = p_store_id
  for update;

  if v_product.id is null then
    raise exception 'product_unknown' using errcode = '22023';
  end if;

  if v_product.product_type <> 'physical' then
    raise exception 'product_not_physical' using errcode = '22023';
  end if;

  if p_variant_id is null and exists (
    select 1 from public.product_variants v
    where v.product_id = v_product.id
  ) then
    raise exception 'variant_required' using errcode = '22023';
  end if;

  if p_variant_id is not null then
    select * into v_variant
    from public.product_variants v
    where v.id = p_variant_id
      and v.product_id = v_product.id
      and v.store_id = p_store_id
    for update;

    if v_variant.id is null then
      raise exception 'variant_unknown' using errcode = '22023';
    end if;

    v_current := v_variant.stock_quantity;
    v_new := v_current + p_delta;

    if v_new < 0 then
      raise exception 'stock_negative' using errcode = '22023';
    end if;

    update public.product_variants
    set stock_quantity = v_new
    where id = v_variant.id;
  else
    v_current := coalesce(v_product.stock_quantity, 0);
    v_new := v_current + p_delta;

    if v_new < 0 then
      raise exception 'stock_negative' using errcode = '22023';
    end if;

    update public.products
    set stock_quantity = v_new
    where id = v_product.id;
  end if;

  if p_location_id is not null and not exists (
    select 1 from public.inventory_locations l
    where l.id = p_location_id and l.store_id = p_store_id
  ) then
    raise exception 'location_unknown' using errcode = '22023';
  end if;

  insert into public.inventory_movements (
    store_id, location_id, product_id, variant_id, delta, reason, note, created_by
  )
  values (
    p_store_id, p_location_id, v_product.id, p_variant_id, p_delta,
    v_reason, v_note, (select auth.uid())
  );

  return jsonb_build_object('stock', v_new, 'previous', v_current, 'delta', p_delta);
end;
$$;

revoke execute on function public.adjust_inventory(uuid, uuid, uuid, uuid, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.adjust_inventory(uuid, uuid, uuid, uuid, integer, text, text)
  to authenticated;
