-- PASHOVE STUDIO — Statut des recharges SasPay
--
-- Une recharge passe par trois états avant le crédit :
--   pending   : ligne créée, appel SasPay pas encore accepté ;
--   initiated : SasPay a accepté et une référence est enregistrée ;
--   paid      : webhook confirmé, solde crédité ;
--   failed    : refus SasPay ou abandon.
--
-- Une recharge `pending` sans référence peut être réutilisée uniquement pour
-- le même montant. Si le montant change, l'ancienne est marquée `failed` et
-- une nouvelle est créée avec une nouvelle clé d'idempotence : sinon SasPay
-- répond 409 (même clé, corps différent) et la recharge reste bloquée.

alter table public.studio_topups
  drop constraint if exists studio_topups_status_check;

alter table public.studio_topups
  add constraint studio_topups_status_check
  check (status in ('pending', 'initiated', 'paid', 'failed'));

create or replace function public.create_studio_topup(
  p_store_id uuid,
  p_amount   integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid := auth.uid();
  v_store public.stores%rowtype;
  v_row   public.studio_topups%rowtype;
  v_id    uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not public.is_store_member(p_store_id) then
    raise exception 'not_store_member' using errcode = '42501';
  end if;

  select * into v_store from public.stores where id = p_store_id;

  if v_store.id is null then
    raise exception 'store_unknown' using errcode = '22023';
  end if;

  if upper(v_store.currency) <> 'XOF' then
    raise exception 'studio_currency_unsupported' using errcode = '22023';
  end if;

  if p_amount is null or p_amount < 500 or p_amount > 500000 then
    raise exception 'studio_amount_invalid' using errcode = '22023';
  end if;

  -- Seules les recharges jamais transmises à SasPay expirent automatiquement.
  -- Une recharge `initiated` peut encore être confirmée par le webhook.
  update public.studio_topups
  set status = 'failed'
  where store_id = p_store_id
    and provider = 'saspay'
    and status = 'pending'
    and provider_reference is null
    and created_at < now() - interval '2 hours';

  select * into v_row
  from public.studio_topups
  where store_id = p_store_id
    and provider = 'saspay'
    and status in ('pending', 'initiated')
  order by created_at desc
  limit 1;

  if v_row.id is not null then
    if v_row.status = 'pending' and v_row.provider_reference is null then
      if v_row.amount_fcfa = p_amount then
        return jsonb_build_object(
          'id', v_row.id,
          'amount', v_row.amount_fcfa,
          'currency', 'XOF'
        );
      end if;

      -- Montant différent : cette ligne n'a jamais été envoyée à SasPay.
      update public.studio_topups
      set status = 'failed'
      where id = v_row.id;
    else
      raise exception 'studio_topup_pending' using errcode = '22023';
    end if;
  end if;

  insert into public.studio_topups (store_id, amount_fcfa, status, provider)
  values (p_store_id, p_amount, 'pending', 'saspay')
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'amount', p_amount,
    'currency', 'XOF'
  );
end;
$$;

revoke execute on function public.create_studio_topup(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.create_studio_topup(uuid, integer)
  to authenticated;

create or replace function public.record_studio_topup_intent(
  p_id           uuid,
  p_reference    text,
  p_network      text,
  p_redirect_url text default null,
  p_country      text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.studio_topups t
  set provider_reference = btrim(p_reference),
      status = 'initiated',
      network_code = nullif(btrim(coalesce(p_network, '')), ''),
      redirect_url = nullif(btrim(coalesce(p_redirect_url, '')), ''),
      country_code = nullif(upper(btrim(coalesce(p_country, ''))), '')
  where t.id = p_id
    and t.status = 'pending'
    and t.provider_reference is null
    and public.is_store_member(t.store_id);
end;
$$;

revoke execute on function public.record_studio_topup_intent(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_studio_topup_intent(uuid, text, text, text, text)
  to authenticated;

-- Refus ou abandon avant l'appel SasPay : la ligne ne doit pas rester en
-- attente et ne doit jamais bloquer la recharge suivante.
create or replace function public.fail_studio_topup_by_id(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
begin
  select store_id into v_store_id
  from public.studio_topups
  where id = p_id;

  if v_store_id is null or not public.is_store_member(v_store_id) then
    raise exception 'not_store_member' using errcode = '42501';
  end if;

  update public.studio_topups
  set status = 'failed'
  where id = p_id
    and status = 'pending'
    and provider_reference is null;

  return jsonb_build_object('status', 'failed');
end;
$$;

revoke execute on function public.fail_studio_topup_by_id(uuid)
  from public, anon, authenticated;
grant execute on function public.fail_studio_topup_by_id(uuid)
  to authenticated;

create or replace function public.confirm_studio_topup(
  p_reference text,
  p_amount    numeric,
  p_currency  text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row     public.studio_topups%rowtype;
  v_balance public.store_studio_balance%rowtype;
begin
  select * into v_row
  from public.studio_topups
  where provider_reference = btrim(p_reference)
  for update;

  if v_row.id is null then
    return jsonb_build_object('status', 'ignored', 'reason', 'studio_topup_unknown');
  end if;

  if v_row.status = 'paid' then
    return jsonb_build_object('status', 'captured', 'already', true);
  end if;

  if v_row.status not in ('pending', 'initiated') then
    return jsonb_build_object('status', 'ignored', 'reason', 'studio_topup_not_pending');
  end if;

  if round(p_amount, 2) <> v_row.amount_fcfa
     or upper(btrim(p_currency)) <> 'XOF' then
    return jsonb_build_object('status', 'ignored', 'reason', 'amount_mismatch');
  end if;

  select * into v_balance
  from public.store_studio_balance
  where store_id = v_row.store_id
  for update;

  if v_balance.store_id is null then
    insert into public.store_studio_balance (store_id, balance_fcfa, total_recharged)
    values (v_row.store_id, 0, 0)
    on conflict (store_id) do nothing;

    select * into v_balance
    from public.store_studio_balance
    where store_id = v_row.store_id
    for update;
  end if;

  update public.store_studio_balance
  set balance_fcfa = balance_fcfa + v_row.amount_fcfa,
      total_recharged = total_recharged + v_row.amount_fcfa
  where store_id = v_row.store_id
  returning * into v_balance;

  update public.studio_topups
  set status = 'paid',
      paid_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'status', 'captured',
    'balance', v_balance.balance_fcfa
  );
end;
$$;

revoke execute on function public.confirm_studio_topup(text, numeric, text)
  from public, anon, authenticated;
grant execute on function public.confirm_studio_topup(text, numeric, text)
  to service_role;

create or replace function public.fail_studio_topup(p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.studio_topups
  set status = 'failed'
  where provider_reference = btrim(p_reference)
    and status in ('pending', 'initiated');

  return jsonb_build_object('status', 'failed');
end;
$$;

revoke execute on function public.fail_studio_topup(text)
  from public, anon, authenticated;
grant execute on function public.fail_studio_topup(text)
  to service_role;
