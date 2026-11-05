-- TH2 : éditeur de blocs, pages, navigation, blog et contact.

alter table public.store_themes
  add column if not exists blocks jsonb not null default '[]'::jsonb;

create table if not exists public.store_custom_pages (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  slug       text not null check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$'),
  title      text not null check (char_length(btrim(title)) between 2 and 120),
  body       text not null default '' check (char_length(body) <= 20000),
  status     text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create table if not exists public.store_nav_items (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  label      text not null check (char_length(btrim(label)) between 1 and 40),
  href       text not null check (char_length(href) between 1 and 300),
  position   integer not null default 0 check (position >= 0),
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists store_nav_items_store_idx
  on public.store_nav_items (store_id, position);

create table if not exists public.store_blog_posts (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  slug         text not null check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$'),
  title        text not null check (char_length(btrim(title)) between 2 and 140),
  excerpt      text check (excerpt is null or char_length(excerpt) <= 300),
  body         text not null default '' check (char_length(body) <= 30000),
  cover_key    text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (store_id, slug)
);

create table if not exists public.store_contact_messages (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 2 and 120),
  email      text not null check (char_length(email) <= 254 and email like '%@%'),
  message    text not null check (char_length(message) between 5 and 2000),
  status     text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists store_contact_messages_store_idx
  on public.store_contact_messages (store_id, created_at desc);

alter table public.store_custom_pages enable row level security;
alter table public.store_nav_items enable row level security;
alter table public.store_blog_posts enable row level security;
alter table public.store_contact_messages enable row level security;

create policy store_custom_pages_read on public.store_custom_pages
  for select to anon, authenticated
  using (
    (status = 'published' and public.is_public_store(store_id))
    or public.is_store_member(store_id)
  );

create policy store_custom_pages_write on public.store_custom_pages
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy store_nav_items_read on public.store_nav_items
  for select to anon, authenticated
  using (public.is_public_store(store_id) or public.is_store_member(store_id));

create policy store_nav_items_write on public.store_nav_items
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy store_blog_posts_read on public.store_blog_posts
  for select to anon, authenticated
  using (
    (status = 'published' and public.is_public_store(store_id))
    or public.is_store_member(store_id)
  );

create policy store_blog_posts_write on public.store_blog_posts
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy store_contact_messages_read on public.store_contact_messages
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.store_custom_pages from public, anon, authenticated;
revoke all on public.store_nav_items from public, anon, authenticated;
revoke all on public.store_blog_posts from public, anon, authenticated;
revoke all on public.store_contact_messages from public, anon, authenticated;

grant select on public.store_custom_pages to anon, authenticated;
grant select on public.store_nav_items to anon, authenticated;
grant select on public.store_blog_posts to anon, authenticated;
grant select on public.store_contact_messages to authenticated;
grant insert, update, delete on public.store_custom_pages to authenticated;
grant insert, update, delete on public.store_nav_items to authenticated;
grant insert, update, delete on public.store_blog_posts to authenticated;

/* ------------------------------------------------------------------ *
 *  Blocs du thème
 * ------------------------------------------------------------------ */

create or replace function public.save_store_blocks(
  p_store_id uuid,
  p_blocks   jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry jsonb;
  v_type  text;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  if p_blocks is null or jsonb_typeof(p_blocks) <> 'array'
     or jsonb_array_length(p_blocks) > 20 then
    raise exception 'theme_invalid_blocks' using errcode = '22023';
  end if;

  for v_entry in select * from jsonb_array_elements(p_blocks)
  loop
    v_type := v_entry->>'type';
    if v_type not in ('text', 'image', 'video', 'newsletter', 'faq', 'testimonials') then
      raise exception 'theme_invalid_blocks' using errcode = '22023';
    end if;
    if char_length(coalesce(v_entry->>'body', '')) > 5000
       or char_length(coalesce(v_entry->>'imageUrl', '')) > 500
       or char_length(coalesce(v_entry->>'videoUrl', '')) > 500 then
      raise exception 'theme_invalid_blocks' using errcode = '22023';
    end if;
  end loop;

  update public.store_themes
  set blocks = p_blocks, updated_at = now()
  where store_id = p_store_id;

  return public.store_theme(p_store_id);
end;
$$;

revoke execute on function public.save_store_blocks(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_store_blocks(uuid, jsonb)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Contact public
 * ------------------------------------------------------------------ */

create or replace function public.store_contact_submit(
  p_slug    text,
  p_name    text,
  p_email   text,
  p_message text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
  v_name  text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_body  text := btrim(coalesce(p_message, ''));
begin
  select s.* into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store.id is null then
    return false;
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120
     or v_email = '' or v_email not like '%@%' or char_length(v_email) > 254
     or char_length(v_body) < 5 or char_length(v_body) > 2000 then
    raise exception 'contact_invalid' using errcode = '22023';
  end if;

  insert into public.store_contact_messages (store_id, name, email, message)
  values (v_store.id, v_name, v_email, v_body);

  return true;
end;
$$;

revoke execute on function public.store_contact_submit(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.store_contact_submit(text, text, text, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Les lectures de thème renvoient aussi les blocs
 * ------------------------------------------------------------------ */

create or replace function public.store_theme(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_theme public.store_themes%rowtype;
begin
  if not public.is_store_member(p_store_id) then
    return null;
  end if;

  select * into v_theme from public.store_themes where store_id = p_store_id;

  return jsonb_build_object(
    'preset', coalesce(v_theme.preset, 'pashove'),
    'accentColor', coalesce(v_theme.accent_color, '#2f5cff'),
    'backgroundColor', coalesce(v_theme.background_color, '#04060d'),
    'surfaceColor', coalesce(v_theme.surface_color, '#0b101b'),
    'foregroundColor', coalesce(v_theme.foreground_color, '#ffffff'),
    'font', coalesce(v_theme.font, 'sans'),
    'sections', coalesce(
      v_theme.sections,
      '[{"key":"products","enabled":true},{"key":"collections","enabled":true},{"key":"bundles","enabled":true}]'::jsonb
    ),
    'blocks', coalesce(v_theme.blocks, '[]'::jsonb),
    'updatedAt', v_theme.updated_at
  );
end;
$$;

create or replace function public.public_store_theme(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
  v_theme public.store_themes%rowtype;
begin
  select s.* into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store.id is null then
    return null;
  end if;

  select * into v_theme from public.store_themes where store_id = v_store.id;

  return jsonb_build_object(
    'preset', coalesce(v_theme.preset, 'pashove'),
    'accentColor', coalesce(v_theme.accent_color, '#2f5cff'),
    'backgroundColor', coalesce(v_theme.background_color, '#04060d'),
    'surfaceColor', coalesce(v_theme.surface_color, '#0b101b'),
    'foregroundColor', coalesce(v_theme.foreground_color, '#ffffff'),
    'font', coalesce(v_theme.font, 'sans'),
    'sections', coalesce(
      v_theme.sections,
      '[{"key":"products","enabled":true},{"key":"collections","enabled":true},{"key":"bundles","enabled":true}]'::jsonb
    ),
    'blocks', coalesce(v_theme.blocks, '[]'::jsonb),
    'updatedAt', v_theme.updated_at
  );
end;
$$;

-- Les politiques des contenus publics appellent `is_store_member` pour ouvrir
-- aussi la lecture au marchand. Le rôle anonyme doit donc pouvoir l'exécuter ;
-- la fonction ne renvoie que `false` sans session.
grant execute on function public.is_store_member(uuid) to anon, authenticated;
grant execute on function public.is_public_store(uuid) to anon, authenticated;
