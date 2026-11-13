-- PASHOVE — Parcours d'installation en 15 étapes
--
-- Les étapes vérifiables sont déduites de la base. Les autres (vérifier les
-- paiements, choisir un thème…) sont marquées manuellement par le marchand.

create table public.onboarding_progress (
  store_id     uuid not null references public.stores (id) on delete cascade,
  step_key     text not null check (step_key in (
    'store', 'profile', 'selling', 'product', 'payments', 'delivery',
    'policies', 'theme', 'domain', 'kyc', 'payout_method', 'team',
    'notifications', 'first_order', 'launch'
  )),
  completed_at timestamptz not null default now(),
  completed_by uuid references auth.users (id) on delete set null,
  primary key (store_id, step_key)
);

alter table public.onboarding_progress enable row level security;
revoke all on public.onboarding_progress from public, anon, authenticated;
grant select on public.onboarding_progress to authenticated;

create policy onboarding_progress_select on public.onboarding_progress
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());

create or replace function public.complete_onboarding_step(
  p_store_id uuid,
  p_step_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_step_key not in (
    'store', 'profile', 'selling', 'product', 'payments', 'delivery',
    'policies', 'theme', 'domain', 'kyc', 'payout_method', 'team',
    'notifications', 'first_order', 'launch'
  ) then
    raise exception 'step_invalid' using errcode = '22023';
  end if;

  insert into public.onboarding_progress (store_id, step_key, completed_by)
  values (p_store_id, p_step_key, (select auth.uid()))
  on conflict (store_id, step_key) do nothing;
end;
$$;

revoke execute on function public.complete_onboarding_step(uuid, text)
  from public, anon, authenticated;
grant execute on function public.complete_onboarding_step(uuid, text)
  to authenticated;
