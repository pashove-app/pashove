-- G1 : cadeaux.
--
-- Une commande peut être offerte. Le destinataire ne reçoit ni le fichier ni le
-- rendez-vous à la place de l'acheteur : les droits numériques sont créés puis
-- immédiatement verrouillés et réadressés au destinataire. Le jeton de
-- réclamation est la seule clé qui les débloque, une fois.

alter table public.stores
  add column if not exists gift_enabled boolean not null default true;

alter table public.orders
  add column if not exists is_gift boolean not null default false,
  add column if not exists gift_scheduled_at timestamptz;

alter table public.digital_entitlements
  drop constraint if exists digital_entitlements_status_check;

alter table public.digital_entitlements
  add constraint digital_entitlements_status_check
  check (status in ('available', 'locked', 'revoked', 'expired'));

create table if not exists public.gift_claims (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null unique references public.orders (id) on delete cascade,
  store_id        uuid not null references public.stores (id) on delete cascade,
  -- 32 caractères hexadécimaux : assez pour un lien secret, assez court pour
  -- tenir dans une URL d'e-mail.
  token           text not null unique
                  default replace(gen_random_uuid()::text, '-', ''),
  recipient_name  text not null
                  check (char_length(btrim(recipient_name)) between 2 and 120),
  recipient_email text not null
                  check (char_length(recipient_email) <= 254 and recipient_email like '%@%'),
  message         text
                  check (message is null or char_length(message) <= 500),
  status          text not null default 'pending'
                  check (status in ('pending', 'claimed', 'expired', 'cancelled')),
  scheduled_at    timestamptz not null default now(),
  claimed_at      timestamptz,
  claimed_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists gift_claims_store_idx
  on public.gift_claims (store_id, created_at desc);

create index if not exists gift_claims_recipient_idx
  on public.gift_claims (lower(recipient_email), created_at desc);

alter table public.gift_claims enable row level security;
revoke all on public.gift_claims from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Création du cadeau après paiement
 * ------------------------------------------------------------------ */

create or replace function public.create_gift_claim(
  p_order_token     uuid,
  p_recipient_name  text,
  p_recipient_email text,
  p_message         text default null,
  p_scheduled_at    timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders%rowtype;
  v_store   public.stores%rowtype;
  v_claim   public.gift_claims%rowtype;
  v_name    text := btrim(coalesce(p_recipient_name, ''));
  v_email   text := lower(btrim(coalesce(p_recipient_email, '')));
  v_message text := nullif(btrim(coalesce(p_message, '')), '');
  v_when    timestamptz;
  v_services integer;
begin
  select o.* into v_order
  from public.orders o
  where o.public_token = p_order_token
  for update;

  if v_order.id is null then
    raise exception 'order_not_found' using errcode = '22023';
  end if;

  if v_order.payment_status <> 'paid' then
    raise exception 'order_not_paid' using errcode = '22023';
  end if;

  select s.* into v_store from public.stores s where s.id = v_order.store_id;

  if not coalesce(v_store.gift_enabled, true) then
    raise exception 'gift_disabled' using errcode = '22023';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'gift_name_invalid' using errcode = '22023';
  end if;

  if v_email = '' or v_email not like '%@%' or char_length(v_email) > 254 then
    raise exception 'gift_email_invalid' using errcode = '22023';
  end if;

  if v_message is not null and char_length(v_message) > 500 then
    raise exception 'gift_message_too_long' using errcode = '22023';
  end if;

  if exists (select 1 from public.gift_claims g where g.order_id = v_order.id) then
    raise exception 'gift_exists' using errcode = '22023';
  end if;

  select count(*) into v_services
  from public.order_items oi
  where oi.order_id = v_order.id
    and oi.product_type = 'service';

  if v_services > 1 then
    raise exception 'gift_multiple_services' using errcode = '22023';
  end if;

  v_when := greatest(coalesce(p_scheduled_at, now()), now());

  update public.orders
  set is_gift = true,
      gift_scheduled_at = v_when
  where id = v_order.id;

  insert into public.gift_claims (
    order_id, store_id, recipient_name, recipient_email, message, scheduled_at
  )
  values (v_order.id, v_order.store_id, v_name, v_email, v_message, v_when)
  returning * into v_claim;

  -- Le fichier a été créé par le trigger de paiement. On le verrouille et on
  -- change son adresse : l'acheteur ne le verra plus dans son espace.
  update public.digital_entitlements e
  set status = 'locked',
      customer_email = v_email,
      customer_user_id = null
  where e.order_id = v_order.id;

  -- Le créneau choisi par l'acheteur est libéré. Le destinataire en choisira
  -- un à la réclamation.
  update public.bookings b
  set status = 'cancelled',
      customer_email = v_email,
      customer_name = v_name,
      customer_user_id = null
  where b.order_id = v_order.id
    and b.status = 'confirmed';

  return jsonb_build_object(
    'token', v_claim.token,
    'scheduledAt', v_claim.scheduled_at,
    'recipientEmail', v_claim.recipient_email
  );
end;
$$;

revoke execute on function public.create_gift_claim(uuid, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.create_gift_claim(uuid, text, text, text, timestamptz)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture publique du cadeau
 * ------------------------------------------------------------------ */

create or replace function public.gift_claim_info(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.gift_claims%rowtype;
  v_order public.orders%rowtype;
  v_store public.stores%rowtype;
  v_service record;
  v_logo_key text;
begin
  select g.* into v_claim
  from public.gift_claims g
  where g.token = btrim(coalesce(p_token, ''));

  if v_claim.id is null then
    return null;
  end if;

  if v_claim.status = 'pending'
     and v_claim.created_at < now() - interval '90 days' then
    update public.gift_claims
    set status = 'expired', updated_at = now()
    where id = v_claim.id;
    v_claim.status := 'expired';
  end if;

  select o.* into v_order from public.orders o where o.id = v_claim.order_id;
  select s.* into v_store from public.stores s where s.id = v_claim.store_id;

  select m.object_key into v_logo_key
  from public.media_assets m
  where m.id = v_store.logo_media_id;

  select p.id, p.duration_minutes
  into v_service
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  where oi.order_id = v_order.id
    and oi.product_type = 'service'
  limit 1;

  return jsonb_build_object(
    'token', v_claim.token,
    'status', v_claim.status,
    'recipientName', v_claim.recipient_name,
    'message', v_claim.message,
    'scheduledAt', v_claim.scheduled_at,
    'claimedAt', v_claim.claimed_at,
    'expiresAt', v_claim.created_at + interval '90 days',
    'buyerName', v_order.customer_name,
    'orderNumber', v_order.number,
    'currency', v_order.currency,
    'total', v_order.total_amount,
    'storeName', v_store.name,
    'storeSlug', v_store.slug,
    'storeLogoKey', v_logo_key,
    'canClaim', (
      v_claim.status = 'pending'
      and v_claim.scheduled_at <= now()
    ),
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', oi.product_name,
            'variantLabel', oi.variant_label,
            'productType', oi.product_type,
            'quantity', oi.quantity,
            'imageKey', oi.image_key,
            'lineTotal', oi.line_total
          )
          order by oi.id
        )
        from public.order_items oi
        where oi.order_id = v_order.id
      ),
      '[]'::jsonb
    ),
    'hasPhysical', exists (
      select 1 from public.order_items oi
      where oi.order_id = v_order.id
        and oi.product_type in ('physical', 'bundle')
    ),
    'hasDigital', exists (
      select 1 from public.order_items oi
      where oi.order_id = v_order.id
        and oi.product_type = 'digital'
    ),
    'hasService', v_service.id is not null,
    'serviceProductId', v_service.id,
    'serviceDuration', coalesce(v_service.duration_minutes, 60),
    'bookedSlots', coalesce(
      (
        select jsonb_agg(to_jsonb(b.starts_at) order by b.starts_at)
        from public.bookings b
        where b.product_id = v_service.id
          and b.status = 'confirmed'
          and b.starts_at > now()
      ),
      '[]'::jsonb
    ),
    'digitalItems', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'entitlementId', e.id,
            'productName', coalesce(p.name, 'Produit'),
            'fileName', m.file_name,
            'remaining', e.max_downloads - e.download_count,
            'status', e.status
          )
          order by e.created_at
        )
        from public.digital_entitlements e
        left join public.products p on p.id = e.product_id
        left join public.media_assets m on m.id = e.file_id
        where e.order_id = v_order.id
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke execute on function public.gift_claim_info(text)
  from public, anon, authenticated;
grant execute on function public.gift_claim_info(text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Réclamation atomique
 * ------------------------------------------------------------------ */

create or replace function public.gift_claim(
  p_token             text,
  p_country           text default null,
  p_city              text default null,
  p_address           text default null,
  p_extra             text default null,
  p_phone             text default null,
  p_service_starts_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim   public.gift_claims%rowtype;
  v_order   public.orders%rowtype;
  v_service record;
  v_uid     uuid := (select auth.uid());
  v_has_physical boolean;
  v_has_digital  boolean;
begin
  select g.* into v_claim
  from public.gift_claims g
  where g.token = btrim(coalesce(p_token, ''))
  for update;

  if v_claim.id is null then
    raise exception 'gift_not_found' using errcode = '22023';
  end if;

  if v_claim.status = 'claimed' then
    return jsonb_build_object(
      'status', 'claimed',
      'already', true,
      'token', v_claim.token
    );
  end if;

  if v_claim.status <> 'pending' then
    raise exception 'gift_not_available' using errcode = '22023';
  end if;

  if v_claim.created_at < now() - interval '90 days' then
    update public.gift_claims
    set status = 'expired', updated_at = now()
    where id = v_claim.id;
    raise exception 'gift_expired' using errcode = '22023';
  end if;

  if v_claim.scheduled_at > now() then
    raise exception 'gift_not_ready' using errcode = '22023';
  end if;

  select o.* into v_order from public.orders o where o.id = v_claim.order_id;

  select exists (
    select 1 from public.order_items oi
    where oi.order_id = v_order.id
      and oi.product_type in ('physical', 'bundle')
  ) into v_has_physical;

  select exists (
    select 1 from public.order_items oi
    where oi.order_id = v_order.id
      and oi.product_type = 'digital'
  ) into v_has_digital;

  select p.id, p.duration_minutes
  into v_service
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  where oi.order_id = v_order.id
    and oi.product_type = 'service'
  limit 1;

  if v_has_physical then
    if char_length(btrim(coalesce(p_address, ''))) < 5
       or char_length(btrim(coalesce(p_city, ''))) < 2
       or char_length(btrim(coalesce(p_country, ''))) <> 2 then
      raise exception 'gift_address_required' using errcode = '22023';
    end if;

    update public.orders
    set shipping_country = upper(btrim(p_country)),
        shipping_city = btrim(p_city),
        shipping_address = btrim(p_address),
        shipping_extra = nullif(btrim(coalesce(p_extra, '')), ''),
        customer_phone = coalesce(nullif(btrim(coalesce(p_phone, '')), ''), customer_phone)
    where id = v_order.id;
  end if;

  if v_service.id is not null then
    if p_service_starts_at is null or p_service_starts_at <= now() then
      raise exception 'gift_slot_required' using errcode = '22023';
    end if;

    begin
      update public.bookings b
      set starts_at = p_service_starts_at,
          customer_user_id = v_uid,
          customer_email = v_claim.recipient_email,
          customer_name = v_claim.recipient_name,
          status = 'confirmed'
      where b.order_item_id = (
        select oi.id from public.order_items oi
        where oi.order_id = v_order.id
          and oi.product_type = 'service'
        limit 1
      );
    exception when unique_violation then
      raise exception 'gift_slot_taken' using errcode = '22023';
    end;
  end if;

  if v_has_digital then
    update public.digital_entitlements e
    set status = 'available',
        customer_email = v_claim.recipient_email,
        customer_user_id = v_uid
    where e.order_id = v_order.id
      and e.status = 'locked';
  end if;

  update public.gift_claims
  set status = 'claimed',
      claimed_at = now(),
      claimed_by = v_uid,
      updated_at = now()
  where id = v_claim.id;

  return jsonb_build_object(
    'status', 'claimed',
    'token', v_claim.token,
    'hasPhysical', v_has_physical,
    'hasDigital', v_has_digital,
    'hasService', v_service.id is not null
  );
end;
$$;

revoke execute on function public.gift_claim(text, text, text, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.gift_claim(text, text, text, text, text, text, timestamptz)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Téléchargement invité, lié au jeton du cadeau
 * ------------------------------------------------------------------ */

create or replace function public.gift_download(
  p_token         text,
  p_entitlement_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.gift_claims%rowtype;
  v_item  record;
begin
  select g.* into v_claim
  from public.gift_claims g
  where g.token = btrim(coalesce(p_token, ''))
    and g.status = 'claimed';

  if v_claim.id is null then
    return null;
  end if;

  select e.*, m.object_key, m.file_name
  into v_item
  from public.digital_entitlements e
  join public.media_assets m on m.id = e.file_id
  where e.id = p_entitlement_id
    and e.order_id = v_claim.order_id
    and e.status = 'available'
  for update of e;

  if v_item.id is null
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

revoke execute on function public.gift_download(text, uuid)
  from public, anon, authenticated;
grant execute on function public.gift_download(text, uuid)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Côté marchand
 * ------------------------------------------------------------------ */

create or replace function public.store_gift_claims(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'token', g.token,
          'status', g.status,
          'recipientName', g.recipient_name,
          'recipientEmail', g.recipient_email,
          'message', g.message,
          'scheduledAt', g.scheduled_at,
          'claimedAt', g.claimed_at,
          'createdAt', g.created_at,
          'orderId', o.id,
          'orderNumber', o.number,
          'buyerName', o.customer_name,
          'total', o.total_amount,
          'currency', o.currency,
          'items', coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'name', oi.product_name,
                  'productType', oi.product_type,
                  'quantity', oi.quantity
                )
                order by oi.id
              )
              from public.order_items oi
              where oi.order_id = o.id
            ),
            '[]'::jsonb
          )
        )
        order by g.created_at desc
      )
      from public.gift_claims g
      join public.orders o on o.id = g.order_id
      where g.store_id = p_store_id
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.store_gift_claims(uuid)
  from public, anon, authenticated;
grant execute on function public.store_gift_claims(uuid)
  to authenticated;

create or replace function public.received_gift_claims()
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

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'token', g.token,
          'status', g.status,
          'recipientName', g.recipient_name,
          'message', g.message,
          'scheduledAt', g.scheduled_at,
          'claimedAt', g.claimed_at,
          'createdAt', g.created_at,
          'orderNumber', o.number,
          'storeName', s.name,
          'storeSlug', s.slug,
          'items', coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'name', oi.product_name,
                  'productType', oi.product_type,
                  'quantity', oi.quantity
                )
                order by oi.id
              )
              from public.order_items oi
              where oi.order_id = o.id
            ),
            '[]'::jsonb
          )
        )
        order by g.created_at desc
      )
      from public.gift_claims g
      join public.orders o on o.id = g.order_id
      join public.stores s on s.id = g.store_id
      where lower(g.recipient_email) = v_email
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.received_gift_claims()
  from public, anon, authenticated;
grant execute on function public.received_gift_claims()
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Remboursement : révoquer les droits verrouillés et annuler le cadeau
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
      and status in ('available', 'locked');

    update public.bookings
    set status = 'cancelled'
    where order_id = new.id
      and status = 'confirmed';

    update public.gift_claims
    set status = 'cancelled', updated_at = now()
    where order_id = new.id
      and status in ('pending', 'claimed');
  end if;

  return new;
end;
$$;

revoke execute on function public.fulfill_paid_order()
  from public, anon, authenticated;
