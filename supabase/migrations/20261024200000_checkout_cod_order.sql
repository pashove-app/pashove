-- Checkout COD réel.
--
-- `place_order` crée la commande, vérifie et décrémente le stock, puis vide le
-- panier. Pour le COD de la v2, la commande est immédiatement confirmée et
-- encaissée : le trigger `orders_ledger_cod` poste la vente et la commission.
-- (Le marchand pourra toujours corriger le paiement depuis la fiche commande.)

create or replace function public.place_cod_order(
  p_token           uuid,
  p_customer        jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result   jsonb;
  v_order_id uuid;
begin
  v_result := public.place_order(p_token, p_customer, p_idempotency_key);
  v_order_id := (v_result->>'orderId')::uuid;

  update public.orders
  set status = 'confirmed',
      payment_status = 'paid',
      confirmed_at = coalesce(confirmed_at, now())
  where id = v_order_id
    and payment_status = 'pending';

  update public.payments
  set status = 'captured'
  where order_id = v_order_id
    and provider = 'cod'
    and status = 'pending';

  if not exists (
    select 1
    from public.order_events e
    where e.order_id = v_order_id
      and e.type = 'payment_collected'
  ) then
    insert into public.order_events (order_id, store_id, type, payload)
    select
      o.id,
      o.store_id,
      'payment_collected',
      jsonb_build_object('method', 'cod', 'amount', o.total_amount)
    from public.orders o
    where o.id = v_order_id;
  end if;

  return v_result;
end;
$$;

revoke execute on function public.place_cod_order(uuid, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.place_cod_order(uuid, jsonb, uuid)
  to anon, authenticated;

-- Le checkout public passe uniquement par la version COD payée. La fonction
-- de base reste interne (la RPC security definer ci-dessus peut l'appeler).
revoke execute on function public.place_order(uuid, jsonb, uuid)
  from public, anon, authenticated;
