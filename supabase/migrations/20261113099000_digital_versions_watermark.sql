-- PASHOVE — Versioning des fichiers numériques, watermark et anti-partage
--
-- Chaque fichier numérique livré est rattaché à une version figée au moment de
-- l'achat. Le téléchargement est servi avec un filigrane propre à l'acheteur
-- (e-mail, commande, date) et les adresses IP distinctes sont limitées.

create table public.product_digital_versions (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  version    integer not null check (version > 0),
  media_id   uuid not null references public.media_assets (id) on delete restrict,
  notes      text check (notes is null or char_length(notes) <= 300),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (product_id, version)
);

create index product_digital_versions_product_idx
  on public.product_digital_versions (product_id, version desc);

alter table public.product_digital_versions enable row level security;
revoke all on public.product_digital_versions from public, anon, authenticated;
grant select on public.product_digital_versions to authenticated;

create policy product_digital_versions_select on public.product_digital_versions
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

/* Version 1 pour les fichiers déjà en place. */
insert into public.product_digital_versions (store_id, product_id, version, media_id, notes)
select p.store_id, p.id, 1, p.digital_file_id, 'Version initiale'
from public.products p
where p.product_type = 'digital'
  and p.digital_file_id is not null
on conflict (product_id, version) do nothing;

alter table public.digital_entitlements
  add column if not exists version_id uuid
    references public.product_digital_versions (id) on delete set null,
  add column if not exists watermark_token uuid not null default gen_random_uuid();

update public.digital_entitlements e
set version_id = v.id
from public.product_digital_versions v
where e.version_id is null
  and v.product_id = e.product_id
  and v.version = (
    select max(v2.version) from public.product_digital_versions v2
    where v2.product_id = e.product_id
  );

create table public.digital_download_events (
  id              uuid primary key default gen_random_uuid(),
  entitlement_id  uuid not null references public.digital_entitlements (id) on delete cascade,
  store_id        uuid not null references public.stores (id) on delete cascade,
  ip_hash         text check (ip_hash is null or char_length(ip_hash) = 64),
  user_agent_hash text check (user_agent_hash is null or char_length(user_agent_hash) = 64),
  created_at      timestamptz not null default now()
);

create index digital_download_events_entitlement_idx
  on public.digital_download_events (entitlement_id, created_at desc);

alter table public.digital_download_events enable row level security;
revoke all on public.digital_download_events from public, anon, authenticated;
grant select on public.digital_download_events to authenticated;

create policy digital_download_events_select on public.digital_download_events
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

/* ------------------------------------------------------------------ *
 *  Nouvelle version à chaque changement de fichier
 * ------------------------------------------------------------------ */

create or replace function public.record_digital_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next integer;
begin
  if new.product_type <> 'digital' or new.digital_file_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.digital_file_id is not distinct from new.digital_file_id then
    return new;
  end if;

  select coalesce(max(v.version), 0) + 1 into v_next
  from public.product_digital_versions v
  where v.product_id = new.id;

  insert into public.product_digital_versions (
    store_id, product_id, version, media_id, notes, created_by
  )
  values (
    new.store_id, new.id, v_next, new.digital_file_id,
    case when v_next = 1 then 'Version initiale' else 'Nouveau fichier' end,
    (select auth.uid())
  )
  on conflict (product_id, version) do nothing;

  return new;
end;
$$;

revoke execute on function public.record_digital_version()
  from public, anon, authenticated;

drop trigger if exists products_digital_version on public.products;
create trigger products_digital_version
  after insert or update of digital_file_id on public.products
  for each row execute function public.record_digital_version();

/* Épingler la version courante à la création du droit. */
create or replace function public.pin_entitlement_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.version_id is null and new.product_id is not null then
    select v.id into new.version_id
    from public.product_digital_versions v
    where v.product_id = new.product_id
    order by v.version desc
    limit 1;
  end if;

  return new;
end;
$$;

revoke execute on function public.pin_entitlement_version()
  from public, anon, authenticated;

drop trigger if exists digital_entitlements_pin_version on public.digital_entitlements;
create trigger digital_entitlements_pin_version
  before insert on public.digital_entitlements
  for each row execute function public.pin_entitlement_version();

/* ------------------------------------------------------------------ *
 *  Téléchargement filigrané et anti-partage
 * ------------------------------------------------------------------ */

drop function if exists public.request_download(uuid);

create or replace function public.request_download(
  p_entitlement_id uuid,
  p_ip_hash        text default null,
  p_user_agent_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_email      text;
  v_item       record;
  v_distinct   integer;
begin
  if v_uid is null then
    return null;
  end if;

  select u.email::text into v_email from auth.users u where u.id = v_uid;

  select
    e.*,
    coalesce(pinned_media.object_key, vm.object_key, m.object_key) as object_key,
    coalesce(pinned_media.file_name, vm.file_name, m.file_name) as file_name,
    coalesce(pinned_media.content_type, vm.content_type, m.content_type) as content_type,
    s.name as store_name,
    s.slug as store_slug,
    o.number as order_number
  into v_item
  from public.digital_entitlements e
  join public.stores s on s.id = e.store_id
  join public.orders o on o.id = e.order_id
  left join public.product_digital_versions v on v.id = e.version_id
  left join public.media_assets pinned_media on pinned_media.id = v.media_id
  left join public.product_digital_versions latest
    on latest.product_id = e.product_id
   and latest.version = (
     select max(v2.version) from public.product_digital_versions v2
     where v2.product_id = e.product_id
   )
  left join public.media_assets vm on vm.id = latest.media_id
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

  if p_ip_hash is not null and not exists (
    select 1 from public.digital_download_events d
    where d.entitlement_id = v_item.id and d.ip_hash = p_ip_hash
  ) then
    select count(distinct d.ip_hash) into v_distinct
    from public.digital_download_events d
    where d.entitlement_id = v_item.id
      and d.created_at > now() - interval '24 hours'
      and d.ip_hash is not null;

    if v_distinct >= 3 then
      raise exception 'download_shared' using errcode = '22023';
    end if;
  end if;

  update public.digital_entitlements
  set download_count = download_count + 1
  where id = v_item.id;

  insert into public.digital_download_events (
    entitlement_id, store_id, ip_hash, user_agent_hash
  )
  values (
    v_item.id, v_item.store_id, nullif(p_ip_hash, ''), nullif(p_user_agent_hash, '')
  );

  return jsonb_build_object(
    'objectKey', v_item.object_key,
    'fileName', v_item.file_name,
    'contentType', v_item.content_type,
    'version', (select v.version from public.product_digital_versions v where v.id = v_item.version_id),
    'remaining', v_item.max_downloads - v_item.download_count - 1,
    'storeName', v_item.store_name,
    'orderNumber', v_item.order_number,
    'customerEmail', v_item.customer_email,
    'entitlementId', v_item.id
  );
end;
$$;

revoke execute on function public.request_download(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.request_download(uuid, text, text)
  to authenticated;
