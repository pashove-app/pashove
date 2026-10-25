-- Codes promo : modèle, application au panier et à la commande.
--
-- Un code appartient à une boutique. Le client ne l'applique que par RPC :
-- l'existence, les dates, le quota et le montant minimum sont revérifiés côté
-- serveur, et une commande ne peut consommer qu'un seul code.

create table public.discount_codes (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  code         text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  kind         text not null check (kind in ('percent', 'fixed')),
  value        integer not null check (value > 0),
  min_subtotal integer not null default 0 check (min_subtotal >= 0),
  max_uses     integer check (max_uses is null or max_uses > 0),
  uses_count   integer not null default 0 check (uses_count >= 0),
  starts_at    timestamptz,
  expires_at   timestamptz,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (store_id, code),
  check (kind <> 'percent' or value between 1 and 100),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create index discount_codes_store_idx
  on public.discount_codes (store_id, created_at desc);

create trigger discount_codes_touch_updated_at
  before update on public.discount_codes
  for each row execute function public.touch_updated_at();

create table public.discount_redemptions (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores (id) on delete cascade,
  discount_id uuid not null references public.discount_codes (id) on delete cascade,
  order_id    uuid not null unique references public.orders (id) on delete cascade,
  code        text not null,
  amount      integer not null check (amount >= 0),
  created_at  timestamptz not null default now()
);

create index discount_redemptions_discount_idx
  on public.discount_redemptions (discount_id, created_at desc);

alter table public.carts
  add column discount_code_id uuid references public.discount_codes (id) on delete set null;

alter table public.orders
  add column discount_amount integer not null default 0
    check (discount_amount >= 0),
  add column discount_code text,
  add column discount_code_id uuid references public.discount_codes (id) on delete set null;

/* ------------------------------------------------------------------ *
 *  RLS — le marchand gère ses codes, le public n'y touche pas
 * ------------------------------------------------------------------ */

alter table public.discount_codes enable row level security;
alter table public.discount_redemptions enable row level security;

create policy discount_codes_select_member on public.discount_codes
  for select to authenticated
  using (public.is_store_member(store_id));

create policy discount_codes_insert_member on public.discount_codes
  for insert to authenticated
  with check (public.is_store_member(store_id));

create policy discount_codes_update_member on public.discount_codes
  for update to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy discount_codes_delete_member on public.discount_codes
  for delete to authenticated
  using (public.is_store_member(store_id));

create policy discount_redemptions_select_member on public.discount_redemptions
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.discount_codes from public, anon, authenticated;
revoke all on public.discount_redemptions from public, anon, authenticated;

grant select, insert, update, delete on public.discount_codes to authenticated;
grant select on public.discount_redemptions to authenticated;

/* ------------------------------------------------------------------ *
 *  Panier — lecture avec remise
 * ------------------------------------------------------------------ */

create or replace function public.cart_payload(p_cart_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      c.id,
      c.store_id,
      c.checkout_key,
      s.currency,
      s.shipping_flat_amount,
      s.cod_enabled
    from public.carts c
    join public.stores s on s.id = c.store_id
    where c.id = p_cart_id
  ),
  lines as (
    select
      ci.cart_id,
      ci.created_at as sort_at,
      ci.id as sort_id,
      jsonb_build_object(
        'id', ci.id,
        'kind', 'product',
        'productId', ci.product_id,
        'bundleId', null,
        'bundleItems', '[]'::jsonb,
        'name', p.name,
        'slug', p.slug,
        'productType', p.product_type,
        'variantLabel', case
          when ci.variant_id is null then null
          else (
            select string_agg(entry.value, ' · ' order by entry.key)
            from jsonb_each_text(v.option_values) as entry
          )
        end,
        'unitPrice', coalesce(v.price_amount, p.price_amount),
        'compareAt', p.compare_at_amount,
        'imageKey', (
          select m.object_key
          from public.product_images pi
          join public.media_assets m on m.id = pi.media_id
          where pi.product_id = p.id
          order by pi.position
          limit 1
        ),
        'quantity', ci.quantity,
        'stock', case
          when p.product_type = 'physical'
            then coalesce(v.stock_quantity, p.stock_quantity, 0)
          else null
        end,
        'available', (
          p.status = 'published'
          and (
            p.product_type <> 'physical'
            or coalesce(v.stock_quantity, p.stock_quantity, 0) >= ci.quantity
          )
        ),
        'lineTotal', coalesce(v.price_amount, p.price_amount) * ci.quantity
      ) as item,
      coalesce(v.price_amount, p.price_amount) * ci.quantity as line_total,
      p.product_type = 'physical' as has_physical,
      p.product_type <> 'physical' as has_non_physical
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    left join public.product_variants v on v.id = ci.variant_id
    where ci.cart_id = p_cart_id
      and ci.product_id is not null

    union all

    select
      ci.cart_id,
      ci.created_at,
      ci.id,
      jsonb_build_object(
        'id', ci.id,
        'kind', 'bundle',
        'productId', null,
        'bundleId', b.id,
        'bundleItems', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'name', bp.name,
                'variantLabel', case
                  when bi.variant_id is null then null
                  else (
                    select string_agg(entry.value, ' · ' order by entry.key)
                    from jsonb_each_text(bv.option_values) as entry
                  )
                end
              )
              order by bi.position
            )
            from public.bundle_items bi
            join public.products bp on bp.id = bi.product_id
            left join public.product_variants bv on bv.id = bi.variant_id
            where bi.bundle_id = b.id
          ),
          '[]'::jsonb
        ),
        'name', b.name,
        'slug', b.slug,
        'productType', 'bundle',
        'variantLabel', null,
        'unitPrice', b.price_amount,
        'compareAt', (
          select sum(coalesce(bv.price_amount, bp.price_amount))::int
          from public.bundle_items bi
          join public.products bp on bp.id = bi.product_id
          left join public.product_variants bv on bv.id = bi.variant_id
          where bi.bundle_id = b.id
        ),
        'imageKey', coalesce(
          (select m.object_key from public.media_assets m where m.id = b.image_media_id),
          (
            select m.object_key
            from public.bundle_items bi
            join public.product_images pi on pi.product_id = bi.product_id
            join public.media_assets m on m.id = pi.media_id
            where bi.bundle_id = b.id
            order by bi.position, pi.position
            limit 1
          )
        ),
        'quantity', ci.quantity,
        'stock', (
          select min(coalesce(bv.stock_quantity, bp.stock_quantity, 0))
          from public.bundle_items bi
          join public.products bp on bp.id = bi.product_id
          left join public.product_variants bv on bv.id = bi.variant_id
          where bi.bundle_id = b.id
            and bp.product_type = 'physical'
        ),
        'available', (
          b.status = 'published'
          and not exists (
            select 1
            from public.bundle_items bi
            join public.products bp on bp.id = bi.product_id
            where bi.bundle_id = b.id
              and bp.status <> 'published'
          )
          and not exists (
            select 1
            from public.bundle_items bi
            join public.products bp on bp.id = bi.product_id
            left join public.product_variants bv on bv.id = bi.variant_id
            where bi.bundle_id = b.id
              and bp.product_type = 'physical'
              and coalesce(bv.stock_quantity, bp.stock_quantity, 0) < ci.quantity
          )
        ),
        'lineTotal', b.price_amount * ci.quantity
      ) as item,
      b.price_amount * ci.quantity as line_total,
      exists (
        select 1
        from public.bundle_items bi
        join public.products bp on bp.id = bi.product_id
        where bi.bundle_id = b.id
          and bp.product_type = 'physical'
      ) as has_physical,
      false as has_non_physical
    from public.cart_items ci
    join public.bundles b on b.id = ci.bundle_id
    where ci.cart_id = p_cart_id
      and ci.bundle_id is not null
  ),
  totals as (
    select
      lines.cart_id,
      jsonb_agg(lines.item order by lines.sort_at, lines.sort_id) as items,
      sum(lines.line_total)::int as subtotal,
      coalesce(bool_or(lines.has_physical), false) as has_physical,
      coalesce(bool_or(lines.has_non_physical), false) as has_non_physical
    from lines
    group by lines.cart_id
  ),
  discount as (
    select
      d.id,
      d.code,
      d.kind,
      d.value,
      case d.kind
        when 'percent' then least(
          round(coalesce(t.subtotal, 0) * d.value / 100.0)::int,
          coalesce(t.subtotal, 0)
        )
        else least(d.value, coalesce(t.subtotal, 0))
      end as amount
    from public.carts c
    join public.discount_codes d on d.id = c.discount_code_id
    left join totals t on t.cart_id = c.id
    where c.id = p_cart_id
      and d.store_id = c.store_id
      and d.active
      and (d.starts_at is null or d.starts_at <= now())
      and (d.expires_at is null or d.expires_at > now())
      and (d.max_uses is null or d.uses_count < d.max_uses)
      and coalesce(t.subtotal, 0) >= d.min_subtotal
  )
  select jsonb_build_object(
    'id', b.id,
    'storeId', b.store_id,
    'checkoutKey', b.checkout_key,
    'currency', b.currency,
    'subtotal', coalesce(t.subtotal, 0),
    'discountAmount', coalesce(dsc.amount, 0),
    'discount', case
      when dsc.id is null then null
      else jsonb_build_object(
        'code', dsc.code,
        'kind', dsc.kind,
        'value', dsc.value,
        'amount', dsc.amount
      )
    end,
    'shipping', case
      when coalesce(t.has_physical, false) then b.shipping_flat_amount
      else 0
    end,
    'total', coalesce(t.subtotal, 0) - coalesce(dsc.amount, 0) + case
      when coalesce(t.has_physical, false) then b.shipping_flat_amount
      else 0
    end,
    'codEligible', b.cod_enabled and not coalesce(t.has_non_physical, false),
    'items', coalesce(t.items, '[]'::jsonb)
  )
  from base b
  left join totals t on t.cart_id = b.id
  left join discount dsc on true;
$$;

revoke execute on function public.cart_payload(uuid)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Application et retrait d'un code
 * ------------------------------------------------------------------ */

create or replace function public.cart_apply_discount(
  p_token uuid,
  p_code  text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart     uuid;
  v_store    uuid;
  v_code     text;
  v_discount public.discount_codes%rowtype;
  v_subtotal integer;
begin
  select c.id, c.store_id into v_cart, v_store
  from public.carts c
  where c.token = p_token
    and c.status = 'open'
    and c.expires_at > now()
  for update;

  if v_cart is null then
    raise exception 'cart_unavailable' using errcode = '22023';
  end if;

  v_code := upper(btrim(coalesce(p_code, '')));

  if v_code = '' then
    raise exception 'discount_not_found' using errcode = '22023';
  end if;

  select d.* into v_discount
  from public.discount_codes d
  where d.store_id = v_store
    and d.code = v_code;

  if v_discount.id is null then
    raise exception 'discount_not_found' using errcode = '22023';
  end if;

  if not v_discount.active then
    raise exception 'discount_inactive' using errcode = '22023';
  end if;

  if v_discount.starts_at is not null and v_discount.starts_at > now() then
    raise exception 'discount_not_started' using errcode = '22023';
  end if;

  if v_discount.expires_at is not null and v_discount.expires_at <= now() then
    raise exception 'discount_expired' using errcode = '22023';
  end if;

  if v_discount.max_uses is not null
     and v_discount.uses_count >= v_discount.max_uses then
    raise exception 'discount_exhausted' using errcode = '22023';
  end if;

  v_subtotal := (public.cart_payload(v_cart)->>'subtotal')::int;

  if v_subtotal < v_discount.min_subtotal then
    raise exception 'discount_min_subtotal' using errcode = '22023';
  end if;

  update public.carts
  set discount_code_id = v_discount.id,
      updated_at = now()
  where id = v_cart;

  return public.cart_payload(v_cart);
end;
$$;

revoke execute on function public.cart_apply_discount(uuid, text)
  from public, anon, authenticated;
grant execute on function public.cart_apply_discount(uuid, text)
  to anon, authenticated;

create or replace function public.cart_remove_discount(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart uuid;
begin
  select c.id into v_cart
  from public.carts c
  where c.token = p_token
    and c.status = 'open'
    and c.expires_at > now();

  if v_cart is null then
    raise exception 'cart_unavailable' using errcode = '22023';
  end if;

  update public.carts
  set discount_code_id = null,
      updated_at = now()
  where id = v_cart;

  return public.cart_payload(v_cart);
end;
$$;

revoke execute on function public.cart_remove_discount(uuid)
  from public, anon, authenticated;
grant execute on function public.cart_remove_discount(uuid)
  to anon, authenticated;
