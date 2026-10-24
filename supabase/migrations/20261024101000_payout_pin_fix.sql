-- Un échec de PIN doit enregistrer la tentative. Lever une exception
-- annulerait l'incrément et rendrait le verrouillage inopérant : la fonction
-- renvoie donc `false`, et seuls le PIN absent, le verrouillage et l'accès
-- refusé lèvent une exception.

create or replace function public.verify_payout_pin(
  p_store_id uuid,
  p_pin      text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash     text;
  v_attempts integer;
  v_locked   timestamptz;
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  select s.payout_pin_hash, s.pin_failed_attempts, s.pin_locked_until
  into v_hash, v_attempts, v_locked
  from public.store_security s
  where s.store_id = p_store_id
  for update;

  if v_hash is null then
    raise exception 'pin_not_set' using errcode = '22023';
  end if;

  if v_locked is not null and v_locked > now() then
    raise exception 'pin_locked' using errcode = '22023';
  end if;

  if p_pin is not null and extensions.crypt(p_pin, v_hash) = v_hash then
    update public.store_security
    set pin_failed_attempts = 0,
        pin_locked_until = null,
        updated_at = now()
    where store_id = p_store_id;

    return true;
  end if;

  v_attempts := coalesce(v_attempts, 0) + 1;

  update public.store_security
  set pin_failed_attempts = case when v_attempts >= 5 then 0 else v_attempts end,
      pin_locked_until = case when v_attempts >= 5 then now() + interval '30 minutes' else pin_locked_until end,
      updated_at = now()
  where store_id = p_store_id;

  return false;
end;
$$;

revoke execute on function public.verify_payout_pin(uuid, text)
  from public, anon, authenticated;
grant execute on function public.verify_payout_pin(uuid, text)
  to authenticated;
