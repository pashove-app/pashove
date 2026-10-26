-- Pièces jointes de la messagerie : texte facultatif, image/vidéo/PDF privé.

alter table public.messages alter column body drop not null;
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages
  add column if not exists attachment_key text,
  add column if not exists attachment_content_type text,
  add column if not exists attachment_name text;

alter table public.messages
  add constraint messages_content_check check (
    (body is not null and char_length(btrim(body)) between 1 and 4000)
    or attachment_key is not null
  );

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
          'createdAt', m.created_at,
          'attachment', case
            when m.attachment_key is null then null
            else jsonb_build_object(
              'objectKey', m.attachment_key,
              'contentType', m.attachment_content_type,
              'fileName', m.attachment_name
            )
          end
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

create or replace function public.chat_attachment_store(
  p_conversation_id uuid,
  p_role            text
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_conv public.conversations%rowtype;
  v_role text := lower(btrim(coalesce(p_role, '')));
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

  if v_role = 'customer' then
    if v_conv.kind = 'customer' and v_conv.customer_user_id = v_uid then
      return v_conv.store_id;
    end if;
  elsif v_role = 'merchant' then
    if public.is_store_member(v_conv.store_id) then
      return v_conv.store_id;
    end if;
  elsif v_role = 'platform' then
    if v_conv.kind = 'support' and public.is_platform_admin() then
      return v_conv.store_id;
    end if;
  end if;

  return null;
end;
$$;

revoke execute on function public.chat_attachment_store(uuid, text)
  from public, anon, authenticated;
grant execute on function public.chat_attachment_store(uuid, text)
  to authenticated;

drop function if exists public.chat_send_message(uuid, text, text);

create or replace function public.chat_send_message(
  p_conversation_id uuid,
  p_body            text,
  p_role            text,
  p_attachment      jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_conv     public.conversations%rowtype;
  v_role     text := lower(btrim(coalesce(p_role, '')));
  v_body     text := btrim(coalesce(p_body, ''));
  v_key      text := nullif(btrim(coalesce(p_attachment->>'objectKey', '')), '');
  v_type     text := nullif(btrim(coalesce(p_attachment->>'contentType', '')), '');
  v_name     text := nullif(btrim(coalesce(p_attachment->>'fileName', '')), '');
  v_msg      public.messages%rowtype;
begin
  if v_uid is null then
    return null;
  end if;

  if char_length(v_body) > 4000 then
    raise exception 'message_invalid' using errcode = '22023';
  end if;

  if v_body = '' and v_key is null then
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

  if v_key is not null then
    if v_key not like ('stores/' || v_conv.store_id::text || '/chat_attachment/%')
       or char_length(v_key) > 300 then
      raise exception 'attachment_invalid' using errcode = '22023';
    end if;

    if v_type not in (
      'image/jpeg', 'image/png', 'image/webp', 'image/avif',
      'video/mp4', 'video/webm', 'application/pdf'
    ) then
      raise exception 'attachment_invalid' using errcode = '22023';
    end if;

    v_name := left(coalesce(v_name, 'piece-jointe'), 255);
  else
    v_type := null;
    v_name := null;
  end if;

  insert into public.messages (
    conversation_id, store_id, sender_role, sender_user_id, body,
    attachment_key, attachment_content_type, attachment_name
  )
  values (
    v_conv.id, v_conv.store_id, v_role, v_uid, nullif(v_body, ''),
    v_key, v_type, v_name
  )
  returning * into v_msg;

  update public.conversations
  set last_message_at = v_msg.created_at
  where id = v_conv.id;

  return jsonb_build_object(
    'id', v_msg.id,
    'body', v_msg.body,
    'senderRole', v_msg.sender_role,
    'mine', true,
    'createdAt', v_msg.created_at,
    'attachment', case
      when v_msg.attachment_key is null then null
      else jsonb_build_object(
        'objectKey', v_msg.attachment_key,
        'contentType', v_msg.attachment_content_type,
        'fileName', v_msg.attachment_name
      )
    end
  );
end;
$$;

revoke execute on function public.chat_send_message(uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.chat_send_message(uuid, text, text, jsonb)
  to authenticated;
