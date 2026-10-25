-- Un compte plateforme peut posséder plusieurs boutiques. La limite vient du
-- plan du compte (Free = 2), vérifiée en base au moment de la création. Les
-- invitations sont des jetons à durée limitée ; l'e-mail doit correspondre au
-- compte qui accepte.

alter type public.store_role add value if not exists 'product_manager';

/* ------------------------------------------------------------------ *
 *  Plans et compte
 * ------------------------------------------------------------------ */

create table public.plans (
  code           text primary key,
  name           text not null,
  commission_bps integer not null check (commission_bps between 0 and 10000),
  max_stores     integer not null check (max_stores > 0),
  max_members    integer not null check (max_members > 0),
  price_amount   integer not null default 0 check (price_amount >= 0),
  currency       text not null default 'XOF' check (currency ~ '^[A-Z]{3}$')
);

insert into public.plans (code, name, commission_bps, max_stores, max_members, price_amount)
values
  ('free', 'Free', 1000, 2, 5, 0),
  ('standard', 'Standard', 200, 5, 15, 25000),
  ('pro', 'Pro', 0, 10, 50, 45000)
on conflict (code) do nothing;

create table public.account_plans (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  plan_code  text not null default 'free' references public.plans (code),
  updated_at timestamptz not null default now()
);

insert into public.account_plans (user_id, plan_code)
select id, 'free' from auth.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_account_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_plans (user_id, plan_code)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_account_plan()
  from public, anon, authenticated;

create trigger on_auth_user_created_plan
  after insert on auth.users
  for each row execute function public.handle_new_account_plan();

alter table public.plans enable row level security;
alter table public.account_plans enable row level security;

create policy plans_select_authenticated on public.plans
  for select to authenticated
  using (true);

create policy account_plans_select_own on public.account_plans
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.plans from public, anon, authenticated;
revoke all on public.account_plans from public, anon, authenticated;

grant select on public.plans to authenticated;
grant select on public.account_plans to authenticated;

/* ------------------------------------------------------------------ *
 *  Création d'une boutique avec limite de plan
 * ------------------------------------------------------------------ */

create or replace function public.create_store(
  p_name     text,
  p_slug     text,
  p_country  text,
  p_currency text,
  p_category text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_plan   text;
  v_max    integer;
  v_count  integer;
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select ap.plan_code into v_plan
  from public.account_plans ap
  where ap.user_id = v_uid;

  v_plan := coalesce(v_plan, 'free');

  select p.max_stores into v_max
  from public.plans p
  where p.code = v_plan;

  select count(*) into v_count
  from public.store_members m
  where m.user_id = v_uid
    and m.role = 'owner';

  if v_count >= coalesce(v_max, 2) then
    raise exception 'store_limit_reached' using errcode = '22023';
  end if;

  insert into public.stores (name, slug, country, currency, category, status)
  values (
    btrim(p_name),
    lower(btrim(p_slug)),
    upper(btrim(p_country)),
    upper(btrim(p_currency)),
    nullif(btrim(coalesce(p_category, '')), ''),
    'draft'
  )
  returning id into v_id;

  insert into public.store_members (store_id, user_id, role)
  values (v_id, v_uid, 'owner');

  return v_id;
end;
$$;

revoke execute on function public.create_store(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_store(text, text, text, text, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Invitations d'équipe
 * ------------------------------------------------------------------ */

create table public.store_invitations (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores (id) on delete cascade,
  email       text not null
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  role        public.store_role not null
    check (role in ('admin', 'product_manager')),
  token       uuid not null unique default gen_random_uuid(),
  status      text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by  uuid references auth.users (id) on delete set null,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index store_invitations_pending_idx
  on public.store_invitations (store_id, lower(email))
  where status = 'pending';

create index store_invitations_store_idx
  on public.store_invitations (store_id, created_at desc);

alter table public.store_invitations enable row level security;

create policy store_invitations_select_member on public.store_invitations
  for select to authenticated
  using (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]));

create policy store_invitations_insert_member on public.store_invitations
  for insert to authenticated
  with check (
    public.has_store_role(store_id, array['owner', 'admin']::public.store_role[])
    and invited_by = (select auth.uid())
  );

create policy store_invitations_update_member on public.store_invitations
  for update to authenticated
  using (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]))
  with check (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]));

create policy store_invitations_delete_member on public.store_invitations
  for delete to authenticated
  using (public.has_store_role(store_id, array['owner', 'admin']::public.store_role[]));

revoke all on public.store_invitations from public, anon, authenticated;
grant select, insert, update, delete on public.store_invitations to authenticated;

/** Membres d'une boutique, avec leur nom et leur e-mail. */
create or replace function public.list_store_members(p_store_id uuid)
returns table (
  user_id    uuid,
  full_name  text,
  email      text,
  role       public.store_role,
  joined_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_member' using errcode = '42501';
  end if;

  return query
  select
    m.user_id,
    coalesce(nullif(p.full_name, ''), split_part(u.email, '@', 1), 'Membre') as full_name,
    u.email::text,
    m.role,
    m.created_at
  from public.store_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where m.store_id = p_store_id
  order by
    case m.role when 'owner' then 0 when 'admin' then 1 else 2 end,
    m.created_at;
end;
$$;

revoke execute on function public.list_store_members(uuid)
  from public, anon, authenticated;
grant execute on function public.list_store_members(uuid)
  to authenticated;

/** Accepte une invitation si l'e-mail correspond au compte connecté. */
create or replace function public.accept_store_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_email  text;
  v_invite public.store_invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select i.* into v_invite
  from public.store_invitations i
  where i.token = p_token
  for update;

  if v_invite.id is null
     or v_invite.status <> 'pending'
     or v_invite.expires_at <= now() then
    raise exception 'invitation_invalid' using errcode = '22023';
  end if;

  select u.email::text into v_email
  from auth.users u
  where u.id = v_uid;

  if lower(coalesce(v_email, '')) <> lower(v_invite.email) then
    raise exception 'invitation_email_mismatch' using errcode = '22023';
  end if;

  insert into public.store_members (store_id, user_id, role)
  values (v_invite.store_id, v_uid, v_invite.role)
  on conflict (store_id, user_id) do nothing;

  update public.store_invitations
  set status = 'accepted',
      accepted_at = now()
  where id = v_invite.id;

  return v_invite.store_id;
end;
$$;

revoke execute on function public.accept_store_invitation(uuid)
  from public, anon, authenticated;
grant execute on function public.accept_store_invitation(uuid)
  to authenticated;
