-- Relevés, réconciliation plateforme et journal d'audit.
--
-- Aucune donnée n'est stockée en double : les relevés et la réconciliation
-- sont recalculés à partir du ledger. Le journal d'audit, lui, conserve les
-- actions sensibles déjà écrites par les RPC.

create or replace function public.store_balances_at(
  p_store_id uuid,
  p_at       timestamptz
)
returns table (code text, currency text, balance bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  return query
  select
    a.code,
    a.currency,
    coalesce(sum(
      case e.direction when 'debit' then e.amount else -e.amount end
    ), 0)::bigint
  from public.ledger_accounts a
  left join (
    select en.account_id, en.direction, en.amount
    from public.ledger_entries en
    join public.ledger_transactions t on t.id = en.transaction_id
    where en.store_id = p_store_id
      and t.occurred_at <= p_at
  ) e on e.account_id = a.id
  where a.store_id = p_store_id
  group by a.code, a.currency
  order by a.code;
end;
$$;

revoke execute on function public.store_balances_at(uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.store_balances_at(uuid, timestamptz)
  to authenticated;

create or replace function public.platform_reconciliation()
returns table (
  store_id       uuid,
  store_name     text,
  store_slug     text,
  currency       text,
  available      bigint,
  pending        bigint,
  reserved       bigint,
  cod_cash       bigint,
  commission_due bigint,
  fees           bigint,
  payouts        bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return query
  with balances as (
    select
      a.store_id,
      a.currency,
      a.code,
      coalesce(sum(
        case e.direction when 'debit' then e.amount else -e.amount end
      ), 0)::bigint as balance
    from public.ledger_accounts a
    left join public.ledger_entries e on e.account_id = a.id
    group by a.store_id, a.currency, a.code
  )
  select
    s.id,
    s.name,
    s.slug,
    b.currency,
    coalesce(sum(case when b.code = 'available' then b.balance end), 0)::bigint,
    coalesce(sum(case when b.code = 'pending' then b.balance end), 0)::bigint,
    coalesce(sum(case when b.code = 'reserved' then b.balance end), 0)::bigint,
    coalesce(sum(case when b.code = 'cod_cash' then b.balance end), 0)::bigint,
    coalesce(-sum(case when b.code = 'commission_due' then b.balance end), 0)::bigint,
    coalesce(sum(case when b.code = 'fees' then b.balance end), 0)::bigint,
    coalesce(sum(case when b.code = 'payouts' then b.balance end), 0)::bigint
  from public.stores s
  join balances b on b.store_id = s.id
  group by s.id, s.name, s.slug, b.currency
  order by s.name, b.currency;
end;
$$;

revoke execute on function public.platform_reconciliation()
  from public, anon, authenticated;
grant execute on function public.platform_reconciliation()
  to authenticated;

create or replace function public.platform_audit_feed(
  p_limit  integer default 50,
  p_offset integer default 0
)
returns table (
  id          uuid,
  created_at  timestamptz,
  actor_email text,
  action      text,
  target_type text,
  target_id   uuid,
  metadata    jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return query
  select
    l.id,
    l.created_at,
    u.email::text,
    l.action,
    l.target_type,
    l.target_id,
    l.metadata
  from public.platform_audit_log l
  left join auth.users u on u.id = l.actor_id
  order by l.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 200))
  offset greatest(0, coalesce(p_offset, 0));
end;
$$;

revoke execute on function public.platform_audit_feed(integer, integer)
  from public, anon, authenticated;
grant execute on function public.platform_audit_feed(integer, integer)
  to authenticated;
