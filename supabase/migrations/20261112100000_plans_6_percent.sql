-- PASHOVE — Plan Free à 6 % et frais SasPay portés par le client
--
-- La commission de plateforme du plan Free passe de 10 % à 6 %. Pashove
-- n'absorbe plus les frais SasPay : ils sont ajoutés au montant payé par le
-- client (mode ADD_ON). Le marchand peut choisir de les absorber, auquel cas
-- SasPay les déduit de son net.

update public.plans
set commission_bps = 600,
    fee_included = false
where code = 'free';

-- Aucun plan n'inclut plus les frais de paiement.
update public.plans
set fee_included = false
where fee_included = true;

-- Les boutiques du plan Free passent de 10 % à 6 %.
update public.stores
set commission_bps = 600
where commission_bps = 1000;

alter table public.stores
  alter column commission_bps set default 600;

-- À la création d'une boutique, la commission suit le plan du propriétaire.
-- Le déclencheur est nécessaire : create_store insère la boutique avant le
-- membre, et les plans Standard/Pro doivent écraser la valeur par défaut.
create or replace function public.apply_owner_plan_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'owner' then
    perform set_config('pashove.allow_commission_update', 'on', true);

    update public.stores s
    set commission_bps = coalesce((
      select p.commission_bps
      from public.account_plans ap
      join public.plans p on p.code = ap.plan_code
      where ap.user_id = new.user_id
    ), 600)
    where s.id = new.store_id;
  end if;

  return new;
end;
$$;

revoke execute on function public.apply_owner_plan_commission()
  from public, anon, authenticated;

drop trigger if exists store_members_apply_commission on public.store_members;
create trigger store_members_apply_commission
  after insert on public.store_members
  for each row execute function public.apply_owner_plan_commission();

-- Par défaut, les frais sont à la charge du client ; le marchand peut
-- basculer ce réglage dans ses paramètres de checkout.
alter table public.stores
  alter column fee_charge_mode set default 'client';

update public.stores
set fee_charge_mode = 'client'
where fee_charge_mode = 'merchant';
