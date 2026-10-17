-- Profil marchand : nom, téléphone, fuseau horaire.
--
-- Une ligne par compte, et une seule. Le trigger la crée à l'inscription, ce qui
-- évite que l'écran de profil ait à fabriquer une ligne au moment de
-- l'enregistrement — et garantit qu'aucun compte n'existe sans profil.

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  phone      text,
  -- Fuseau IANA. Par défaut Abidjan : la zone de lancement est en GMT.
  timezone   text not null default 'Africa/Abidjan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_length check (char_length(full_name) <= 120),
  constraint profiles_phone_length
    check (phone is null or char_length(phone) between 6 and 24),
  constraint profiles_timezone_length check (char_length(timezone) between 3 and 64)
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

/* ------------------------------------------------------------------ *
 *  Création automatique
 *
 *  `security definer` : le trigger écrit dans `public` depuis le schéma
 *  `auth`, et l'utilisateur qui s'inscrit n'a — volontairement — aucune
 *  politique d'insertion sur `profiles`.
 * ------------------------------------------------------------------ */

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Une fonction de trigger n'a pas besoin d'être appelable depuis l'API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Les comptes créés avant cette table ont droit à leur ligne eux aussi.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

/* ------------------------------------------------------------------ *
 *  Politiques
 * ------------------------------------------------------------------ */

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

-- Aucune politique d'insertion : la ligne naît avec le compte.
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
