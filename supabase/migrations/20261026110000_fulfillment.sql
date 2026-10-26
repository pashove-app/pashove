-- Droits d'accès numériques et réservations de services.
--
-- Créés automatiquement quand une commande passe à « payée ». Un remboursement
-- révoque les accès et annule les rendez-vous. Le client ne peut lire que ses
-- propres droits ; le téléchargement passe par une RPC qui incrémente un quota.

create table public.digital_entitlements (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores (id) on delete cascade,
  order_id          uuid not null references public.orders (id) on delete cascade,
  order_item_id     uuid not null unique references public.order_items (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  file_id           uuid references public.media_assets (id) on delete set null,
  customer_email    text not null,
  customer_user_id  uuid references auth.users (id) on delete set null,
  download_count    integer not null default 0 check (download_count >= 0),
  max_downloads     integer not null default 3 check (max_downloads > 0),
  status            text not null default 'available'
    check (status in ('available', 'revoked', 'expired')),
  expires_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index digital_entitlements_customer_idx
  on public.digital_entitlements (customer_user_id, created_at desc);
create index digital_entitlements_email_idx
  on public.digital_entitlements (store_id, lower(customer_email));

create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores (id) on delete cascade,
  order_id          uuid not null references public.orders (id) on delete cascade,
  order_item_id     uuid not null unique references public.order_items (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  customer_user_id  uuid references auth.users (id) on delete set null,
  customer_email    text not null,
  customer_name     text not null,
  starts_at         timestamptz not null,
  duration_minutes  integer not null default 60 check (duration_minutes > 0),
  status            text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'completed')),
  created_at        timestamptz not null default now()
);

create index bookings_customer_idx
  on public.bookings (customer_user_id, starts_at desc);
create index bookings_email_idx
  on public.bookings (store_id, lower(customer_email));

create unique index bookings_slot_idx
  on public.bookings (product_id, starts_at)
  where status <> 'cancelled';

alter table public.digital_entitlements enable row level security;
alter table public.bookings enable row level security;

create policy digital_entitlements_select_own on public.digital_entitlements
  for select to authenticated
  using (
    customer_user_id = (select auth.uid())
    or (
      customer_user_id is null
      and lower(customer_email) = lower((select auth.jwt() ->> 'email'))
    )
    or public.is_store_member(store_id)
  );

create policy bookings_select_own on public.bookings
  for select to authenticated
  using (
    customer_user_id = (select auth.uid())
    or (
      customer_user_id is null
      and lower(customer_email) = lower((select auth.jwt() ->> 'email'))
    )
    or public.is_store_member(store_id)
  );

revoke all on public.digital_entitlements from public, anon, authenticated;
revoke all on public.bookings from public, anon, authenticated;
grant select on public.digital_entitlements to authenticated;
grant select on public.bookings to authenticated;

/* ------------------------------------------------------------------ *
 *  Création automatique à l'encaissement
 * ------------------------------------------------------------------ */

create or replace function public.fulfill_paid_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.payment_status = 'paid'
     and (tg_op = 'INSERT' or old.payment_status is distinct from 'paid') then
    insert into public.digital_entitlements (
      store_id, order_id, order_item_id, product_id, file_id,
      customer_email, customer_user_id, max_downloads
    )
    select
      new.store_id, new.id, oi.id, oi.product_id, p.digital_file_id,
      new.customer_email, new.customer_user_id, 3
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = new.id
      and oi.product_type = 'digital'
      and p.digital_file_id is not null
    on conflict (order_item_id) do nothing;

    insert into public.bookings (
      store_id, order_id, order_item_id, product_id,
      customer_user_id, customer_email, customer_name,
      starts_at, duration_minutes
    )
    select
      new.store_id, new.id, oi.id, oi.product_id,
      new.customer_user_id, new.customer_email, new.customer_name,
      oi.service_starts_at, coalesce(p.duration_minutes, 60)
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = new.id
      and oi.product_type = 'service'
      and oi.service_starts_at is not null
    on conflict (order_item_id) do nothing;
  elsif new.payment_status = 'refunded' then
    update public.digital_entitlements
    set status = 'revoked'
    where order_id = new.id
      and status = 'available';

    update public.bookings
    set status = 'cancelled'
    where order_id = new.id
      and status = 'confirmed';
  end if;

  return new;
end;
$$;

revoke execute on function public.fulfill_paid_order()
  from public, anon, authenticated;

create trigger orders_fulfill_paid
  after insert or update of payment_status on public.orders
  for each row execute function public.fulfill_paid_order();

/* ------------------------------------------------------------------ *
 *  Rattachement des droits lors de la réclamation des commandes
 * ------------------------------------------------------------------ */

create or replace function public.claim_guest_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_count integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  select u.email::text into v_email
  from auth.users u
  where u.id = v_uid;

  if v_email is null or v_email = '' then
    return 0;
  end if;

  update public.orders o
  set customer_user_id = v_uid
  where o.customer_user_id is null
    and lower(o.customer_email) = lower(v_email);

  get diagnostics v_count = row_count;

  update public.digital_entitlements e
  set customer_user_id = v_uid
  where e.customer_user_id is null
    and lower(e.customer_email) = lower(v_email);

  update public.bookings b
  set customer_user_id = v_uid
  where b.customer_user_id is null
    and lower(b.customer_email) = lower(v_email);

  return v_count;
end;
$$;

revoke execute on function public.claim_guest_orders()
  from public, anon, authenticated;
grant execute on function public.claim_guest_orders()
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture côté client
 * ------------------------------------------------------------------ */

create or replace function public.customer_entitlements(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select u.email::text into v_email from auth.users u where u.id = v_uid;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'productName', coalesce(p.name, 'Produit'),
          'fileName', m.file_name,
          'orderNumber', o.number,
          'downloadCount', e.download_count,
          'maxDownloads', e.max_downloads,
          'status', e.status,
          'createdAt', e.created_at,
          'expiresAt', e.expires_at
        )
        order by e.created_at desc
      )
      from public.digital_entitlements e
      join public.stores s on s.id = e.store_id
      join public.orders o on o.id = e.order_id
      left join public.products p on p.id = e.product_id
      left join public.media_assets m on m.id = e.file_id
      where s.slug = lower(btrim(p_slug))
        and (
          e.customer_user_id = v_uid
          or (e.customer_user_id is null and lower(e.customer_email) = lower(v_email))
        )
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.customer_entitlements(text)
  from public, anon, authenticated;
grant execute on function public.customer_entitlements(text)
  to authenticated;

create or replace function public.customer_bookings(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select u.email::text into v_email from auth.users u where u.id = v_uid;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'productName', coalesce(p.name, 'Service'),
          'orderNumber', o.number,
          'startsAt', b.starts_at,
          'durationMinutes', b.duration_minutes,
          'status', b.status,
          'createdAt', b.created_at
        )
        order by b.starts_at desc
      )
      from public.bookings b
      join public.stores s on s.id = b.store_id
      join public.orders o on o.id = b.order_id
      left join public.products p on p.id = b.product_id
      where s.slug = lower(btrim(p_slug))
        and (
          b.customer_user_id = v_uid
          or (b.customer_user_id is null and lower(b.customer_email) = lower(v_email))
        )
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.customer_bookings(text)
  from public, anon, authenticated;
grant execute on function public.customer_bookings(text)
  to authenticated;

/**
 * Réserve un téléchargement : vérifie le propriétaire, le statut et le quota,
 * incrémente le compteur, puis renvoie la clé R2 à signer côté serveur.
 */
create or replace function public.request_download(p_entitlement_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_item  record;
begin
  if v_uid is null then
    return null;
  end if;

  select u.email::text into v_email from auth.users u where u.id = v_uid;

  select
    e.*, m.object_key, m.file_name, s.slug
  into v_item
  from public.digital_entitlements e
  join public.stores s on s.id = e.store_id
  left join public.media_assets m on m.id = e.file_id
  where e.id = p_entitlement_id
  for update of e;

  if v_item.id is null
     or not (
       v_item.customer_user_id = v_uid
       or (v_item.customer_user_id is null and lower(v_item.customer_email) = lower(v_email))
     )
     or v_item.status <> 'available'
     or v_item.object_key is null
     or v_item.download_count >= v_item.max_downloads
     or (v_item.expires_at is not null and v_item.expires_at <= now()) then
    return null;
  end if;

  update public.digital_entitlements
  set download_count = download_count + 1
  where id = v_item.id;

  return jsonb_build_object(
    'objectKey', v_item.object_key,
    'fileName', v_item.file_name,
    'remaining', v_item.max_downloads - v_item.download_count - 1
  );
end;
$$;

revoke execute on function public.request_download(uuid)
  from public, anon, authenticated;
grant execute on function public.request_download(uuid)
  to authenticated;
