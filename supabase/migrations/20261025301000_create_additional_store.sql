-- Évite l'ambiguïté avec `create_store(name, slug, country, currency)` de
-- l'onboarding : la création d'une boutique supplémentaire a son propre nom.

drop function if exists public.create_store(text, text, text, text, text);

create or replace function public.create_additional_store(
  p_name     text,
  p_slug     text,
  p_country  text,
  p_currency text,
  p_category text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_plan   text;
  v_max    integer;
  v_count  integer;
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select ap.plan_code into v_plan
  from public.account_plans ap
  where ap.user_id = v_uid;

  v_plan := coalesce(v_plan, 'free');

  select p.max_stores into v_max
  from public.plans p
  where p.code = v_plan;

  select count(*) into v_count
  from public.store_members m
  where m.user_id = v_uid
    and m.role = 'owner';

  if v_count >= coalesce(v_max, 2) then
    raise exception 'store_limit_reached' using errcode = '22023';
  end if;

  insert into public.stores (name, slug, country, currency, category, status)
  values (
    btrim(p_name),
    lower(btrim(p_slug)),
    upper(btrim(p_country)),
    upper(btrim(p_currency)),
    nullif(btrim(coalesce(p_category, '')), ''),
    'draft'
  )
  returning id into v_id;

  insert into public.store_members (store_id, user_id, role)
  values (v_id, v_uid, 'owner');

  return v_id;
end;
$$;

revoke execute on function public.create_additional_store(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_additional_store(text, text, text, text, text)
  to authenticated;
