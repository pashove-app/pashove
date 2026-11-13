-- PASHOVE — Webhooks marchands
--
-- Chaque événement de commande crée une livraison par endpoint abonné. Le cron
-- signe le corps en HMAC-SHA256 et réessaie avec un délai croissant. Le secret
-- n'est affiché qu'à la création ; il reste nécessaire pour signer, donc stocké
-- en clair côté serveur et jamais envoyé au navigateur après coup.

create table public.webhook_endpoints (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  url        text not null check (url ~ '^https://' and char_length(url) <= 500),
  secret     text not null check (char_length(secret) >= 32),
  events     text[] not null default array['order.paid']::text[]
    check (events <@ array[
      'order.created', 'order.paid', 'order.updated', 'order.cancelled',
      'order.refund_requested', 'order.refunded'
    ]::text[]),
  active     boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index webhook_endpoints_store_idx
  on public.webhook_endpoints (store_id, created_at desc);

alter table public.webhook_endpoints enable row level security;
revoke all on public.webhook_endpoints from public, anon, authenticated;
grant select, insert, update, delete on public.webhook_endpoints to authenticated;

create policy webhook_endpoints_select on public.webhook_endpoints
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create policy webhook_endpoints_write on public.webhook_endpoints
  for all to authenticated
  using (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]))
  with check (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]));

create table public.webhook_deliveries (
  id              uuid primary key default gen_random_uuid(),
  endpoint_id     uuid not null references public.webhook_endpoints (id) on delete cascade,
  store_id        uuid not null references public.stores (id) on delete cascade,
  event           text not null,
  payload         jsonb not null,
  status          text not null default 'pending'
    check (status in ('pending', 'success', 'failed')),
  attempts        integer not null default 0 check (attempts between 0 and 10),
  response_status integer,
  last_error      text,
  next_attempt_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  delivered_at    timestamptz
);

create index webhook_deliveries_pending_idx
  on public.webhook_deliveries (status, next_attempt_at);
create index webhook_deliveries_store_idx
  on public.webhook_deliveries (store_id, created_at desc);

alter table public.webhook_deliveries enable row level security;
revoke all on public.webhook_deliveries from public, anon, authenticated;
grant select on public.webhook_deliveries to authenticated;

create policy webhook_deliveries_select on public.webhook_deliveries
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

/* ------------------------------------------------------------------ *
 *  Événement de commande → livraisons
 * ------------------------------------------------------------------ */

create or replace function public.enqueue_order_webhooks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event text;
  v_order public.orders%rowtype;
begin
  v_event := case NEW.type
    when 'created' then 'order.created'
    when 'payment_collected' then 'order.paid'
    when 'status_changed' then 'order.updated'
    when 'cancelled' then 'order.cancelled'
    when 'refund_requested' then 'order.refund_requested'
    when 'refunded' then 'order.refunded'
    else null
  end;

  if v_event is null then
    return NEW;
  end if;

  select * into v_order from public.orders o where o.id = NEW.order_id;

  insert into public.webhook_deliveries (endpoint_id, store_id, event, payload)
  select
    e.id,
    NEW.store_id,
    v_event,
    jsonb_build_object(
      'event', v_event,
      'created_at', NEW.created_at,
      'order', jsonb_build_object(
        'id', NEW.order_id,
        'number', v_order.number,
        'status', v_order.status,
        'payment_status', v_order.payment_status,
        'total', v_order.total_amount,
        'currency', v_order.currency
      ),
      'data', NEW.payload
    )
  from public.webhook_endpoints e
  where e.store_id = NEW.store_id
    and e.active
    and v_event = any (e.events);

  return NEW;
end;
$$;

revoke execute on function public.enqueue_order_webhooks()
  from public, anon, authenticated;

drop trigger if exists order_events_webhooks on public.order_events;
create trigger order_events_webhooks
  after insert on public.order_events
  for each row execute function public.enqueue_order_webhooks();
