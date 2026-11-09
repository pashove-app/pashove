-- PASHOVE — Zones de livraison multi-pays et conversion de devise
--
-- Une boutique peut livrer dans plusieurs pays. Le checkout affiche les zones
-- de tous ses pays de livraison ; le client choisit la sienne. La grille de la
-- plateforme est libellée dans la devise locale du pays ; au moment d'appliquer
-- la zone, le tarif est converti dans la devise de la commande (celle de la
-- boutique) avant d'être écrit dans `shipping_amount`.
--
-- Exemple : une boutique XOF au Mali, un client au Ghana, une zone à 20 GHS.
-- La commande reste en XOF ; 20 GHS sont convertis en XOF pour le ledger et
-- le split livreur.

create or replace function public.public_delivery_zones(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
begin
  select s.* into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store.id is null
     or v_store.delivery_mode <> 'pashove'
     or coalesce(array_length(v_store.delivery_countries, 1), 0) = 0 then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', z.id,
          'name', z.name,
          'feeAmount', z.fee_amount,
          'currency', z.currency,
          'countryCode', z.country_code,
          'isDefault', z.is_default
        )
        order by z.country_code, z.is_default desc, z.name
      )
      from public.delivery_zones z
      where z.country_code = any (v_store.delivery_countries)
        and z.is_active
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.public_delivery_zones(text)
  from public, anon, authenticated;
grant execute on function public.public_delivery_zones(text)
  to anon, authenticated;

create or replace function public.apply_delivery_zone(
  p_order_token uuid,
  p_zone_id     uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order    public.orders%rowtype;
  v_store    public.stores%rowtype;
  v_zone     public.delivery_zones%rowtype;
  v_rate     numeric := 1;
  v_shipping integer;
begin
  select * into v_order
  from public.orders
  where public_token = p_order_token
  for update;

  if v_order.id is null or v_order.payment_status <> 'pending' then
    raise exception 'order_unavailable' using errcode = '22023';
  end if;

  select * into v_store from public.stores where id = v_order.store_id;

  if v_store.id is null or v_store.delivery_mode <> 'pashove' then
    raise exception 'delivery_unavailable' using errcode = '22023';
  end if;

  select * into v_zone
  from public.delivery_zones
  where id = p_zone_id and is_active;

  if v_zone.id is null
     or v_zone.country_code <> v_order.shipping_country
     or not (v_zone.country_code = any (v_store.delivery_countries)) then
    raise exception 'zone_invalid' using errcode = '22023';
  end if;

  v_shipping := v_zone.fee_amount;

  if upper(v_zone.currency) <> upper(v_order.currency) then
    v_rate := public.public_fx_rate(v_zone.currency, v_order.currency);

    if v_rate is null then
      raise exception 'fx_unavailable' using errcode = '22023';
    end if;

    v_shipping := round(
      (v_zone.fee_amount::numeric
        / power(10, public.currency_decimals(v_zone.currency)))
      * v_rate
      * power(10, public.currency_decimals(v_order.currency))
    )::integer;
  end if;

  update public.orders
  set shipping_amount = v_shipping,
      total_amount = subtotal_amount - discount_amount + v_shipping
  where id = v_order.id;

  return jsonb_build_object(
    'shipping', v_shipping,
    'total', v_order.subtotal_amount - v_order.discount_amount + v_shipping,
    'currency', v_order.currency,
    'zoneFee', v_zone.fee_amount,
    'zoneCurrency', v_zone.currency,
    'fxRate', v_rate
  );
end;
$$;

revoke execute on function public.apply_delivery_zone(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.apply_delivery_zone(uuid, uuid)
  to anon, authenticated;
