-- Durcissement du socle des boutiques, après passage des linters Supabase.
--
-- Deux avertissements, deux corrections :
--
--   1. `touch_updated_at` avait un `search_path` mutable. Une fonction de
--      trigger appelée dans un autre contexte pourrait résoudre `now()` vers
--      autre chose si un schéma malveillant passait devant `pg_catalog`.
--   2. Les trois fonctions `security definer` restaient exécutables par `anon`.
--      PostgreSQL accorde EXECUTE à PUBLIC par défaut : révoquer auprès d'`anon`
--      ne retire pas ce droit hérité, il faut révoquer auprès de PUBLIC.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.create_store(text, text, text, text) from public, anon;
revoke execute on function public.is_store_member(uuid) from public, anon;
revoke execute on function public.has_store_role(uuid, public.store_role[]) from public, anon;

-- Elles restent nécessaires aux politiques RLS, qui s'exécutent avec les
-- droits du rôle connecté.
grant execute on function public.create_store(text, text, text, text) to authenticated;
grant execute on function public.is_store_member(uuid) to authenticated;
grant execute on function public.has_store_role(uuid, public.store_role[]) to authenticated;
