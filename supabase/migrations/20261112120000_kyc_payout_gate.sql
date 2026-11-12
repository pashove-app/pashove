-- PASHOVE — Premier retrait : KYC obligatoire
--
-- Un marchand ne peut pas demander un retrait tant que son dossier KYC n'est
-- pas approuvé. Un livreur doit être approuvé avant tout retrait. La règle est
-- appliquée en base, pas seulement dans l'interface.

create or replace function public.enforce_payout_kyc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_type = 'store' then
    if not exists (
      select 1
      from public.kyc_cases c
      where c.store_id = new.store_id
        and c.status = 'approved'
    ) then
      raise exception 'kyc_required' using errcode = '22023';
    end if;
  elsif new.owner_type = 'courier' then
    if not exists (
      select 1
      from public.couriers c
      join public.store_members sm on sm.user_id = c.user_id
      where sm.store_id = new.store_id
        and sm.role = 'owner'
        and c.status = 'approved'
    ) then
      raise exception 'kyc_required' using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_payout_kyc()
  from public, anon, authenticated;

drop trigger if exists payouts_enforce_kyc on public.payouts;
create trigger payouts_enforce_kyc
  before insert on public.payouts
  for each row execute function public.enforce_payout_kyc();
