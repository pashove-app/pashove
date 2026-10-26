-- Un membre de la boutique ne crée pas une conversation client avec lui-même.
-- Le widget vitrine l'oriente vers la boîte Support du dashboard.

create or replace function public.chat_open_customer(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_store  public.stores%rowtype;
  v_email  text;
  v_name   text;
  v_conv   public.conversations%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('authRequired', true);
  end if;

  select s.* into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store.id is null then
    return null;
  end if;

  if public.is_store_member(v_store.id) then
    return jsonb_build_object('merchant', true, 'storeId', v_store.id);
  end if;

  select u.email::text,
         coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), u.email::text)
  into v_email, v_name
  from auth.users u
  where u.id = v_uid;

  insert into public.conversations (
    store_id, kind, customer_user_id, customer_email, customer_name
  )
  values (v_store.id, 'customer', v_uid, v_email, v_name)
  on conflict (store_id, customer_user_id)
    where kind = 'customer' and customer_user_id is not null
  do update set
    customer_email = excluded.customer_email,
    customer_name = excluded.customer_name
  returning * into v_conv;

  return jsonb_build_object(
    'id', v_conv.id,
    'kind', v_conv.kind,
    'storeId', v_conv.store_id,
    'storeName', v_store.name,
    'customerName', v_conv.customer_name
  );
end;
$$;

revoke execute on function public.chat_open_customer(text)
  from public, anon, authenticated;
grant execute on function public.chat_open_customer(text)
  to authenticated;
