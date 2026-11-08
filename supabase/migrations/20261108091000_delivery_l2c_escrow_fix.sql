-- PASHOVE — L2c (correctif) : séquestre de la part marchand
--
-- La première version ne bloquait que les frais de livraison. La règle dit
-- que la part du marchand est libérée à la validation OTP. On séquestre donc
-- le montant total de la commande, puis on libère à la livraison :
--   disponible marchand = sous-total après remise ;
--   frais de livraison   = payés au livreur (90 %) et à Pashove (10 %).

create or replace function public.hold_delivery_fee(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;

  if v_order.id is null or v_order.total_amount <= 0 then
    return;
  end if;

  perform public.post_ledger_transaction(
    v_order.store_id, 'adjustment', 'order', v_order.id,
    'delivery-hold:' || v_order.id::text,
    jsonb_build_object(
      'order_number', v_order.number,
      'role', 'delivery_hold',
      'amount', v_order.total_amount,
      'currency', v_order.currency
    ),
    jsonb_build_array(
      jsonb_build_object('account', 'available', 'direction', 'credit',
        'amount', v_order.total_amount, 'currency', v_order.currency),
      jsonb_build_object('account', 'reserved', 'direction', 'debit',
        'amount', v_order.total_amount, 'currency', v_order.currency)
    )
  );
end;
$$;

revoke execute on function public.hold_delivery_fee(uuid)
  from public, anon, authenticated;

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
  v_product_share integer;
  v_courier_share integer;
  v_platform_share integer;
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
  v_courier_share := round(v_delivery.fee_amount * 0.9)::integer;
  v_platform_share := v_delivery.fee_amount - v_courier_share;

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

  -- Revenu du livreur, sur le ledger de sa boutique.
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

  -- 10 % de la course pour Pashove.
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
