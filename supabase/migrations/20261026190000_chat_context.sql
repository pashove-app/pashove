-- Contexte des conversations : nom du marchand pour le support et dernière
-- commande du client, pour que chaque fil soit identifiable dans la liste.

create or replace function public.chat_conversations(p_scope text default 'merchant')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_scope  text := lower(btrim(coalesce(p_scope, 'merchant')));
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  if v_scope = 'platform' then
    if not public.is_platform_admin() then
      return '[]'::jsonb;
    end if;

    return coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'kind', c.kind,
            'storeId', c.store_id,
            'storeName', s.name,
            'merchantName', (
              select coalesce(
                nullif(u.raw_user_meta_data->>'full_name', ''),
                u.email::text
              )
              from public.store_members sm
              join auth.users u on u.id = sm.user_id
              where sm.store_id = c.store_id
                and sm.role = 'owner'
              order by sm.created_at
              limit 1
            ),
            'customerName', c.customer_name,
            'customerEmail', c.customer_email,
            'orderNumber', null,
            'lastMessage', (
              select coalesce(nullif(btrim(m.body), ''), 'Pièce jointe')
              from public.messages m
              where m.conversation_id = c.id
              order by m.created_at desc limit 1
            ),
            'lastAt', c.last_message_at
          )
          order by c.last_message_at desc
        )
        from public.conversations c
        join public.stores s on s.id = c.store_id
        where c.kind = 'support'
      ),
      '[]'::jsonb
    );
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'kind', c.kind,
          'storeId', c.store_id,
          'storeName', s.name,
          'merchantName', (
            select coalesce(
              nullif(u.raw_user_meta_data->>'full_name', ''),
              u.email::text
            )
            from public.store_members sm
            join auth.users u on u.id = sm.user_id
            where sm.store_id = c.store_id
              and sm.role = 'owner'
            order by sm.created_at
            limit 1
          ),
          'customerName', c.customer_name,
          'customerEmail', c.customer_email,
          'orderNumber', case
            when c.kind = 'customer' then (
              select max(o.number)
              from public.orders o
              where o.store_id = c.store_id
                and (
                  (c.customer_user_id is not null
                    and o.customer_user_id = c.customer_user_id)
                  or (c.customer_email is not null
                    and lower(o.customer_email) = lower(c.customer_email))
                )
            )
            else null
          end,
          'lastMessage', (
            select coalesce(nullif(btrim(m.body), ''), 'Pièce jointe')
            from public.messages m
            where m.conversation_id = c.id
            order by m.created_at desc limit 1
          ),
          'lastAt', c.last_message_at
        )
        order by c.last_message_at desc
      )
      from public.conversations c
      join public.stores s on s.id = c.store_id
      join public.store_members sm on sm.store_id = c.store_id
      where sm.user_id = v_uid
        and c.kind in ('support', 'customer')
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.chat_conversations(text)
  from public, anon, authenticated;
grant execute on function public.chat_conversations(text)
  to authenticated;
