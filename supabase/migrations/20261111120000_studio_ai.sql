-- PASHOVE STUDIO — Débit atomique d'une génération IA
--
-- Le prix est toujours relu depuis studio_pricing : le client ne peut pas
-- choisir ce qu'il paie. La ligne de génération et le débit du portefeuille
-- sont écrits dans la même transaction, sous verrou du solde.

create or replace function public.charge_studio_generation(
  p_store_id       uuid,
  p_action_type    text,
  p_prompt         text,
  p_result_text    text default null,
  p_status         text default 'completed',
  p_cost_real_fcfa integer default 0,
  p_metadata       jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_price   integer;
  v_balance public.store_studio_balance%rowtype;
  v_id      uuid;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_store_member' using errcode = '42501';
  end if;

  if p_status not in ('completed', 'processing') then
    raise exception 'studio_status_invalid' using errcode = '22023';
  end if;

  if p_cost_real_fcfa is null or p_cost_real_fcfa < 0 then
    raise exception 'studio_cost_invalid' using errcode = '22023';
  end if;

  select price_fcfa into v_price
  from public.studio_pricing
  where action_type = btrim(p_action_type)
    and is_active;

  if v_price is null then
    raise exception 'studio_action_unknown' using errcode = '22023';
  end if;

  select * into v_balance
  from public.store_studio_balance
  where store_id = p_store_id
  for update;

  if v_balance.store_id is null then
    raise exception 'studio_balance_missing' using errcode = '22023';
  end if;

  if v_balance.balance_fcfa < v_price then
    raise exception 'studio_insufficient_balance' using errcode = '22023';
  end if;

  update public.store_studio_balance
  set balance_fcfa = balance_fcfa - v_price,
      total_spent = total_spent + v_price
  where store_id = p_store_id
  returning * into v_balance;

  insert into public.studio_generations (
    store_id, action_type, prompt, price_paid_fcfa, cost_real_fcfa,
    result_text, status, metadata, completed_at
  )
  values (
    p_store_id,
    btrim(p_action_type),
    btrim(p_prompt),
    v_price,
    p_cost_real_fcfa,
    p_result_text,
    p_status,
    coalesce(p_metadata, '{}'::jsonb),
    case when p_status = 'completed' then now() else null end
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'price', v_price,
    'balance', v_balance.balance_fcfa,
    'status', p_status
  );
end;
$$;

revoke execute on function public.charge_studio_generation(uuid, text, text, text, text, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.charge_studio_generation(uuid, text, text, text, text, integer, jsonb)
  to authenticated;
