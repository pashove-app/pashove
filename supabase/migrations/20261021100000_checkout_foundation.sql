-- Socle du parcours d'achat : panier, commandes, paiements, réglages.

alter table public.stores
  add column shipping_flat_amount integer not null default 0
    check (shipping_flat_amount >= 0),
  add column cod_enabled boolean not null default true;

/* ------------------------------------------------------------------ *
 *  Panier
 *
 *  Le panier est anonyme et identifié par un jeton aléatoire gardé dans un
 *  cookie HttpOnly. Aucun accès direct anon : tout passe par les fonctions
 *  ci-dessous, qui ne reçoivent jamais de `store_id` du client.
 * ------------------------------------------------------------------ */

create table public.carts (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  token        uuid not null unique default gen_random_uuid(),
  status       text not null default 'open'
    check (status in ('open', 'converted', 'abandoned')),
  -- Jeton d'idempotence de la commande, stable pendant toute la session.
  checkout_key uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '30 days')
);

create index carts_store_status_idx
  on public.carts (store_id, status, updated_at desc);

create trigger carts_touch_updated_at
  before update on public.carts
  for each row execute function public.touch_updated_at();

create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts (id) on delete cascade,
  store_id   uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  quantity   integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index cart_items_line_idx
  on public.cart_items (
    cart_id,
    product_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create trigger cart_items_touch_updated_at
  before update on public.cart_items
  for each row execute function public.touch_updated_at();

create or replace function public.cart_items_assign_store()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid;
begin
  select c.store_id into v_store
  from public.carts c
  where c.id = new.cart_id;

  if v_store is null then
    raise exception 'invalid_cart' using errcode = '22023';
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
  ) then
    raise exception 'invalid_variant' using errcode = '22023';
  end if;

  new.store_id := v_store;
  return new;
end;
$$;

revoke execute on function public.cart_items_assign_store()
  from public, anon, authenticated;

create trigger cart_items_assign_store
  before insert or update on public.cart_items
  for each row execute function public.cart_items_assign_store();

/* ------------------------------------------------------------------ *
 *  Commandes et paiements
 * ------------------------------------------------------------------ */

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores (id) on delete cascade,
  number           integer not null check (number > 0),
  public_token     uuid not null unique default gen_random_uuid(),
  status           text not null default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status   text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded', 'failed')),
  payment_method   text not null default 'cod'
    check (payment_method in ('cod')),
  currency         text not null,
  subtotal_amount  integer not null check (subtotal_amount >= 0),
  shipping_amount  integer not null check (shipping_amount >= 0),
  total_amount     integer not null check (total_amount >= 0),
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text not null,
  shipping_country text not null,
  shipping_city    text not null,
  shipping_address text not null,
  shipping_extra   text,
  notes            text,
  idempotency_key  uuid not null unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  confirmed_at     timestamptz,
  cancelled_at     timestamptz,

  unique (store_id, number)
);

create index orders_store_created_idx
  on public.orders (store_id, created_at desc);

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  store_id      uuid not null references public.stores (id) on delete cascade,
  -- Références facultatives : la commande garde ses instantanés même si le
  -- produit ou la variante disparaît du catalogue.
  product_id    uuid references public.products (id) on delete set null,
  variant_id    uuid references public.product_variants (id) on delete set null,
  product_name  text not null,
  variant_label text,
  sku           text,
  image_key     text,
  product_type  text not null
    check (product_type in ('physical', 'digital', 'service')),
  unit_price    integer not null check (unit_price >= 0),
  quantity      integer not null check (quantity between 1 and 99),
  line_total    integer not null check (line_total >= 0)
);

create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  store_id   uuid not null references public.stores (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  store_id        uuid not null references public.stores (id) on delete cascade,
  provider        text not null check (provider in ('cod')),
  status          text not null default 'pending'
    check (status in ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  amount          integer not null check (amount >= 0),
  currency        text not null,
  reference       text,
  idempotency_key text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (order_id, provider)
);

create trigger payments_touch_updated_at
  before update on public.payments
  for each row execute function public.touch_updated_at();

create table public.payment_transactions (
  id                 uuid primary key default gen_random_uuid(),
  payment_id         uuid not null references public.payments (id) on delete cascade,
  store_id           uuid not null references public.stores (id) on delete cascade,
  type               text not null,
  status             text not null,
  provider_reference text,
  payload            jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create index payment_transactions_payment_idx
  on public.payment_transactions (payment_id, created_at);

/* ------------------------------------------------------------------ *
 *  RLS
 *
 *  Le public n'a aucun accès direct : les fonctions security definer sont
 *  la seule porte, avec un jeton de panier ou de commande.
 * ------------------------------------------------------------------ */

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.payments enable row level security;
alter table public.payment_transactions enable row level security;

create policy carts_select_member on public.carts
  for select to authenticated
  using (public.is_store_member(store_id));

create policy cart_items_select_member on public.cart_items
  for select to authenticated
  using (public.is_store_member(store_id));

create policy orders_select_member on public.orders
  for select to authenticated
  using (public.is_store_member(store_id));

create policy order_items_select_member on public.order_items
  for select to authenticated
  using (public.is_store_member(store_id));

create policy order_events_select_member on public.order_events
  for select to authenticated
  using (public.is_store_member(store_id));

create policy payments_select_member on public.payments
  for select to authenticated
  using (public.is_store_member(store_id));

create policy payment_transactions_select_member on public.payment_transactions
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.carts from anon, authenticated;
revoke all on public.cart_items from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
revoke all on public.order_events from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.payment_transactions from anon, authenticated;

grant select on public.carts to authenticated;
grant select on public.cart_items to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.order_events to authenticated;
grant select on public.payments to authenticated;
grant select on public.payment_transactions to authenticated;

/* ------------------------------------------------------------------ *
 *  Panier — lecture et écriture par jeton
 * ------------------------------------------------------------------ */

create or replace function public.cart_payload(p_cart_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', c.id,
    'token', c.token,
    'storeId', c.store_id,
    'checkoutKey', c.checkout_key,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ci.id,
            'productId', ci.product_id,
            'variantId', ci.variant_id,
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
            )
          )
          order by ci.created_at
        )
        from public.cart_items ci
        join public.products p on p.id = ci.product_id
        left join public.product_variants v on v.id = ci.variant_id
        where ci.cart_id = c.id
      ),
      '[]'::jsonb
    )
  )
  from public.carts c
  where c.id = p_cart_id;
$$;

revoke execute on function public.cart_payload(uuid)
  from public, anon, authenticated;

/** Ouvre (ou retrouve) le panier d'une boutique pour un jeton donné. */
create or replace function public.cart_open(
  p_slug  text,
  p_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid;
  v_cart  uuid;
begin
  select s.id into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store is null then
    raise exception 'store_unavailable' using errcode = '22023';
  end if;

  if p_token is not null then
    select c.id into v_cart
    from public.carts c
    where c.token = p_token
      and c.store_id = v_store
      and c.status = 'open'
      and c.expires_at > now();
  end if;

  if v_cart is null then
    insert into public.carts (store_id)
    values (v_store)
    returning id into v_cart;
  else
    update public.carts set updated_at = now() where id = v_cart;
  end if;

  return public.cart_payload(v_cart);
end;
$$;

create or replace function public.cart_get(p_token uuid)
returns jsonb
language plpgsql
stable
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
    return null;
  end if;

  return public.cart_payload(v_cart);
end;
$$;

/**
 * Ajoute une ligne. Le prix et le stock ne viennent jamais du client : ils
 * sont relus à chaque appel, et la quantité est plafonnée au stock.
 */
create or replace function public.cart_add(
  p_token      uuid,
  p_product_id uuid,
  p_variant_id uuid default null,
  p_quantity   integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart       uuid;
  v_store      uuid;
  v_product    public.products%rowtype;
  v_variant    public.product_variants%rowtype;
  v_max        integer;
  v_quantity   integer;
  v_item       uuid;
  v_item_qty   integer;
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

  select p.* into v_product
  from public.products p
  where p.id = p_product_id
    and p.store_id = v_store
    and p.status = 'published';

  if v_product.id is null then
    raise exception 'product_unavailable' using errcode = '22023';
  end if;

  if jsonb_array_length(v_product.options) > 0 then
    if p_variant_id is null then
      raise exception 'variant_required' using errcode = '22023';
    end if;

    select v.* into v_variant
    from public.product_variants v
    where v.id = p_variant_id
      and v.product_id = v_product.id;
  else
    if p_variant_id is not null then
      raise exception 'invalid_variant' using errcode = '22023';
    end if;
  end if;

  if jsonb_array_length(v_product.options) > 0 and v_variant.id is null then
    raise exception 'invalid_variant' using errcode = '22023';
  end if;

  if v_product.product_type = 'physical' then
    v_max := coalesce(v_variant.stock_quantity, v_product.stock_quantity, 0);

    if v_max <= 0 then
      raise exception 'out_of_stock' using errcode = '22023';
    end if;

    v_quantity := least(greatest(coalesce(p_quantity, 1), 1), v_max);
  else
    -- Un fichier ou une prestation se commande à l'unité.
    v_quantity := 1;
  end if;

  select ci.id, ci.quantity into v_item, v_item_qty
  from public.cart_items ci
  where ci.cart_id = v_cart
    and ci.product_id = p_product_id
    and ci.variant_id is not distinct from p_variant_id;

  if v_item is null then
    insert into public.cart_items (cart_id, store_id, product_id, variant_id, quantity)
    values (v_cart, v_store, p_product_id, p_variant_id, v_quantity);
  else
    update public.cart_items
    set quantity = least(v_item_qty + v_quantity, coalesce(v_max, 99))
    where id = v_item;
  end if;

  update public.carts set updated_at = now() where id = v_cart;

  return public.cart_payload(v_cart);
end;
$$;

create or replace function public.cart_set_quantity(
  p_token   uuid,
  p_item_id uuid,
  p_quantity integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart   uuid;
  v_item   public.cart_items%rowtype;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_max    integer;
begin
  select c.id into v_cart
  from public.carts c
  where c.token = p_token
    and c.status = 'open'
    and c.expires_at > now();

  if v_cart is null then
    raise exception 'cart_unavailable' using errcode = '22023';
  end if;

  select ci.* into v_item
  from public.cart_items ci
  where ci.id = p_item_id and ci.cart_id = v_cart;

  if v_item.id is null then
    raise exception 'item_unavailable' using errcode = '22023';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    delete from public.cart_items where id = v_item.id;
    update public.carts set updated_at = now() where id = v_cart;
    return public.cart_payload(v_cart);
  end if;

  select p.* into v_product from public.products p where p.id = v_item.product_id;

  if v_item.variant_id is not null then
    select v.* into v_variant from public.product_variants v where v.id = v_item.variant_id;
  end if;

  if v_product.product_type = 'physical' then
    v_max := coalesce(v_variant.stock_quantity, v_product.stock_quantity, 0);
    if v_max <= 0 then
      raise exception 'out_of_stock' using errcode = '22023';
    end if;
    update public.cart_items
    set quantity = least(greatest(p_quantity, 1), v_max)
    where id = v_item.id;
  else
    update public.cart_items set quantity = 1 where id = v_item.id;
  end if;

  update public.carts set updated_at = now() where id = v_cart;

  return public.cart_payload(v_cart);
end;
$$;

create or replace function public.cart_remove(
  p_token   uuid,
  p_item_id uuid
)
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

  delete from public.cart_items
  where id = p_item_id and cart_id = v_cart;

  update public.carts set updated_at = now() where id = v_cart;

  return public.cart_payload(v_cart);
end;
$$;

/* ------------------------------------------------------------------ *
 *  Commande — COD uniquement, dans une transaction
 * ------------------------------------------------------------------ */

create or replace function public.place_order(
  p_token           uuid,
  p_customer        jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart       public.carts%rowtype;
  v_store      public.stores%rowtype;
  v_country    text;
  v_name       text;
  v_email      text;
  v_phone      text;
  v_city       text;
  v_address    text;
  v_extra      text;
  v_notes      text;
  v_item       record;
  v_product    public.products%rowtype;
  v_variant    public.product_variants%rowtype;
  v_stock      integer;
  v_price      integer;
  v_subtotal   integer := 0;
  v_shipping   integer := 0;
  v_total      integer := 0;
  v_number     integer;
  v_order_id   uuid;
  v_order_token uuid;
  v_lines      jsonb := '[]'::jsonb;
  v_label      text;
  v_image_key  text;
  v_existing   public.orders%rowtype;
begin
  -- Deux requêtes simultanées avec la même clé sont sérialisées ici.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select o.* into v_existing
  from public.orders o
  where o.idempotency_key = p_idempotency_key;

  if v_existing.id is not null then
    return jsonb_build_object(
      'orderId', v_existing.id,
      'token', v_existing.public_token,
      'number', v_existing.number
    );
  end if;

  select c.* into v_cart
  from public.carts c
  where c.token = p_token
    and c.status = 'open'
    and c.expires_at > now()
  for update;

  if v_cart.id is null then
    raise exception 'cart_unavailable' using errcode = '22023';
  end if;

  if v_cart.checkout_key <> p_idempotency_key then
    raise exception 'invalid_checkout' using errcode = '22023';
  end if;

  if not exists (select 1 from public.cart_items ci where ci.cart_id = v_cart.id) then
    raise exception 'cart_empty' using errcode = '22023';
  end if;

  select s.* into v_store
  from public.stores s
  where s.id = v_cart.store_id
  for update;

  if v_store.status <> 'active' then
    raise exception 'store_unavailable' using errcode = '22023';
  end if;

  v_name    := btrim(coalesce(p_customer->>'name', ''));
  v_email   := btrim(coalesce(p_customer->>'email', ''));
  v_phone   := btrim(coalesce(p_customer->>'phone', ''));
  v_country := upper(btrim(coalesce(p_customer->>'country', '')));
  v_city    := btrim(coalesce(p_customer->>'city', ''));
  v_address := btrim(coalesce(p_customer->>'address', ''));
  v_extra   := nullif(btrim(coalesce(p_customer->>'extra', '')), '');
  v_notes   := nullif(btrim(coalesce(p_customer->>'notes', '')), '');

  if v_name = '' or v_city = '' or v_address = '' or v_country = '' then
    raise exception 'customer_incomplete' using errcode = '22023';
  end if;

  if v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'customer_invalid' using errcode = '22023';
  end if;

  if char_length(v_phone) < 6 then
    raise exception 'customer_invalid' using errcode = '22023';
  end if;

  for v_item in
    select ci.id, ci.product_id, ci.variant_id, ci.quantity
    from public.cart_items ci
    where ci.cart_id = v_cart.id
    order by ci.product_id, ci.variant_id nulls first
  loop
    select p.* into v_product
    from public.products p
    where p.id = v_item.product_id
    for update;

    if v_product.id is null
      or v_product.store_id <> v_store.id
      or v_product.status <> 'published' then
      raise exception 'product_unavailable' using errcode = '22023';
    end if;

    -- Le paiement à la livraison ne concerne que les objets physiques.
    if v_product.product_type <> 'physical' then
      raise exception 'cod_unavailable' using errcode = '22023';
    end if;

    if array_length(v_product.shipping_countries, 1) is not null
      and not (v_country = any (v_product.shipping_countries)) then
      raise exception 'country_not_allowed' using errcode = '22023';
    end if;

    if v_item.variant_id is not null then
      select v.* into v_variant
      from public.product_variants v
      where v.id = v_item.variant_id
        and v.product_id = v_product.id
      for update;

      if v_variant.id is null then
        raise exception 'product_unavailable' using errcode = '22023';
      end if;

      v_stock := v_variant.stock_quantity;
      v_price := v_variant.price_amount;

      if v_stock < v_item.quantity then
        raise exception 'out_of_stock' using errcode = '22023';
      end if;

      update public.product_variants
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_variant.id;

      select string_agg(entry.value, ' · ' order by entry.key)
      into v_label
      from jsonb_each_text(v_variant.option_values) as entry;
    else
      v_stock := coalesce(v_product.stock_quantity, 0);
      v_price := v_product.price_amount;
      v_label := null;

      if v_stock < v_item.quantity then
        raise exception 'out_of_stock' using errcode = '22023';
      end if;

      update public.products
      set stock_quantity = stock_quantity - v_item.quantity
      where id = v_product.id;
    end if;

    select m.object_key into v_image_key
    from public.product_images pi
    join public.media_assets m on m.id = pi.media_id
    where pi.product_id = v_product.id
    order by pi.position
    limit 1;

    v_subtotal := v_subtotal + (v_price * v_item.quantity);

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'variant_id', v_item.variant_id,
      'product_name', v_product.name,
      'variant_label', v_label,
      'sku', case when v_item.variant_id is not null then v_variant.sku else null end,
      'image_key', v_image_key,
      'product_type', v_product.product_type,
      'unit_price', v_price,
      'quantity', v_item.quantity,
      'line_total', v_price * v_item.quantity
    );
  end loop;

  v_shipping := v_store.shipping_flat_amount;
  v_total := v_subtotal + v_shipping;

  select coalesce(max(o.number), 0) + 1 into v_number
  from public.orders o
  where o.store_id = v_store.id;

  insert into public.orders (
    store_id, number, status, payment_status, payment_method, currency,
    subtotal_amount, shipping_amount, total_amount,
    customer_name, customer_email, customer_phone,
    shipping_country, shipping_city, shipping_address, shipping_extra,
    notes, idempotency_key
  )
  values (
    v_store.id, v_number, 'pending', 'pending', 'cod', v_store.currency,
    v_subtotal, v_shipping, v_total,
    v_name, v_email, v_phone,
    v_country, v_city, v_address, v_extra,
    v_notes, p_idempotency_key
  )
  returning id, public_token into v_order_id, v_order_token;

  insert into public.order_items (
    order_id, store_id, product_id, variant_id, product_name, variant_label,
    sku, image_key, product_type, unit_price, quantity, line_total
  )
  select
    v_order_id, v_store.id, item.product_id, item.variant_id, item.product_name,
    item.variant_label, item.sku, item.image_key, item.product_type,
    item.unit_price, item.quantity, item.line_total
  from jsonb_to_recordset(v_lines) as item(
    product_id uuid, variant_id uuid, product_name text, variant_label text,
    sku text, image_key text, product_type text, unit_price integer,
    quantity integer, line_total integer
  );

  insert into public.order_events (order_id, store_id, type, payload)
  values (
    v_order_id,
    v_store.id,
    'created',
    jsonb_build_object('payment_method', 'cod', 'total', v_total)
  );

  insert into public.payments (
    order_id, store_id, provider, status, amount, currency, idempotency_key
  )
  values (
    v_order_id, v_store.id, 'cod', 'pending', v_total, v_store.currency,
    p_idempotency_key::text
  );

  update public.carts
  set status = 'converted', updated_at = now()
  where id = v_cart.id;

  return jsonb_build_object(
    'orderId', v_order_id,
    'token', v_order_token,
    'number', v_number
  );
end;
$$;

/* ------------------------------------------------------------------ *
 *  Suivi public par jeton
 * ------------------------------------------------------------------ */

create or replace function public.public_order(
  p_slug  text,
  p_token uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select o.* into v_order
  from public.orders o
  join public.stores s on s.id = o.store_id
  where o.public_token = p_token
    and s.slug = lower(btrim(p_slug));

  if v_order.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_order.id,
    'number', v_order.number,
    'status', v_order.status,
    'paymentStatus', v_order.payment_status,
    'paymentMethod', v_order.payment_method,
    'currency', v_order.currency,
    'subtotal', v_order.subtotal_amount,
    'shipping', v_order.shipping_amount,
    'total', v_order.total_amount,
    'createdAt', v_order.created_at,
    'customerName', v_order.customer_name,
    'country', v_order.shipping_country,
    'city', v_order.shipping_city,
    'address', v_order.shipping_address,
    'extra', v_order.shipping_extra,
    'notes', v_order.notes,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', oi.product_name,
            'variantLabel', oi.variant_label,
            'sku', oi.sku,
            'imageKey', oi.image_key,
            'productType', oi.product_type,
            'unitPrice', oi.unit_price,
            'quantity', oi.quantity,
            'lineTotal', oi.line_total
          )
          order by oi.id
        )
        from public.order_items oi
        where oi.order_id = v_order.id
      ),
      '[]'::jsonb
    )
  );
end;
$$;

/* ------------------------------------------------------------------ *
 *  Droits
 * ------------------------------------------------------------------ */

revoke execute on function public.cart_open(text, uuid)
  from public, anon, authenticated;
revoke execute on function public.cart_get(uuid)
  from public, anon, authenticated;
revoke execute on function public.cart_add(uuid, uuid, uuid, integer)
  from public, anon, authenticated;
revoke execute on function public.cart_set_quantity(uuid, uuid, integer)
  from public, anon, authenticated;
revoke execute on function public.cart_remove(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.place_order(uuid, jsonb, uuid)
  from public, anon, authenticated;
revoke execute on function public.public_order(text, uuid)
  from public, anon, authenticated;

grant execute on function public.cart_open(text, uuid) to anon, authenticated;
grant execute on function public.cart_get(uuid) to anon, authenticated;
grant execute on function public.cart_add(uuid, uuid, uuid, integer) to anon, authenticated;
grant execute on function public.cart_set_quantity(uuid, uuid, integer) to anon, authenticated;
grant execute on function public.cart_remove(uuid, uuid) to anon, authenticated;
grant execute on function public.place_order(uuid, jsonb, uuid) to anon, authenticated;
grant execute on function public.public_order(text, uuid) to anon, authenticated;
