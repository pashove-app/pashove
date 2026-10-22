-- Clients dérivés des commandes : aucune table client pour l'instant.

create or replace function public.customer_key(p_email text, p_phone text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when btrim(coalesce(p_email, '')) <> ''
      then 'email:' || lower(btrim(p_email))
    when regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') <> ''
      then 'phone:' || regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
    else null
  end;
$$;

revoke execute on function public.customer_key(text, text)
  from public, anon, authenticated;
grant execute on function public.customer_key(text, text)
  to authenticated;

create or replace view public.store_customers
with (security_invoker = true)
as
with base as (
  select
    o.*,
    public.customer_key(o.customer_email, o.customer_phone) as customer_key
  from public.orders o
)
select
  b.store_id,
  b.customer_key,
  (array_agg(b.customer_name order by b.created_at desc))[1] as name,
  (array_agg(b.customer_email order by b.created_at desc))[1] as email,
  (array_agg(b.customer_phone order by b.created_at desc))[1] as phone,
  count(*) filter (where b.status <> 'cancelled')::int as orders_count,
  coalesce(sum(b.total_amount) filter (where b.status <> 'cancelled'), 0)::bigint as total_spent,
  count(*)::int as all_orders,
  min(b.created_at) as first_order_at,
  max(b.created_at) as last_order_at
from base b
where b.customer_key is not null
group by b.store_id, b.customer_key;

revoke all on public.store_customers from anon, authenticated;
grant select on public.store_customers to authenticated;

create or replace function public.store_customer_orders(
  p_store_id uuid,
  p_key      text
)
returns setof public.orders
language sql
stable
security invoker
set search_path = ''
as $$
  select o.*
  from public.orders o
  where o.store_id = p_store_id
    and public.customer_key(o.customer_email, o.customer_phone) = p_key
  order by o.created_at desc;
$$;

revoke execute on function public.store_customer_orders(uuid, text)
  from public, anon, authenticated;
grant execute on function public.store_customer_orders(uuid, text)
  to authenticated;
