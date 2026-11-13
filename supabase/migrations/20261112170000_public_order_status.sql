-- PASHOVE — Suivi de commande public par numéro et téléphone
--
-- Le client retrouve l'état d'une commande sans compte. La fonction ne renvoie
-- que des champs de suivi, jamais l'adresse, l'e-mail ni le contenu du panier.

create or replace function public.public_order_status(
  p_slug   text,
  p_number integer,
  p_phone  text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
  v_order public.orders%rowtype;
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
begin
  if char_length(v_phone) < 9 or p_number is null or p_number <= 0 then
    return null;
  end if;

  select * into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug)) and s.status = 'active';

  if v_store.id is null then
    return null;
  end if;

  select * into v_order
  from public.orders o
  where o.store_id = v_store.id
    and o.number = p_number
    and right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = v_phone
  limit 1;

  if v_order.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'number', v_order.number,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'payment_method', v_order.payment_method,
    'total', v_order.total_amount,
    'currency', v_order.currency,
    'created_at', v_order.created_at,
    'tracking_number', v_order.tracking_number,
    'shipping_city', v_order.shipping_city,
    'shipping_country', v_order.shipping_country
  );
end;
$$;

revoke execute on function public.public_order_status(text, integer, text)
  from public;
grant execute on function public.public_order_status(text, integer, text)
  to anon, authenticated;
