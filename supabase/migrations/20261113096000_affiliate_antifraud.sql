-- PASHOVE — Anti-fraude affiliation
--
-- Trois garde-fous : clics plafonnés par lien/IP, auto-parrainage refusé
-- (même e-mail ou téléphone que la boutique affiliée), et commission plafonnée
-- pour ne jamais dépasser la marge après la commission plateforme.

create table public.affiliate_clicks (
  id              uuid primary key default gen_random_uuid(),
  link_id         uuid not null references public.affiliate_links (id) on delete cascade,
  ip_hash         text check (ip_hash is null or char_length(ip_hash) = 64),
  user_agent_hash text check (user_agent_hash is null or char_length(user_agent_hash) = 64),
  order_id        uuid references public.orders (id) on delete set null,
  occurred_at     timestamptz not null default now()
);

create index affiliate_clicks_link_idx
  on public.affiliate_clicks (link_id, occurred_at desc);

alter table public.affiliate_clicks enable row level security;
revoke all on public.affiliate_clicks from public, anon, authenticated;

create or replace function public.record_affiliate_click(
  p_code          text,
  p_ip_hash       text default null,
  p_user_agent_hash text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link   public.affiliate_links%rowtype;
  v_recent integer;
begin
  select l.* into v_link
  from public.affiliate_links l
  join public.stores s on s.id = l.affiliate_store_id
  where l.code = upper(btrim(coalesce(p_code, '')))
    and l.active
    and s.status = 'active';

  if v_link.id is null then
    return false;
  end if;

  select count(*) into v_recent
  from public.affiliate_clicks c
  where c.link_id = v_link.id
    and c.occurred_at > now() - interval '1 hour'
    and (p_ip_hash is null or c.ip_hash = p_ip_hash);

  if v_recent >= 30 then
    return false;
  end if;

  insert into public.affiliate_clicks (link_id, ip_hash, user_agent_hash)
  values (
    v_link.id,
    nullif(p_ip_hash, ''),
    nullif(p_user_agent_hash, '')
  );

  return true;
end;
$$;

revoke execute on function public.record_affiliate_click(text, text, text)
  from public;
grant execute on function public.record_affiliate_click(text, text, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Attribution renforcée
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
  v_order        public.orders%rowtype;
  v_link         public.affiliate_links%rowtype;
  v_offer        public.partner_offers%rowtype;
  v_affiliate    public.stores%rowtype;
  v_platform_bps integer := 0;
  v_platform     integer := 0;
  v_base         integer := 0;
  v_commission   integer := 0;
  v_max          integer := 0;
  v_phone        text;
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

  select * into v_affiliate from public.stores
  where id = v_link.affiliate_store_id;

  if v_affiliate.id is null or v_affiliate.status <> 'active' then
    return jsonb_build_object('status', 'ignored', 'reason', 'affiliate_inactive');
  end if;

  if v_offer.store_id <> v_order.store_id
     or v_link.affiliate_store_id = v_order.store_id then
    return jsonb_build_object('status', 'ignored', 'reason', 'not_applicable');
  end if;

  -- Auto-parrainage : l'affilié ne peut pas être aussi le client.
  v_phone := right(regexp_replace(coalesce(v_order.customer_phone, ''), '\D', '', 'g'), 9);

  if (
    v_affiliate.contact_email is not null
    and lower(v_affiliate.contact_email) = lower(coalesce(v_order.customer_email, ''))
  ) or (
    v_affiliate.contact_phone is not null
    and char_length(v_phone) = 9
    and right(regexp_replace(v_affiliate.contact_phone, '\D', '', 'g'), 9) = v_phone
  ) then
    return jsonb_build_object('status', 'ignored', 'reason', 'self_referral');
  end if;

  select coalesce(sum(oi.line_total), 0)::integer into v_base
  from public.order_items oi
  where oi.order_id = v_order.id
    and oi.product_id = v_offer.product_id;

  if v_base <= 0 then
    return jsonb_build_object('status', 'ignored', 'reason', 'product_absent');
  end if;

  v_commission := round(v_base * v_offer.commission_bps / 10000.0)::integer;

  select coalesce(commission_bps, 0) into v_platform_bps
  from public.stores where id = v_order.store_id;

  v_platform := round(
    greatest(v_order.subtotal_amount - v_order.discount_amount, 0)
    * v_platform_bps / 10000.0
  )::integer;

  v_max := greatest(
    least(v_base, greatest(v_order.subtotal_amount - v_order.discount_amount, 0))
    - v_platform,
    0
  );

  v_commission := least(v_commission, v_max);

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
 *  Statistiques de lien
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
          'clicks', (
            select count(*)::integer from public.affiliate_clicks c
            where c.link_id = l.id
          ),
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
