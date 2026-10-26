-- Messagerie : support marchand ↔ plateforme et conversations marchand ↔ client.
--
-- Les tables ne sont jamais lues directement par le client. Toutes les
-- opérations passent par des RPC `security definer` qui vérifient le rôle de
-- l'appelant : client propriétaire, membre de la boutique ou administrateur
-- plateforme. Le corps d'un message est borné à 4 000 caractères.

create table public.conversations (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores (id) on delete cascade,
  kind              text not null check (kind in ('support', 'customer')),
  customer_user_id  uuid references auth.users (id) on delete set null,
  customer_email    text,
  customer_name     text,
  created_at        timestamptz not null default now(),
  last_message_at   timestamptz not null default now()
);

create unique index conversations_support_store_idx
  on public.conversations (store_id)
  where kind = 'support';

create unique index conversations_customer_user_idx
  on public.conversations (store_id, customer_user_id)
  where kind = 'customer' and customer_user_id is not null;

create index conversations_store_idx
  on public.conversations (store_id, last_message_at desc);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  store_id         uuid not null references public.stores (id) on delete cascade,
  sender_role      text not null check (sender_role in ('customer', 'merchant', 'platform')),
  sender_user_id   uuid references auth.users (id) on delete set null,
  body             text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at       timestamptz not null default now()
);

create index messages_conversation_idx
  on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on public.conversations from public, anon, authenticated;
revoke all on public.messages from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Ouverture des conversations
 * ------------------------------------------------------------------ */

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

create or replace function public.chat_open_support(p_store_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_store public.stores%rowtype;
  v_conv  public.conversations%rowtype;
begin
  if v_uid is null or not public.is_store_member(p_store_id) then
    return null;
  end if;

  select s.* into v_store from public.stores s where s.id = p_store_id;
  if v_store.id is null then
    return null;
  end if;

  insert into public.conversations (store_id, kind)
  values (p_store_id, 'support')
  on conflict (store_id) where kind = 'support'
  do update set kind = excluded.kind
  returning * into v_conv;

  return jsonb_build_object(
    'id', v_conv.id,
    'kind', v_conv.kind,
    'storeId', v_conv.store_id,
    'storeName', v_store.name
  );
end;
$$;

revoke execute on function public.chat_open_support(uuid)
  from public, anon, authenticated;
grant execute on function public.chat_open_support(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Liste des conversations visibles
 * ------------------------------------------------------------------ */

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
            'customerName', c.customer_name,
            'customerEmail', c.customer_email,
            'lastMessage', (
              select m.body from public.messages m
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
          'customerName', c.customer_name,
          'customerEmail', c.customer_email,
          'lastMessage', (
            select m.body from public.messages m
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

/* ------------------------------------------------------------------ *
 *  Lecture d'une conversation
 * ------------------------------------------------------------------ */

create or replace function public.chat_messages(p_conversation_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_conv  public.conversations%rowtype;
  v_allow boolean := false;
begin
  if v_uid is null then
    return null;
  end if;

  select * into v_conv
  from public.conversations
  where id = p_conversation_id;

  if v_conv.id is null then
    return null;
  end if;

  if v_conv.kind = 'customer' then
    v_allow := v_conv.customer_user_id = v_uid
      or public.is_store_member(v_conv.store_id);
  else
    v_allow := public.is_store_member(v_conv.store_id)
      or public.is_platform_admin();
  end if;

  if not v_allow then
    return null;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'body', m.body,
          'senderRole', m.sender_role,
          'mine', m.sender_user_id = v_uid,
          'createdAt', m.created_at
        )
        order by m.created_at
      )
      from public.messages m
      where m.conversation_id = v_conv.id
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.chat_messages(uuid)
  from public, anon, authenticated;
grant execute on function public.chat_messages(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Envoi d'un message
 * ------------------------------------------------------------------ */

create or replace function public.chat_send_message(
  p_conversation_id uuid,
  p_body            text,
  p_role            text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_conv  public.conversations%rowtype;
  v_role  text := lower(btrim(coalesce(p_role, '')));
  v_body  text := btrim(coalesce(p_body, ''));
  v_msg   public.messages%rowtype;
begin
  if v_uid is null then
    return null;
  end if;

  if char_length(v_body) < 1 or char_length(v_body) > 4000 then
    raise exception 'message_invalid' using errcode = '22023';
  end if;

  select * into v_conv
  from public.conversations
  where id = p_conversation_id
  for update;

  if v_conv.id is null then
    raise exception 'conversation_unavailable' using errcode = '22023';
  end if;

  if v_role = 'customer' then
    if v_conv.kind <> 'customer' or v_conv.customer_user_id <> v_uid then
      raise exception 'conversation_unavailable' using errcode = '22023';
    end if;
  elsif v_role = 'merchant' then
    if not public.is_store_member(v_conv.store_id) then
      raise exception 'conversation_unavailable' using errcode = '22023';
    end if;
  elsif v_role = 'platform' then
    if v_conv.kind <> 'support' or not public.is_platform_admin() then
      raise exception 'conversation_unavailable' using errcode = '22023';
    end if;
  else
    raise exception 'conversation_unavailable' using errcode = '22023';
  end if;

  insert into public.messages (
    conversation_id, store_id, sender_role, sender_user_id, body
  )
  values (v_conv.id, v_conv.store_id, v_role, v_uid, v_body)
  returning * into v_msg;

  update public.conversations
  set last_message_at = v_msg.created_at
  where id = v_conv.id;

  return jsonb_build_object(
    'id', v_msg.id,
    'body', v_msg.body,
    'senderRole', v_msg.sender_role,
    'mine', true,
    'createdAt', v_msg.created_at
  );
end;
$$;

revoke execute on function public.chat_send_message(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.chat_send_message(uuid, text, text)
  to authenticated;
