-- M1 : marketing et analytics.
--
-- Les analytics sont calculés côté base pour rester justes et rapides. Les
-- campagnes sont stockées par boutique ; le rappel de panier est un opt-in
-- explicite du client, avec un envoi unique après 24 h d'inactivité.

alter table public.carts
  add column if not exists contact_email text;

create table if not exists public.email_campaigns (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores (id) on delete cascade,
  subject         text not null check (char_length(btrim(subject)) between 2 and 140),
  body            text not null check (char_length(btrim(body)) between 5 and 10000),
  segment         text not null default 'buyers'
                  check (segment in ('buyers', 'all', 'digital')),
  status          text not null default 'draft'
                  check (status in ('draft', 'sending', 'sent', 'failed')),
  recipient_count integer not null default 0,
  sent_count      integer not null default 0,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);

create index if not exists email_campaigns_store_idx
  on public.email_campaigns (store_id, created_at desc);

create table if not exists public.email_campaign_recipients (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns (id) on delete cascade,
  email       text not null,
  status      text not null default 'queued'
              check (status in ('queued', 'sent', 'failed')),
  error       text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now(),
  unique (campaign_id, email)
);

create table if not exists public.cart_reminders (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  cart_id    uuid not null unique references public.carts (id) on delete cascade,
  email      text not null check (char_length(email) <= 254 and email like '%@%'),
  status     text not null default 'pending'
             check (status in ('pending', 'sent', 'cancelled')),
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);

create index if not exists cart_reminders_pending_idx
  on public.cart_reminders (status, created_at);

alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;
alter table public.cart_reminders enable row level security;

create policy email_campaigns_store on public.email_campaigns
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy email_campaign_recipients_store on public.email_campaign_recipients
  for all to authenticated
  using (
    exists (
      select 1 from public.email_campaigns c
      where c.id = campaign_id and public.is_store_member(c.store_id)
    )
  )
  with check (
    exists (
      select 1 from public.email_campaigns c
      where c.id = campaign_id and public.is_store_member(c.store_id)
    )
  );

create policy cart_reminders_store_read on public.cart_reminders
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.email_campaigns from public, anon, authenticated;
revoke all on public.email_campaign_recipients from public, anon, authenticated;
revoke all on public.cart_reminders from public, anon, authenticated;

grant select, insert, update, delete on public.email_campaigns to authenticated;
grant select, insert, update, delete on public.email_campaign_recipients to authenticated;
grant select on public.cart_reminders to authenticated;

/* ------------------------------------------------------------------ *
 *  Opt-in au rappel de panier
 * ------------------------------------------------------------------ */

create or replace function public.save_cart_reminder(
  p_token uuid,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart public.carts%rowtype;
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  select c.* into v_cart
  from public.carts c
  where c.token = p_token
    and c.status = 'open';

  if v_cart.id is null then
    return false;
  end if;

  if v_email = '' or v_email not like '%@%' or char_length(v_email) > 254 then
    raise exception 'reminder_email_invalid' using errcode = '22023';
  end if;

  update public.carts set contact_email = v_email, updated_at = now()
  where id = v_cart.id;

  insert into public.cart_reminders (store_id, cart_id, email)
  values (v_cart.store_id, v_cart.id, v_email)
  on conflict (cart_id) do update
    set email = excluded.email,
        status = case when public.cart_reminders.status = 'sent' then 'sent' else 'pending' end;

  return true;
end;
$$;

revoke execute on function public.save_cart_reminder(uuid, text)
  from public, anon, authenticated;
grant execute on function public.save_cart_reminder(uuid, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Analytics boutique
 * ------------------------------------------------------------------ */

create or replace function public.store_analytics(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return (
    with paid as (
      select o.*
      from public.orders o
      where o.store_id = p_store_id
        and o.payment_status = 'paid'
        and o.created_at >= now() - interval '30 days'
    ),
    stats as (
      select
        coalesce(sum(o.total_amount), 0)::bigint as revenue,
        count(*)::bigint as orders,
        coalesce(round(avg(o.total_amount)), 0)::bigint as average
      from paid o
    ),
    top_products as (
      select
        oi.product_name,
        sum(oi.quantity)::bigint as quantity,
        sum(oi.line_total)::bigint as revenue
      from public.order_items oi
      join paid o on o.id = oi.order_id
      group by oi.product_name
      order by revenue desc
      limit 5
    ),
    top_customers as (
      select
        o.customer_name,
        lower(o.customer_email) as email,
        count(*)::bigint as orders,
        sum(o.total_amount)::bigint as revenue
      from paid o
      group by o.customer_name, lower(o.customer_email)
      order by revenue desc
      limit 5
    ),
    new_customers as (
      select count(*)::bigint as total
      from (
        select lower(o.customer_email) as email
        from public.orders o
        where o.store_id = p_store_id and o.payment_status = 'paid'
        group by lower(o.customer_email)
        having min(o.created_at) >= now() - interval '30 days'
      ) t
    ),
    carts as (
      select
        count(*)::bigint as total,
        count(*) filter (where c.status = 'converted')::bigint as converted
      from public.carts c
      where c.store_id = p_store_id
        and c.created_at >= now() - interval '30 days'
    )
    select jsonb_build_object(
      'revenue', stats.revenue,
      'orders', stats.orders,
      'averageOrder', stats.average,
      'newCustomers', new_customers.total,
      'conversionRate', case when carts.total = 0 then 0
        else round((carts.converted::numeric / carts.total) * 100, 1) end,
      'carts', carts.total,
      'convertedCarts', carts.converted,
      'topProducts', coalesce((select jsonb_agg(jsonb_build_object('name', product_name, 'quantity', quantity, 'revenue', revenue) order by revenue desc) from top_products), '[]'::jsonb),
      'topCustomers', coalesce((select jsonb_agg(jsonb_build_object('name', customer_name, 'email', email, 'orders', orders, 'revenue', revenue) order by revenue desc) from top_customers), '[]'::jsonb),
      'series', coalesce((
        select jsonb_agg(jsonb_build_object('date', d.day, 'amount', coalesce(s.amount, 0)) order by d.day)
        from generate_series((current_date - interval '29 days')::date, current_date, interval '1 day') d(day)
        left join (
          select o.created_at::date as day, sum(o.total_amount)::bigint as amount
          from public.orders o
          where o.store_id = p_store_id and o.payment_status = 'paid'
            and o.created_at >= current_date - interval '29 days'
          group by o.created_at::date
        ) s on s.day = d.day
      ), '[]'::jsonb)
    )
    from stats, new_customers, carts
  );
end;
$$;

revoke execute on function public.store_analytics(uuid)
  from public, anon, authenticated;
grant execute on function public.store_analytics(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Audience des campagnes
 * ------------------------------------------------------------------ */

create or replace function public.store_audience(
  p_store_id uuid,
  p_segment  text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_segment = 'digital' then
    return coalesce((
      select jsonb_agg(jsonb_build_object('email', email, 'name', name) order by email)
      from (
        select distinct on (lower(o.customer_email))
          lower(o.customer_email) as email, o.customer_name as name
        from public.orders o
        join public.order_items oi on oi.order_id = o.id
        where o.store_id = p_store_id
          and o.payment_status = 'paid'
          and oi.product_type = 'digital'
        order by lower(o.customer_email), o.created_at desc
      ) contacts
    ), '[]'::jsonb);
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object('email', email, 'name', name) order by email)
    from (
      select distinct on (lower(o.customer_email))
        lower(o.customer_email) as email, o.customer_name as name
      from public.orders o
      where o.store_id = p_store_id
        and (p_segment = 'all' or o.payment_status = 'paid')
      order by lower(o.customer_email), o.created_at desc
    ) contacts
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.store_audience(uuid, text)
  from public, anon, authenticated;
grant execute on function public.store_audience(uuid, text)
  to authenticated;
