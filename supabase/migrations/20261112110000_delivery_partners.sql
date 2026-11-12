-- PASHOVE — Livreurs partenaires
--
-- Des entreprises de livraison gèrent leur flotte. Pashove fixe toujours le
-- prix de la course (grille admin) et prélève sa commission (10 % par défaut).
-- Le partenaire reçoit le reste ; la part de son livreur (commission ou salaire)
-- est déduite de son solde. Le livreur partenaire reste un livreur Pashove
-- (table couriers) pour le dispatch, l'OTP et le suivi.

create table public.delivery_partners (
  id             uuid primary key default gen_random_uuid(),
  company_name   text not null check (char_length(company_name) between 2 and 120),
  email          text not null unique check (position('@' in email) > 1),
  phone          text,
  country        text not null check (country ~ '^[A-Z]{2}$'),
  user_id        uuid unique references auth.users (id) on delete set null,
  status         text not null default 'invited'
    check (status in ('invited', 'active', 'suspended')),
  commission_bps integer not null default 1000
    check (commission_bps between 0 and 10000),
  invite_token   uuid not null unique default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.partner_drivers (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references public.delivery_partners (id) on delete cascade,
  user_id           uuid unique references auth.users (id) on delete set null,
  name              text not null check (char_length(name) between 2 and 120),
  email             text not null check (position('@' in email) > 1),
  phone             text not null check (char_length(phone) between 6 and 40),
  invite_code       uuid not null unique default gen_random_uuid(),
  status            text not null default 'invited'
    check (status in ('invited', 'active', 'suspended')),
  compensation_type text not null default 'commission'
    check (compensation_type in ('commission', 'salary', 'both')),
  commission_bps    integer not null default 0
    check (commission_bps between 0 and 9000),
  salary_amount     integer not null default 0 check (salary_amount >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index partner_drivers_email_idx
  on public.partner_drivers (partner_id, lower(email));
create index partner_drivers_partner_idx
  on public.partner_drivers (partner_id, created_at desc);

create table public.partner_balances (
  partner_id        uuid primary key references public.delivery_partners (id) on delete cascade,
  balance_fcfa      integer not null default 0 check (balance_fcfa >= 0),
  total_earned_fcfa integer not null default 0 check (total_earned_fcfa >= 0),
  total_paid_fcfa   integer not null default 0 check (total_paid_fcfa >= 0),
  updated_at        timestamptz not null default now()
);

create table public.partner_delivery_earnings (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references public.delivery_partners (id) on delete cascade,
  driver_id         uuid not null references public.partner_drivers (id) on delete cascade,
  delivery_id       uuid not null unique references public.deliveries (id) on delete cascade,
  order_id          uuid not null references public.orders (id) on delete cascade,
  store_id          uuid not null references public.stores (id) on delete cascade,
  fee_amount        integer not null check (fee_amount >= 0),
  platform_share    integer not null check (platform_share >= 0),
  partner_gross     integer not null check (partner_gross >= 0),
  driver_commission integer not null check (driver_commission >= 0),
  partner_net       integer not null check (partner_net >= 0),
  currency          text not null,
  created_at        timestamptz not null default now()
);

create index partner_earnings_partner_idx
  on public.partner_delivery_earnings (partner_id, created_at desc);

create table public.partner_payouts (
  id         uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.delivery_partners (id) on delete cascade,
  amount     integer not null check (amount > 0),
  status     text not null default 'requested'
    check (status in ('requested', 'paid', 'rejected')),
  note       text,
  created_at timestamptz not null default now(),
  paid_at    timestamptz
);

create index partner_payouts_partner_idx
  on public.partner_payouts (partner_id, created_at desc);

alter table public.couriers
  add column if not exists partner_id uuid
    references public.delivery_partners (id) on delete set null;

create index if not exists couriers_partner_idx
  on public.couriers (partner_id, status);

/* ------------------------------------------------------------------ *
 *  RLS
 * ------------------------------------------------------------------ */

alter table public.delivery_partners enable row level security;
alter table public.partner_drivers enable row level security;
alter table public.partner_balances enable row level security;
alter table public.partner_delivery_earnings enable row level security;
alter table public.partner_payouts enable row level security;

revoke all on public.delivery_partners from public, anon, authenticated;
revoke all on public.partner_drivers from public, anon, authenticated;
revoke all on public.partner_balances from public, anon, authenticated;
revoke all on public.partner_delivery_earnings from public, anon, authenticated;
revoke all on public.partner_payouts from public, anon, authenticated;

grant select on public.delivery_partners to authenticated;
grant select on public.partner_drivers to authenticated;
grant select on public.partner_balances to authenticated;
grant select on public.partner_delivery_earnings to authenticated;
grant select on public.partner_payouts to authenticated;

create policy delivery_partners_select on public.delivery_partners
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_admin());

create policy partner_drivers_select on public.partner_drivers
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_platform_admin()
    or exists (
      select 1 from public.delivery_partners p
      where p.id = partner_id and p.user_id = (select auth.uid())
    )
  );

create policy partner_balances_select on public.partner_balances
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.delivery_partners p
      where p.id = partner_id and p.user_id = (select auth.uid())
    )
  );

create policy partner_earnings_select on public.partner_delivery_earnings
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.delivery_partners p
      where p.id = partner_id and p.user_id = (select auth.uid())
    )
  );

create policy partner_payouts_select on public.partner_payouts
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.delivery_partners p
      where p.id = partner_id and p.user_id = (select auth.uid())
    )
  );

/* ------------------------------------------------------------------ *
 *  Partenaire courant
 * ------------------------------------------------------------------ */

create or replace function public.current_delivery_partner_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.delivery_partners p
  where p.user_id = (select auth.uid())
    and p.status = 'active'
  limit 1;
$$;

revoke execute on function public.current_delivery_partner_id()
  from public, anon, authenticated;
grant execute on function public.current_delivery_partner_id()
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Création et activation du partenaire (admin / service)
 * ------------------------------------------------------------------ */

create or replace function public.create_delivery_partner(
  p_company_name   text,
  p_email          text,
  p_phone          text,
  p_country        text,
  p_commission_bps integer default 1000
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company text := btrim(coalesce(p_company_name, ''));
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_country text := upper(btrim(coalesce(p_country, '')));
  v_id      uuid;
  v_token   uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if char_length(v_company) < 2
     or position('@' in v_email) < 2
     or v_country !~ '^[A-Z]{2}$'
     or p_commission_bps is null
     or p_commission_bps < 0
     or p_commission_bps > 10000 then
    raise exception 'partner_invalid' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.platform_markets m
    where m.country_code = v_country and m.is_enabled
  ) then
    raise exception 'market_unavailable' using errcode = '22023';
  end if;

  insert into public.delivery_partners (
    company_name, email, phone, country, commission_bps, status
  )
  values (
    v_company, v_email, nullif(btrim(coalesce(p_phone, '')), ''),
    v_country, p_commission_bps, 'invited'
  )
  returning id, invite_token into v_id, v_token;

  insert into public.partner_balances (partner_id)
  values (v_id)
  on conflict (partner_id) do nothing;

  return jsonb_build_object(
    'id', v_id,
    'inviteToken', v_token,
    'email', v_email,
    'companyName', v_company
  );
exception
  when unique_violation then
    raise exception 'partner_email_exists' using errcode = '22023';
end;
$$;

revoke execute on function public.create_delivery_partner(text, text, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.create_delivery_partner(text, text, text, text, integer)
  to authenticated;

create or replace function public.activate_delivery_partner(
  p_token   uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner public.delivery_partners%rowtype;
begin
  update public.delivery_partners
  set user_id = p_user_id,
      status = 'active',
      updated_at = now()
  where invite_token = p_token
    and status = 'invited'
    and user_id is null
  returning * into v_partner;

  if v_partner.id is null then
    raise exception 'invite_invalid' using errcode = '22023';
  end if;

  return jsonb_build_object('id', v_partner.id, 'companyName', v_partner.company_name);
end;
$$;

revoke execute on function public.activate_delivery_partner(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.activate_delivery_partner(uuid, uuid)
  to service_role;

/* ------------------------------------------------------------------ *
 *  Livreurs du partenaire
 * ------------------------------------------------------------------ */

create or replace function public.add_partner_driver(
  p_name              text,
  p_email             text,
  p_phone             text,
  p_compensation_type text default 'commission',
  p_commission_bps    integer default 0,
  p_salary_amount     integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner uuid := public.current_delivery_partner_id();
  v_name    text := btrim(coalesce(p_name, ''));
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_phone   text := btrim(coalesce(p_phone, ''));
  v_type    text := lower(btrim(coalesce(p_compensation_type, 'commission')));
  v_id      uuid;
  v_code    uuid;
begin
  if v_partner is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if char_length(v_name) < 2
     or position('@' in v_email) < 2
     or char_length(v_phone) < 6
     or v_type not in ('commission', 'salary', 'both')
     or p_commission_bps < 0 or p_commission_bps > 9000
     or p_salary_amount < 0 then
    raise exception 'driver_invalid' using errcode = '22023';
  end if;

  insert into public.partner_drivers (
    partner_id, name, email, phone, compensation_type,
    commission_bps, salary_amount
  )
  values (
    v_partner, v_name, v_email, v_phone, v_type,
    coalesce(p_commission_bps, 0), coalesce(p_salary_amount, 0)
  )
  returning id, invite_code into v_id, v_code;

  return jsonb_build_object(
    'id', v_id,
    'inviteCode', v_code,
    'email', v_email,
    'name', v_name
  );
exception
  when unique_violation then
    raise exception 'driver_email_exists' using errcode = '22023';
end;
$$;

revoke execute on function public.add_partner_driver(text, text, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.add_partner_driver(text, text, text, text, integer, integer)
  to authenticated;

/**
 * Inscription d'un livreur partenaire. Appelée avec la clé de service après
 * création du compte auth. Le livreur reçoit une boutique technique pour le
 * ledger et le dispatch, comme un livreur Pashove classique.
 */
create or replace function public.join_partner_driver(
  p_code    uuid,
  p_user_id uuid,
  p_name    text default null,
  p_phone   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_driver  public.partner_drivers%rowtype;
  v_partner public.delivery_partners%rowtype;
  v_store   uuid;
  v_currency text := 'XOF';
  v_slug    text;
  v_courier uuid;
begin
  select * into v_driver
  from public.partner_drivers
  where invite_code = p_code
    and status = 'invited'
  for update;

  if v_driver.id is null then
    raise exception 'invite_invalid' using errcode = '22023';
  end if;

  select * into v_partner
  from public.delivery_partners
  where id = v_driver.partner_id
    and status = 'active';

  if v_partner.id is null then
    raise exception 'partner_inactive' using errcode = '22023';
  end if;

  update public.partner_drivers
  set user_id = p_user_id,
      name = coalesce(nullif(btrim(p_name), ''), name),
      phone = coalesce(nullif(btrim(p_phone), ''), phone),
      status = 'active',
      updated_at = now()
  where id = v_driver.id;

  insert into public.couriers (
    user_id, full_name, phone, email, country,
    id_document_key, selfie_key, status, partner_id
  )
  values (
    p_user_id,
    coalesce(nullif(btrim(p_name), ''), v_driver.name),
    coalesce(nullif(btrim(p_phone), ''), v_driver.phone),
    v_driver.email,
    v_partner.country,
    'partner', 'partner', 'approved', v_partner.id
  )
  on conflict (user_id) do update
    set partner_id = excluded.partner_id,
        status = 'approved',
        country = excluded.country,
        full_name = excluded.full_name,
        phone = excluded.phone,
        email = excluded.email
  returning id into v_courier;

  select s.id into v_store
  from public.store_members sm
  join public.stores s on s.id = sm.store_id
  where sm.user_id = p_user_id
    and sm.role = 'owner'
    and s.status = 'active'
    and s.country = v_partner.country
  order by s.created_at
  limit 1;

  if v_store is null then
    select m.currency into v_currency
    from public.platform_markets m
    where m.country_code = v_partner.country
    limit 1;

    v_currency := coalesce(v_currency, 'XOF');
    v_slug := 'livreur-' || substr(replace(p_user_id::text, '-', ''), 1, 20);

    insert into public.stores (name, slug, country, currency, status)
    values ('Espace livreur', v_slug, v_partner.country, v_currency, 'active')
    on conflict (slug) do nothing
    returning id into v_store;

    if v_store is null then
      v_slug := 'liv-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 22);
      insert into public.stores (name, slug, country, currency, status)
      values ('Espace livreur', v_slug, v_partner.country, v_currency, 'active')
      returning id into v_store;
    end if;

    insert into public.store_members (store_id, user_id, role)
    values (v_store, p_user_id, 'owner')
    on conflict (store_id, user_id) do nothing;
  end if;

  return jsonb_build_object(
    'driverId', v_driver.id,
    'courierId', v_courier,
    'storeId', v_store,
    'partnerId', v_partner.id
  );
end;
$$;

revoke execute on function public.join_partner_driver(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.join_partner_driver(uuid, uuid, text, text)
  to service_role;

/* ------------------------------------------------------------------ *
 *  Tableau de bord partenaire
 * ------------------------------------------------------------------ */

create or replace function public.partner_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner uuid := public.current_delivery_partner_id();
  v_result  jsonb;
begin
  if v_partner is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'partner', (
      select jsonb_build_object(
        'id', p.id,
        'companyName', p.company_name,
        'email', p.email,
        'phone', p.phone,
        'country', p.country,
        'commissionBps', p.commission_bps,
        'status', p.status
      )
      from public.delivery_partners p where p.id = v_partner
    ),
    'balance', coalesce((
      select jsonb_build_object(
        'balance', b.balance_fcfa,
        'earned', b.total_earned_fcfa,
        'paid', b.total_paid_fcfa
      )
      from public.partner_balances b where b.partner_id = v_partner
    ), jsonb_build_object('balance', 0, 'earned', 0, 'paid', 0)),
    'drivers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'name', d.name,
        'email', d.email,
        'phone', d.phone,
        'status', d.status,
        'compensationType', d.compensation_type,
        'commissionBps', d.commission_bps,
        'salaryAmount', d.salary_amount
      ) order by d.created_at desc)
      from public.partner_drivers d
      where d.partner_id = v_partner
    ), '[]'::jsonb),
    'stats', jsonb_build_object(
      'deliveries', (
        select count(*) from public.partner_delivery_earnings e
        where e.partner_id = v_partner
      ),
      'gross', coalesce((
        select sum(e.partner_gross) from public.partner_delivery_earnings e
        where e.partner_id = v_partner
      ), 0),
      'driverCommissions', coalesce((
        select sum(e.driver_commission) from public.partner_delivery_earnings e
        where e.partner_id = v_partner
      ), 0)
    ),
    'payouts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pp.id,
        'amount', pp.amount,
        'status', pp.status,
        'createdAt', pp.created_at,
        'paidAt', pp.paid_at
      ) order by pp.created_at desc)
      from public.partner_payouts pp
      where pp.partner_id = v_partner
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.partner_dashboard()
  from public, anon, authenticated;
grant execute on function public.partner_dashboard()
  to authenticated;

create or replace function public.request_partner_payout(p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner uuid := public.current_delivery_partner_id();
  v_balance public.partner_balances%rowtype;
  v_id      uuid;
begin
  if v_partner is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'amount_invalid' using errcode = '22023';
  end if;

  select * into v_balance
  from public.partner_balances
  where partner_id = v_partner
  for update;

  if v_balance.partner_id is null or v_balance.balance_fcfa < p_amount then
    raise exception 'insufficient_balance' using errcode = '22023';
  end if;

  update public.partner_balances
  set balance_fcfa = balance_fcfa - p_amount,
      updated_at = now()
  where partner_id = v_partner;

  insert into public.partner_payouts (partner_id, amount)
  values (v_partner, p_amount)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'amount', p_amount);
end;
$$;

revoke execute on function public.request_partner_payout(integer)
  from public, anon, authenticated;
grant execute on function public.request_partner_payout(integer)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Settlement : part du partenaire et part du livreur
 * ------------------------------------------------------------------ */

create or replace function public.settle_delivery(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery public.deliveries%rowtype;
  v_order public.orders%rowtype;
  v_courier public.couriers%rowtype;
  v_courier_store uuid;
  v_partner public.delivery_partners%rowtype;
  v_driver public.partner_drivers%rowtype;
  v_product_share integer;
  v_courier_share integer;
  v_platform_share integer;
  v_driver_commission integer := 0;
  v_partner_net integer := 0;
  v_earning uuid;
begin
  select * into v_delivery from public.deliveries where id = p_delivery_id;
  if v_delivery.id is null then
    return;
  end if;

  select * into v_order from public.orders where id = v_delivery.order_id;
  select * into v_courier from public.couriers where id = v_delivery.courier_id;

  if v_courier.id is null then
    raise exception 'courier_missing' using errcode = '22023';
  end if;

  select s.id into v_courier_store
  from public.store_members sm
  join public.stores s on s.id = sm.store_id
  where sm.user_id = v_courier.user_id
    and sm.role = 'owner'
  order by s.created_at
  limit 1;

  if v_courier_store is null then
    raise exception 'courier_store_missing' using errcode = '22023';
  end if;

  v_product_share := greatest(
    v_order.subtotal_amount - v_order.discount_amount,
    0
  );

  -- Libère la part produit au marchand et sort les frais de livraison.
  perform public.post_ledger_transaction(
    v_delivery.store_id, 'adjustment', 'order', v_order.id,
    'delivery-settle:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'delivery_settle',
      'product_share', v_product_share,
      'fee_amount', v_delivery.fee_amount,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'reserved', 'direction', 'credit',
        'amount', v_order.total_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'available', 'direction', 'debit',
        'amount', v_product_share, 'currency', v_order.currency),
      jsonb_build_object('account', 'fees', 'direction', 'debit',
        'amount', v_delivery.fee_amount, 'currency', v_order.currency)
    )
  );

  -- Un partenaire ou un livreur suspendu retombe sur le partage livreur
  -- classique : une course déjà livrée ne doit jamais rester non réglée.
  if v_courier.partner_id is not null then
    select * into v_partner
    from public.delivery_partners
    where id = v_courier.partner_id
      and status = 'active';

    select * into v_driver
    from public.partner_drivers
    where partner_id = v_courier.partner_id
      and user_id = v_courier.user_id
      and status = 'active';

    if v_partner.id is null or v_driver.id is null then
      v_courier.partner_id := null;
    end if;
  end if;

  if v_courier.partner_id is not null then
    v_platform_share := round(
      v_delivery.fee_amount * v_partner.commission_bps / 10000.0
    )::integer;
    v_courier_share := v_delivery.fee_amount - v_platform_share;

    if v_driver.compensation_type in ('commission', 'both') then
      v_driver_commission := round(
        v_delivery.fee_amount * coalesce(v_driver.commission_bps, 0) / 10000.0
      )::integer;
    end if;

    v_driver_commission := least(v_driver_commission, v_courier_share);
    v_partner_net := v_courier_share - v_driver_commission;

    -- La part du livreur part sur son ledger personnel.
    if v_driver_commission > 0 then
      perform public.post_ledger_transaction(
        v_courier_store, 'adjustment', 'order', v_order.id,
        'delivery-income:' || v_order.id::text,
        jsonb_build_object(
          'order_number', v_order.number,
          'role', 'delivery_income',
          'partner_id', v_partner.id,
          'source_store_id', v_delivery.store_id,
          'fee_amount', v_delivery.fee_amount,
          'currency', v_order.currency
        ),
        jsonb_build_array(
          jsonb_build_object('account', 'available', 'direction', 'debit',
            'amount', v_driver_commission, 'currency', v_order.currency),
          jsonb_build_object('account', 'delivery_income', 'direction', 'credit',
            'amount', v_driver_commission, 'currency', v_order.currency)
        )
      );
    end if;

    -- L'earning n'est enregistré qu'une fois par course ; le solde du
    -- partenaire suit la même clé d'idempotence.
    insert into public.partner_delivery_earnings (
      partner_id, driver_id, delivery_id, order_id, store_id,
      fee_amount, platform_share, partner_gross, driver_commission,
      partner_net, currency
    )
    values (
      v_partner.id, v_driver.id, v_delivery.id, v_order.id,
      v_delivery.store_id, v_delivery.fee_amount, v_platform_share,
      v_courier_share, v_driver_commission, v_partner_net, v_order.currency
    )
    on conflict (delivery_id) do nothing
    returning id into v_earning;

    if v_earning is not null then
      insert into public.partner_balances (partner_id)
      values (v_partner.id)
      on conflict (partner_id) do nothing;

      update public.partner_balances
      set balance_fcfa = balance_fcfa + v_partner_net,
          total_earned_fcfa = total_earned_fcfa + v_partner_net,
          updated_at = now()
      where partner_id = v_partner.id;
    end if;
  else
    v_courier_share := round(v_delivery.fee_amount * 0.9)::integer;
    v_platform_share := v_delivery.fee_amount - v_courier_share;

    if v_courier_share > 0 then
      perform public.post_ledger_transaction(
        v_courier_store, 'adjustment', 'order', v_order.id,
        'delivery-income:' || v_order.id::text,
        jsonb_build_object(
          'order_number', v_order.number,
          'role', 'delivery_income',
          'source_store_id', v_delivery.store_id,
          'fee_amount', v_delivery.fee_amount,
          'currency', v_order.currency
        ),
        jsonb_build_array(
          jsonb_build_object('account', 'available', 'direction', 'debit',
            'amount', v_courier_share, 'currency', v_order.currency),
          jsonb_build_object('account', 'delivery_income', 'direction', 'credit',
            'amount', v_courier_share, 'currency', v_order.currency)
        )
      );
    end if;
  end if;

  -- Part de la plateforme (10 % par défaut, configurable par partenaire).
  if v_platform_share > 0 then
    perform public.post_ledger_transaction(
      v_delivery.store_id, 'adjustment', 'order', v_order.id,
      'delivery-platform:' || v_order.id::text,
      jsonb_build_object(
        'order_number', v_order.number,
        'role', 'delivery_platform',
        'fee_amount', v_delivery.fee_amount,
        'currency', v_order.currency
      ),
      jsonb_build_array(
        jsonb_build_object('account', 'fees', 'direction', 'debit',
          'amount', v_platform_share, 'currency', v_order.currency),
        jsonb_build_object('account', 'delivery_commission_income', 'direction', 'credit',
          'amount', v_platform_share, 'currency', v_order.currency)
      )
    );
  end if;
end;
$$;

revoke execute on function public.settle_delivery(uuid)
  from public, anon, authenticated;
grant execute on function public.settle_delivery(uuid)
  to service_role;
/* ------------------------------------------------------------------ *
 *  Traitement administratif des versements partenaires
 * ------------------------------------------------------------------ */

create or replace function public.admin_settle_partner_payout(
  p_payout_id uuid,
  p_status    text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.partner_payouts%rowtype;
  v_status text := lower(btrim(coalesce(p_status, '')));
begin
  if not public.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if v_status not in ('paid', 'rejected') then
    raise exception 'status_invalid' using errcode = '22023';
  end if;

  select * into v_payout
  from public.partner_payouts
  where id = p_payout_id
  for update;

  if v_payout.id is null then
    raise exception 'payout_unknown' using errcode = '22023';
  end if;

  if v_payout.status <> 'requested' then
    return jsonb_build_object('status', v_payout.status, 'already', true);
  end if;

  if v_status = 'rejected' then
    update public.partner_balances
    set balance_fcfa = balance_fcfa + v_payout.amount,
        updated_at = now()
    where partner_id = v_payout.partner_id;
  else
    update public.partner_balances
    set total_paid_fcfa = total_paid_fcfa + v_payout.amount,
        updated_at = now()
    where partner_id = v_payout.partner_id;
  end if;

  update public.partner_payouts
  set status = v_status,
      paid_at = case when v_status = 'paid' then now() else null end
  where id = p_payout_id;

  return jsonb_build_object('status', v_status);
end;
$$;

revoke execute on function public.admin_settle_partner_payout(uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_settle_partner_payout(uuid, text)
  to authenticated;
