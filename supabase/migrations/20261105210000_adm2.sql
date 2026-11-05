-- ADM2 : administration plateforme complète.
--
-- Toutes les lectures et écritures passent par des fonctions `security definer`
-- qui vérifient `is_platform_admin()`. Chaque action sensible écrit dans
-- `platform_audit_log`.

create table if not exists public.platform_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values
  ('store_signup_enabled', 'true'::jsonb),
  ('payments_enabled', 'true'::jsonb),
  ('gifts_enabled', 'true'::jsonb)
on conflict (key) do nothing;

alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from public, anon, authenticated;

create or replace function public.platform_audit(
  p_action      text,
  p_target_type text,
  p_target_id   uuid default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.platform_audit_log (actor_id, action, target_type, target_id, metadata)
  values ((select auth.uid()), p_action, p_target_type, p_target_id, p_metadata);
end;
$$;

revoke execute on function public.platform_audit(text, text, uuid, jsonb)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Dashboard
 * ------------------------------------------------------------------ */

create or replace function public.platform_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'gmv30', (
      select coalesce(sum(o.total_amount), 0)
      from public.orders o
      where o.payment_status = 'paid'
        and o.created_at >= now() - interval '30 days'
    ),
    'orders30', (
      select count(*)
      from public.orders o
      where o.payment_status = 'paid'
        and o.created_at >= now() - interval '30 days'
    ),
    'gmvAll', (
      select coalesce(sum(o.total_amount), 0)
      from public.orders o
      where o.payment_status = 'paid'
    ),
    'commissionDue', (
      select coalesce(-sum(
        case e.direction when 'debit' then e.amount else -e.amount end
      ), 0)
      from public.ledger_entries e
      join public.ledger_accounts a on a.id = e.account_id
      where a.code = 'commission_due'
    ),
    'activeMerchants', (
      select count(distinct sm.user_id)
      from public.store_members sm
      join public.stores s on s.id = sm.store_id
      where sm.role = 'owner' and s.status = 'active'
    ),
    'activeStores', (
      select count(*) from public.stores where status = 'active'
    ),
    'totalStores', (
      select count(*) from public.stores
    ),
    'customers', (
      select count(*) from public.profiles
    ),
    'kycPending', (
      select count(*) from public.kyc_cases
      where status in ('submitted', 'under_review')
    ),
    'payoutsPending', (
      select count(*) from public.payouts
      where status in ('requested', 'security_check')
    ),
    'failedPayments', (
      select count(*) from public.payments where status = 'failed'
    ),
    'series', coalesce((
      select jsonb_agg(
        jsonb_build_object('date', d.day, 'amount', coalesce(day_sales.amount, 0))
        order by d.day
      )
      from generate_series(
        (current_date - interval '29 days')::date,
        current_date,
        interval '1 day'
      ) as d(day)
      left join (
        select o.created_at::date as day, sum(o.total_amount)::bigint as amount
        from public.orders o
        where o.payment_status = 'paid'
          and o.created_at >= current_date - interval '29 days'
        group by o.created_at::date
      ) day_sales on day_sales.day = d.day
    ), '[]'::jsonb),
    'topMerchants', coalesce((
      select jsonb_agg(row order by gmv desc)
      from (
        select jsonb_build_object(
          'userId', u.id,
          'name', coalesce(p.full_name, u.email),
          'email', u.email,
          'plan', coalesce(ap.plan_code, 'free'),
          'stores', count(distinct s.id),
          'gmv', coalesce(sum(case when o.payment_status = 'paid' then o.total_amount else 0 end), 0)
        ) as row,
        coalesce(sum(case when o.payment_status = 'paid' then o.total_amount else 0 end), 0) as gmv
        from auth.users u
        left join public.profiles p on p.id = u.id
        left join public.account_plans ap on ap.user_id = u.id
        join public.store_members sm on sm.user_id = u.id and sm.role = 'owner'
        join public.stores s on s.id = sm.store_id
        left join public.orders o on o.store_id = s.id
        group by u.id, p.full_name, u.email, ap.plan_code
        order by gmv desc
        limit 5
      ) ranked
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.platform_dashboard()
  from public, anon, authenticated;
grant execute on function public.platform_dashboard()
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Marchands
 * ------------------------------------------------------------------ */

create or replace function public.platform_merchants()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'userId', u.id,
        'name', coalesce(nullif(p.full_name, ''), u.email),
        'email', u.email,
        'plan', coalesce(ap.plan_code, 'free'),
        'planName', coalesce(pl.name, 'Free'),
        'stores', (
          select count(*) from public.store_members sm
          where sm.user_id = u.id and sm.role = 'owner'
        ),
        'storeNames', (
          select string_agg(s.name, ', ' order by s.name)
          from public.store_members sm
          join public.stores s on s.id = sm.store_id
          where sm.user_id = u.id and sm.role = 'owner'
        ),
        'gmv', (
          select coalesce(sum(o.total_amount), 0)
          from public.orders o
          join public.store_members sm on sm.store_id = o.store_id and sm.role = 'owner'
          where sm.user_id = u.id and o.payment_status = 'paid'
        ),
        'currency', (
          select coalesce(min(s.currency), 'XOF')
          from public.store_members sm
          join public.stores s on s.id = sm.store_id
          where sm.user_id = u.id and sm.role = 'owner'
        ),
        'kyc', (
          select case
            when bool_or(k.status = 'rejected') then 'rejected'
            when bool_or(k.status in ('submitted', 'under_review')) then 'pending'
            when bool_or(k.status = 'approved') then 'approved'
            else 'not_started'
          end
          from public.store_members sm
          join public.kyc_cases k on k.store_id = sm.store_id
          where sm.user_id = u.id and sm.role = 'owner'
        ),
        'suspended', (u.banned_until is not null and u.banned_until > now()),
        'createdAt', u.created_at
      )
      order by u.created_at desc
    )
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.account_plans ap on ap.user_id = u.id
    left join public.plans pl on pl.code = ap.plan_code
    where exists (
      select 1 from public.store_members sm
      where sm.user_id = u.id and sm.role = 'owner'
    )
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.platform_merchants()
  from public, anon, authenticated;
grant execute on function public.platform_merchants()
  to authenticated;

create or replace function public.platform_merchant_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'merchant', (
      select jsonb_build_object(
        'userId', u.id,
        'name', coalesce(nullif(p.full_name, ''), u.email),
        'email', u.email,
        'phone', p.phone,
        'country', p.country,
        'language', p.language,
        'plan', coalesce(ap.plan_code, 'free'),
        'planName', coalesce(pl.name, 'Free'),
        'suspended', (u.banned_until is not null and u.banned_until > now()),
        'createdAt', u.created_at
      )
      from auth.users u
      left join public.profiles p on p.id = u.id
      left join public.account_plans ap on ap.user_id = u.id
      left join public.plans pl on pl.code = ap.plan_code
      where u.id = p_user_id
    ),
    'stores', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'slug', s.slug,
        'status', s.status, 'country', s.country, 'currency', s.currency
      ) order by s.created_at desc)
      from public.store_members sm
      join public.stores s on s.id = sm.store_id
      where sm.user_id = p_user_id and sm.role = 'owner'
    ), '[]'::jsonb),
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'number', o.number, 'status', o.status,
        'paymentStatus', o.payment_status, 'total', o.total_amount,
        'currency', o.currency, 'createdAt', o.created_at,
        'storeName', s.name
      ) order by o.created_at desc)
      from public.orders o
      join public.store_members sm on sm.store_id = o.store_id and sm.role = 'owner'
      join public.stores s on s.id = o.store_id
      where sm.user_id = p_user_id
      limit 30
    ), '[]'::jsonb),
    'payouts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', po.id, 'amount', po.amount, 'currency', po.currency,
        'status', po.status, 'requestedAt', po.requested_at,
        'storeName', s.name
      ) order by po.requested_at desc)
      from public.payouts po
      join public.store_members sm on sm.store_id = po.store_id and sm.role = 'owner'
      join public.stores s on s.id = po.store_id
      where sm.user_id = p_user_id
      limit 20
    ), '[]'::jsonb),
    'kyc', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'status', k.status, 'legalName', k.legal_name,
        'submittedAt', k.submitted_at, 'storeName', s.name
      ) order by k.submitted_at desc)
      from public.kyc_cases k
      join public.store_members sm on sm.store_id = k.store_id and sm.role = 'owner'
      join public.stores s on s.id = k.store_id
      where sm.user_id = p_user_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.platform_merchant_detail(uuid)
  from public, anon, authenticated;
grant execute on function public.platform_merchant_detail(uuid)
  to authenticated;

create or replace function public.platform_set_merchant_status(
  p_user_id uuid,
  p_suspend boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if exists (select 1 from public.platform_admins where user_id = p_user_id) then
    raise exception 'protected_account' using errcode = '22023';
  end if;

  update public.stores s
  set status = case when p_suspend then 'suspended'::public.store_status else 'active'::public.store_status end
  where s.id in (
    select sm.store_id from public.store_members sm
    where sm.user_id = p_user_id and sm.role = 'owner'
  )
    and s.status in ('active', 'suspended');

  update auth.users
  set banned_until = case when p_suspend then '2126-01-01'::timestamptz else null end
  where id = p_user_id;

  perform public.platform_audit(
    case when p_suspend then 'merchant_suspended' else 'merchant_reactivated' end,
    'user', p_user_id, jsonb_build_object('suspend', p_suspend)
  );
end;
$$;

revoke execute on function public.platform_set_merchant_status(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.platform_set_merchant_status(uuid, boolean)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Boutiques
 * ------------------------------------------------------------------ */

create or replace function public.platform_stores()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', s.id, 'name', s.name, 'slug', s.slug, 'status', s.status,
        'country', s.country, 'currency', s.currency, 'createdAt', s.created_at,
        'ownerName', owner.name, 'ownerEmail', owner.email,
        'plan', coalesce(owner.plan_code, 'free'),
        'orders', (select count(*) from public.orders o where o.store_id = s.id),
        'gmv', (select coalesce(sum(o.total_amount), 0) from public.orders o where o.store_id = s.id and o.payment_status = 'paid'),
        'kyc', coalesce((select k.status from public.kyc_cases k where k.store_id = s.id), 'not_started')
      )
      order by s.created_at desc
    )
    from public.stores s
    left join lateral (
      select u.id, coalesce(nullif(p.full_name, ''), u.email) as name, u.email, ap.plan_code
      from public.store_members sm
      join auth.users u on u.id = sm.user_id
      left join public.profiles p on p.id = u.id
      left join public.account_plans ap on ap.user_id = u.id
      where sm.store_id = s.id and sm.role = 'owner'
      order by sm.created_at
      limit 1
    ) owner on true
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.platform_stores()
  from public, anon, authenticated;
grant execute on function public.platform_stores()
  to authenticated;

create or replace function public.platform_store_detail(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'store', (
      select jsonb_build_object(
        'id', s.id, 'name', s.name, 'slug', s.slug, 'status', s.status,
        'country', s.country, 'currency', s.currency,
        'createdAt', s.created_at, 'description', s.description
      )
      from public.stores s where s.id = p_store_id
    ),
    'owner', (
      select jsonb_build_object('userId', u.id, 'name', coalesce(nullif(p.full_name, ''), u.email), 'email', u.email)
      from public.store_members sm
      join auth.users u on u.id = sm.user_id
      left join public.profiles p on p.id = u.id
      where sm.store_id = p_store_id and sm.role = 'owner'
      order by sm.created_at limit 1
    ),
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'number', o.number, 'status', o.status,
        'paymentStatus', o.payment_status, 'total', o.total_amount,
        'currency', o.currency, 'customerName', o.customer_name,
        'createdAt', o.created_at
      ) order by o.created_at desc)
      from public.orders o where o.store_id = p_store_id limit 50
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.platform_store_detail(uuid)
  from public, anon, authenticated;
grant execute on function public.platform_store_detail(uuid)
  to authenticated;

create or replace function public.platform_set_store_status(
  p_store_id uuid,
  p_suspend boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  update public.stores
  set status = case when p_suspend then 'suspended'::public.store_status else 'active'::public.store_status end
  where id = p_store_id;

  perform public.platform_audit(
    case when p_suspend then 'store_suspended' else 'store_reactivated' end,
    'store', p_store_id, jsonb_build_object('suspend', p_suspend)
  );
end;
$$;

revoke execute on function public.platform_set_store_status(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.platform_set_store_status(uuid, boolean)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Utilisateurs
 * ------------------------------------------------------------------ */

create or replace function public.platform_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'userId', u.id,
        'name', coalesce(nullif(p.full_name, ''), u.email),
        'email', u.email,
        'language', coalesce(p.language, 'fr'),
        'createdAt', u.created_at,
        'suspended', (u.banned_until is not null and u.banned_until > now()),
        'platformAdmin', exists (select 1 from public.platform_admins pa where pa.user_id = u.id),
        'merchant', exists (
          select 1 from public.store_members sm
          where sm.user_id = u.id and sm.role = 'owner'
        ),
        'stores', (
          select count(*) from public.store_members sm
          where sm.user_id = u.id and sm.role = 'owner'
        ),
        'orders', (
          select count(*) from public.orders o
          where o.customer_user_id = u.id
             or (o.customer_user_id is null and lower(o.customer_email) = lower(u.email))
        )
      )
      order by u.created_at desc
    )
    from auth.users u
    left join public.profiles p on p.id = u.id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.platform_users()
  from public, anon, authenticated;
grant execute on function public.platform_users()
  to authenticated;

create or replace function public.platform_user_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'user', (
      select jsonb_build_object(
        'userId', u.id, 'name', coalesce(nullif(p.full_name, ''), u.email),
        'email', u.email, 'phone', p.phone, 'country', p.country,
        'language', coalesce(p.language, 'fr'),
        'suspended', (u.banned_until is not null and u.banned_until > now()),
        'createdAt', u.created_at,
        'platformAdmin', exists (select 1 from public.platform_admins pa where pa.user_id = u.id)
      )
      from auth.users u left join public.profiles p on p.id = u.id
      where u.id = p_user_id
    ),
    'stores', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'status', s.status))
      from public.store_members sm join public.stores s on s.id = sm.store_id
      where sm.user_id = p_user_id and sm.role = 'owner'
    ), '[]'::jsonb),
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'number', o.number, 'status', o.status,
        'paymentStatus', o.payment_status, 'total', o.total_amount,
        'currency', o.currency, 'createdAt', o.created_at, 'storeName', s.name
      ) order by o.created_at desc)
      from public.orders o join public.stores s on s.id = o.store_id
      where o.customer_user_id = p_user_id
         or (o.customer_user_id is null and lower(o.customer_email) = lower((select email from auth.users where id = p_user_id)))
      limit 30
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.platform_user_detail(uuid)
  from public, anon, authenticated;
grant execute on function public.platform_user_detail(uuid)
  to authenticated;

create or replace function public.platform_set_user_status(
  p_user_id uuid,
  p_suspend boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if exists (select 1 from public.platform_admins where user_id = p_user_id) then
    raise exception 'protected_account' using errcode = '22023';
  end if;

  update auth.users
  set banned_until = case when p_suspend then '2126-01-01'::timestamptz else null end
  where id = p_user_id;

  perform public.platform_audit(
    case when p_suspend then 'user_suspended' else 'user_reactivated' end,
    'user', p_user_id, jsonb_build_object('suspend', p_suspend)
  );
end;
$$;

revoke execute on function public.platform_set_user_status(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.platform_set_user_status(uuid, boolean)
  to authenticated;

create or replace function public.platform_reset_user_security(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  delete from auth.sessions where user_id = p_user_id;

  perform public.platform_audit(
    'user_security_reset', 'user', p_user_id, '{}'::jsonb
  );
end;
$$;

revoke execute on function public.platform_reset_user_security(uuid)
  from public, anon, authenticated;
grant execute on function public.platform_reset_user_security(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Réglages plateforme
 * ------------------------------------------------------------------ */

create or replace function public.platform_save_plan(
  p_code           text,
  p_name           text,
  p_commission_bps integer,
  p_max_stores     integer,
  p_max_members    integer,
  p_price_amount   integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_code not in ('free', 'standard', 'pro')
     or p_commission_bps < 0 or p_commission_bps > 10000
     or p_max_stores < 1 or p_max_members < 1 or p_price_amount < 0 then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;

  update public.plans
  set name = p_name, commission_bps = p_commission_bps,
      max_stores = p_max_stores, max_members = p_max_members,
      price_amount = p_price_amount
  where code = p_code;

  perform public.platform_audit(
    'plan_updated', 'plan', null,
    jsonb_build_object('code', p_code, 'commissionBps', p_commission_bps,
      'maxStores', p_max_stores, 'maxMembers', p_max_members,
      'priceAmount', p_price_amount)
  );
end;
$$;

revoke execute on function public.platform_save_plan(text, text, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.platform_save_plan(text, text, integer, integer, integer, integer)
  to authenticated;

create or replace function public.platform_add_admin(
  p_email text,
  p_role  text default 'admin'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_role not in ('super_admin', 'admin', 'auditor') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  select id into v_user from auth.users where lower(email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'user_not_found' using errcode = '22023';
  end if;

  insert into public.platform_admins (user_id, role)
  values (v_user, p_role)
  on conflict (user_id) do update set role = excluded.role;

  perform public.platform_audit(
    'platform_admin_added', 'user', v_user, jsonb_build_object('role', p_role)
  );
end;
$$;

revoke execute on function public.platform_add_admin(text, text)
  from public, anon, authenticated;
grant execute on function public.platform_add_admin(text, text)
  to authenticated;

create or replace function public.platform_remove_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_super integer;
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if exists (select 1 from public.platform_admins where user_id = p_user_id and role = 'super_admin') then
    select count(*) into v_super from public.platform_admins where role = 'super_admin';
    if v_super <= 1 then
      raise exception 'last_super_admin' using errcode = '22023';
    end if;
  end if;

  delete from public.platform_admins where user_id = p_user_id;

  perform public.platform_audit(
    'platform_admin_removed', 'user', p_user_id, '{}'::jsonb
  );
end;
$$;

revoke execute on function public.platform_remove_admin(uuid)
  from public, anon, authenticated;
grant execute on function public.platform_remove_admin(uuid)
  to authenticated;

create or replace function public.platform_settings()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'settings', coalesce((
      select jsonb_object_agg(key, value) from public.platform_settings
    ), '{}'::jsonb),
    'plans', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', code, 'name', name, 'commissionBps', commission_bps,
        'maxStores', max_stores, 'maxMembers', max_members,
        'priceAmount', price_amount, 'currency', currency
      ) order by price_amount)
      from public.plans
    ), '[]'::jsonb),
    'admins', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', pa.user_id, 'role', pa.role,
        'name', coalesce(nullif(p.full_name, ''), u.email),
        'email', u.email
      ) order by pa.created_at)
      from public.platform_admins pa
      join auth.users u on u.id = pa.user_id
      left join public.profiles p on p.id = pa.user_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.platform_settings()
  from public, anon, authenticated;
grant execute on function public.platform_settings()
  to authenticated;

create or replace function public.platform_save_setting(
  p_key   text,
  p_value jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_key not in ('store_signup_enabled', 'payments_enabled', 'gifts_enabled') then
    raise exception 'invalid_setting' using errcode = '22023';
  end if;

  insert into public.platform_settings (key, value, updated_at)
  values (p_key, p_value, now())
  on conflict (key) do update
    set value = excluded.value, updated_at = now();

  perform public.platform_audit(
    'setting_updated', 'setting', null,
    jsonb_build_object('key', p_key, 'value', p_value)
  );
end;
$$;

revoke execute on function public.platform_save_setting(text, jsonb)
  from public, anon, authenticated;
grant execute on function public.platform_save_setting(text, jsonb)
  to authenticated;
