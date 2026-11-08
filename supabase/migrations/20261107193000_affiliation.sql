-- PASHOVE — P2b : affiliation par lien
--
-- Chaque utilisateur possède déjà une boutique (règle Pashove). L'affilié
-- génère un lien vers l'offre d'un autre marchand ; sa commission tombe sur
-- le ledger de sa propre boutique, comme un revenu marchand.
--
-- La commission sort de la part du propriétaire : le ledger du propriétaire
-- est crédité en `available` négatif (crédit) et un compte
-- `affiliate_commission` équilibre l'écriture. Côté affilié, `available` est
-- débité et `affiliate_income` crédité.

/* ------------------------------------------------------------------ *
 *  Comptes de ledger
 * ------------------------------------------------------------------ */

alter table public.ledger_accounts drop constraint if exists ledger_accounts_code_check;
alter table public.ledger_accounts
  add constraint ledger_accounts_code_check
  check (code in (
    'pending', 'available', 'reserved', 'cod_cash',
    'commission_due', 'sales', 'shipping_income', 'fees', 'payouts',
    'saspay_fees_absorbed', 'affiliate_commission', 'affiliate_income'
  ));

/* ------------------------------------------------------------------ *
 *  Liens
 * ------------------------------------------------------------------ */

create table if not exists public.affiliate_links (
  id                 uuid primary key default gen_random_uuid(),
  offer_id           uuid not null references public.partner_offers (id) on delete cascade,
  affiliate_store_id uuid not null references public.stores (id) on delete cascade,
  code               text not null unique check (code ~ '^[A-Z0-9]{6,16}$'),
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (offer_id, affiliate_store_id)
);

create index if not exists affiliate_links_store_idx
  on public.affiliate_links (affiliate_store_id, created_at desc);

alter table public.affiliate_links enable row level security;
revoke all on public.affiliate_links from public, anon, authenticated;

alter table public.orders
  add column if not exists affiliate_link_id uuid
    references public.affiliate_links (id) on delete set null,
  add column if not exists affiliate_store_id uuid
    references public.stores (id) on delete set null,
  add column if not exists affiliate_commission integer not null default 0
    check (affiliate_commission >= 0);

create index if not exists orders_affiliate_idx
  on public.orders (affiliate_link_id);

/* ------------------------------------------------------------------ *
 *  Création du lien par l'affilié
 * ------------------------------------------------------------------ */

create or replace function public.create_affiliate_link(
  p_offer_id uuid,
  p_store_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.partner_offers%rowtype;
  v_source public.products%rowtype;
  v_owner public.stores%rowtype;
  v_code text;
  v_link public.affiliate_links%rowtype;
begin
  if not public.has_store_role(
    p_store_id,
    array['owner', 'admin', 'product_manager']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select * into v_offer from public.partner_offers
  where id = p_offer_id and active;

  if v_offer.id is null then
    raise exception 'partner_offer_unavailable' using errcode = '22023';
  end if;

  if v_offer.store_id = p_store_id then
    raise exception 'partner_own_store' using errcode = '22023';
  end if;

  select * into v_source from public.products
  where id = v_offer.product_id and status = 'published';

  select * into v_owner from public.stores
  where id = v_offer.store_id and status = 'active';

  if v_source.id is null or v_owner.id is null then
    raise exception 'partner_product_unavailable' using errcode = '22023';
  end if;

  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  while exists (select 1 from public.affiliate_links where code = v_code) loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
  end loop;

  insert into public.affiliate_links (offer_id, affiliate_store_id, code)
  values (p_offer_id, p_store_id, v_code)
  on conflict (offer_id, affiliate_store_id) do update
    set active = true
  returning * into v_link;

  return jsonb_build_object(
    'id', v_link.id,
    'code', v_link.code,
    'commissionBps', v_offer.commission_bps,
    'productName', v_source.name,
    'ownerStoreName', v_owner.name,
    'ownerStoreSlug', v_owner.slug
  );
end;
$$;

revoke execute on function public.create_affiliate_link(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.create_affiliate_link(uuid, uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Attribution au checkout
 * ------------------------------------------------------------------ */

create or replace function public.attach_affiliate(
  p_order_token uuid,
  p_code        text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_link public.affiliate_links%rowtype;
  v_offer public.partner_offers%rowtype;
  v_base integer := 0;
  v_commission integer := 0;
begin
  select * into v_order from public.orders
  where public_token = p_order_token
  for update;

  if v_order.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'order_unknown');
  end if;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object('status', 'ignored', 'reason', 'already_paid');
  end if;

  if v_order.affiliate_link_id is not null then
    return jsonb_build_object('status', 'ignored', 'reason', 'already_attributed');
  end if;

  select * into v_link from public.affiliate_links
  where code = upper(btrim(coalesce(p_code, ''))) and active;

  if v_link.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'link_unknown');
  end if;

  select * into v_offer from public.partner_offers
  where id = v_link.offer_id and active;

  if v_offer.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'offer_inactive');
  end if;

  if v_offer.store_id <> v_order.store_id
     or v_link.affiliate_store_id = v_order.store_id then
    return jsonb_build_object('status', 'ignored', 'reason', 'not_applicable');
  end if;

  select coalesce(sum(oi.line_total), 0)::integer into v_base
  from public.order_items oi
  where oi.order_id = v_order.id
    and oi.product_id = v_offer.product_id;

  if v_base <= 0 then
    return jsonb_build_object('status', 'ignored', 'reason', 'product_absent');
  end if;

  v_commission := round(v_base * v_offer.commission_bps / 10000.0)::integer;

  if v_commission <= 0 then
    return jsonb_build_object('status', 'ignored', 'reason', 'zero_commission');
  end if;

  update public.orders
  set affiliate_link_id = v_link.id,
      affiliate_store_id = v_link.affiliate_store_id,
      affiliate_commission = v_commission
  where id = v_order.id;

  return jsonb_build_object(
    'status', 'attached',
    'commission', v_commission,
    'affiliateStoreId', v_link.affiliate_store_id
  );
end;
$$;

revoke execute on function public.attach_affiliate(uuid, text)
  from public, anon, authenticated;
grant execute on function public.attach_affiliate(uuid, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Split à la capture
 * ------------------------------------------------------------------ */

create or replace function public.post_affiliate_commission(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;

  if v_order.id is null
     or v_order.payment_status <> 'paid'
     or v_order.affiliate_commission <= 0
     or v_order.affiliate_store_id is null
     or v_order.affiliate_store_id = v_order.store_id then
    return null;
  end if;

  -- Part du propriétaire : son solde disponible diminue.
  perform public.post_ledger_transaction(
    v_order.store_id, 'commission', 'order', v_order.id,
    'affiliate-owner:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'affiliate',
      'affiliate_store_id', v_order.affiliate_store_id,
      'commission_amount', v_order.affiliate_commission,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'affiliate_commission', 'direction', 'debit',
        'amount', v_order.affiliate_commission, 'currency', v_order.currency),
      jsonb_build_object('account', 'available', 'direction', 'credit',
        'amount', v_order.affiliate_commission, 'currency', v_order.currency)
    )
  );

  -- Revenu de l'affilié, sur le ledger de sa propre boutique.
  perform public.post_ledger_transaction(
    v_order.affiliate_store_id, 'commission', 'order', v_order.id,
    'affiliate-income:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'affiliate_income',
      'source_store_id', v_order.store_id,
      'commission_amount', v_order.affiliate_commission,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'available', 'direction', 'debit',
        'amount', v_order.affiliate_commission, 'currency', v_order.currency),
      jsonb_build_object('account', 'affiliate_income', 'direction', 'credit',
        'amount', v_order.affiliate_commission, 'currency', v_order.currency)
    )
  );

  return v_order.id;
end;
$$;

revoke execute on function public.post_affiliate_commission(uuid)
  from public, anon, authenticated;

create or replace function public.ledger_on_order_paid_affiliate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if NEW.payment_status = 'paid'
     and OLD.payment_status is distinct from 'paid' then
    perform public.post_affiliate_commission(NEW.id);
  end if;

  return NEW;
end;
$$;

revoke execute on function public.ledger_on_order_paid_affiliate()
  from public, anon, authenticated;

drop trigger if exists orders_affiliate_commission on public.orders;
create trigger orders_affiliate_commission
  after update of payment_status on public.orders
  for each row execute function public.ledger_on_order_paid_affiliate();

/* ------------------------------------------------------------------ *
 *  Liste des liens de l'affilié
 * ------------------------------------------------------------------ */

create or replace function public.list_affiliate_links(p_store_id uuid)
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
          'id', l.id,
          'code', l.code,
          'active', l.active,
          'commissionBps', o.commission_bps,
          'productName', p.name,
          'ownerStoreName', s.name,
          'ownerStoreSlug', s.slug,
          'salesCount', (
            select count(*)::integer from public.orders ord
            where ord.affiliate_link_id = l.id
              and ord.payment_status = 'paid'
          ),
          'earned', (
            select coalesce(sum(ord.affiliate_commission), 0)::integer
            from public.orders ord
            where ord.affiliate_link_id = l.id
              and ord.payment_status = 'paid'
          )
        )
        order by l.created_at desc
      )
      from public.affiliate_links l
      join public.partner_offers o on o.id = l.offer_id
      join public.products p on p.id = o.product_id
      join public.stores s on s.id = o.store_id
      where l.affiliate_store_id = p_store_id
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.list_affiliate_links(uuid)
  from public, anon, authenticated;
grant execute on function public.list_affiliate_links(uuid)
  to authenticated;
