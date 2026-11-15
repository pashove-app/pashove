-- Éditeur de thèmes Pashove — modèle « constructeur visuel ».
--
-- Le document du thème (JSON) est la source de vérité de l'éditeur. Les tables
-- `theme_templates`, `theme_sections` et `theme_blocks` en sont le miroir
-- normalisé, pour les API et les intégrations ; la vitrine ne lit que le
-- document publié, via une fonction `security definer`.
--
-- Les écritures passent exclusivement par des RPC qui vérifient
-- `is_store_member` : un `store_id` forgé par le client ne peut jamais viser
-- la boutique d'un autre compte.

/* ------------------------------------------------------------------ *
 *  Tables
 * ------------------------------------------------------------------ */

create table public.themes (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  name           text not null check (char_length(btrim(name)) between 1 and 80),
  status         text not null default 'draft'
                 check (status in ('draft', 'published')),
  is_active      boolean not null default false,
  draft_json     jsonb not null default '{}'::jsonb,
  published_json jsonb,
  settings_json  jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index themes_one_active_idx
  on public.themes (store_id) where is_active;
create index themes_store_idx
  on public.themes (store_id, updated_at desc);

create table public.theme_templates (
  id            uuid primary key default gen_random_uuid(),
  theme_id      uuid not null references public.themes (id) on delete cascade,
  key           text not null,
  type          text not null,
  name          text not null,
  settings_json jsonb not null default '{}'::jsonb,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (theme_id, key)
);

create index theme_templates_theme_idx
  on public.theme_templates (theme_id, sort_order);

create table public.theme_sections (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references public.theme_templates (id) on delete cascade,
  document_id   text not null,
  type          text not null,
  name          text not null default '',
  settings_json jsonb not null default '{}'::jsonb,
  sort_order    integer not null default 0,
  visible       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index theme_sections_template_idx
  on public.theme_sections (template_id, sort_order);

create table public.theme_blocks (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references public.theme_sections (id) on delete cascade,
  document_id   text not null,
  type          text not null,
  settings_json jsonb not null default '{}'::jsonb,
  sort_order    integer not null default 0,
  visible       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index theme_blocks_section_idx
  on public.theme_blocks (section_id, sort_order);

create table public.theme_settings (
  theme_id   uuid not null references public.themes (id) on delete cascade,
  key        text not null,
  value_json jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (theme_id, key)
);

create table public.theme_versions (
  id             uuid primary key default gen_random_uuid(),
  theme_id       uuid not null references public.themes (id) on delete cascade,
  version_number integer not null,
  snapshot       jsonb not null,
  created_at     timestamptz not null default now(),
  created_by     uuid references auth.users (id) on delete set null,
  unique (theme_id, version_number)
);

create index theme_versions_theme_idx
  on public.theme_versions (theme_id, version_number desc);

create table public.theme_assets (
  id           uuid primary key default gen_random_uuid(),
  theme_id     uuid not null references public.themes (id) on delete cascade,
  filename     text not null,
  content      text not null default '',
  content_type text not null default 'text/plain',
  size         integer not null default 0,
  created_at   timestamptz not null default now()
);

create index theme_assets_theme_idx on public.theme_assets (theme_id);

/* ------------------------------------------------------------------ *
 *  Sources dynamiques
 * ------------------------------------------------------------------ */

create table public.metafields (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores (id) on delete cascade,
  owner_type  text not null
              check (owner_type in ('product', 'collection', 'page', 'article', 'shop')),
  owner_id    text not null,
  namespace   text not null default 'custom'
              check (namespace ~ '^[a-z0-9_]{1,40}$'),
  key         text not null check (key ~ '^[a-z0-9_]{1,60}$'),
  value       jsonb not null default 'null'::jsonb,
  type        text not null default 'text'
              check (type in ('text', 'number', 'boolean', 'json', 'url', 'image')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (store_id, owner_type, owner_id, namespace, key)
);

create index metafields_owner_idx
  on public.metafields (store_id, owner_type, owner_id);

/* ------------------------------------------------------------------ *
 *  Applications
 * ------------------------------------------------------------------ */

create table public.app_embeds (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores (id) on delete cascade,
  app_id        text not null,
  name          text not null,
  enabled       boolean not null default false,
  settings_json jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (store_id, app_id)
);

create table public.app_blocks (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores (id) on delete cascade,
  app_id        text not null,
  name          text not null,
  block_type    text not null,
  settings_json jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index app_blocks_store_idx on public.app_blocks (store_id);

/* ------------------------------------------------------------------ *
 *  Affectation d'un modèle à une ressource
 * ------------------------------------------------------------------ */

create table public.theme_template_assignments (
  id            uuid primary key default gen_random_uuid(),
  theme_id      uuid not null references public.themes (id) on delete cascade,
  template_key  text not null,
  resource_type text not null
                check (resource_type in ('product', 'collection', 'page', 'article')),
  resource_id   text not null,
  created_at    timestamptz not null default now(),
  unique (theme_id, resource_type, resource_id)
);

create index theme_assignments_resource_idx
  on public.theme_template_assignments (theme_id, resource_type, resource_id);

/* ------------------------------------------------------------------ *
 *  Aperçus partageables
 * ------------------------------------------------------------------ */

create table public.theme_preview_links (
  token      text primary key,
  theme_id   uuid not null references public.themes (id) on delete cascade,
  store_id   uuid not null references public.stores (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index theme_preview_links_theme_idx on public.theme_preview_links (theme_id);

/* ------------------------------------------------------------------ *
 *  RLS — tout est fermé, puis rouvert aux membres de la boutique
 * ------------------------------------------------------------------ */

alter table public.themes enable row level security;
alter table public.theme_templates enable row level security;
alter table public.theme_sections enable row level security;
alter table public.theme_blocks enable row level security;
alter table public.theme_settings enable row level security;
alter table public.theme_versions enable row level security;
alter table public.theme_assets enable row level security;
alter table public.metafields enable row level security;
alter table public.app_embeds enable row level security;
alter table public.app_blocks enable row level security;
alter table public.theme_template_assignments enable row level security;
alter table public.theme_preview_links enable row level security;

create policy themes_member on public.themes
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy metafields_member on public.metafields
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy app_embeds_member on public.app_embeds
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy app_blocks_member on public.app_blocks
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy theme_templates_member on public.theme_templates
  for all to authenticated
  using (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ))
  with check (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ));

create policy theme_sections_member on public.theme_sections
  for all to authenticated
  using (exists (
    select 1
    from public.theme_templates tt
    join public.themes t on t.id = tt.theme_id
    where tt.id = template_id and public.is_store_member(t.store_id)
  ))
  with check (exists (
    select 1
    from public.theme_templates tt
    join public.themes t on t.id = tt.theme_id
    where tt.id = template_id and public.is_store_member(t.store_id)
  ));

create policy theme_blocks_member on public.theme_blocks
  for all to authenticated
  using (exists (
    select 1
    from public.theme_sections ts
    join public.theme_templates tt on tt.id = ts.template_id
    join public.themes t on t.id = tt.theme_id
    where ts.id = section_id and public.is_store_member(t.store_id)
  ))
  with check (exists (
    select 1
    from public.theme_sections ts
    join public.theme_templates tt on tt.id = ts.template_id
    join public.themes t on t.id = tt.theme_id
    where ts.id = section_id and public.is_store_member(t.store_id)
  ));

create policy theme_settings_member on public.theme_settings
  for all to authenticated
  using (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ))
  with check (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ));

create policy theme_versions_member on public.theme_versions
  for all to authenticated
  using (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ))
  with check (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ));

create policy theme_assets_member on public.theme_assets
  for all to authenticated
  using (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ))
  with check (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ));

create policy theme_assignments_member on public.theme_template_assignments
  for all to authenticated
  using (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ))
  with check (exists (
    select 1 from public.themes t
    where t.id = theme_id and public.is_store_member(t.store_id)
  ));

create policy theme_preview_member on public.theme_preview_links
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

revoke all on public.themes from public, anon, authenticated;
revoke all on public.theme_templates from public, anon, authenticated;
revoke all on public.theme_sections from public, anon, authenticated;
revoke all on public.theme_blocks from public, anon, authenticated;
revoke all on public.theme_settings from public, anon, authenticated;
revoke all on public.theme_versions from public, anon, authenticated;
revoke all on public.theme_assets from public, anon, authenticated;
revoke all on public.metafields from public, anon, authenticated;
revoke all on public.app_embeds from public, anon, authenticated;
revoke all on public.app_blocks from public, anon, authenticated;
revoke all on public.theme_template_assignments from public, anon, authenticated;
revoke all on public.theme_preview_links from public, anon, authenticated;

grant select, insert, update, delete on public.themes to authenticated;
grant select, insert, update, delete on public.theme_templates to authenticated;
grant select, insert, update, delete on public.theme_sections to authenticated;
grant select, insert, update, delete on public.theme_blocks to authenticated;
grant select, insert, update, delete on public.theme_settings to authenticated;
grant select, insert, update, delete on public.theme_versions to authenticated;
grant select, insert, update, delete on public.theme_assets to authenticated;
grant select, insert, update, delete on public.metafields to authenticated;
grant select, insert, update, delete on public.app_embeds to authenticated;
grant select, insert, update, delete on public.app_blocks to authenticated;
grant select, insert, update, delete on public.theme_template_assignments to authenticated;
grant select, insert, update, delete on public.theme_preview_links to authenticated;

/* ------------------------------------------------------------------ *
 *  Synchronisation du miroir normalisé
 * ------------------------------------------------------------------ */

create or replace function public.theme_sync_normalized(
  p_theme_id uuid,
  p_document jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template jsonb;
  v_section jsonb;
  v_block jsonb;
  v_template_index integer := 0;
  v_section_index integer;
  v_block_index integer;
  v_template_id uuid;
  v_section_id uuid;
begin
  delete from public.theme_sections
  where template_id in (
    select id from public.theme_templates where theme_id = p_theme_id
  );
  delete from public.theme_templates where theme_id = p_theme_id;
  delete from public.theme_settings where theme_id = p_theme_id;

  for v_template in
    select value from jsonb_array_elements(coalesce(p_document->'templates', '[]'::jsonb))
  loop
    insert into public.theme_templates (
      theme_id, key, type, name, settings_json, sort_order
    )
    values (
      p_theme_id,
      coalesce(v_template->>'id', 'template-' || v_template_index),
      coalesce(v_template->>'type', 'index'),
      coalesce(v_template->>'name', 'Modèle'),
      coalesce(v_template->'settings', '{}'::jsonb),
      v_template_index
    )
    returning id into v_template_id;

    v_section_index := 0;

    for v_section in
      select value from jsonb_array_elements(coalesce(v_template->'sections', '[]'::jsonb))
    loop
      insert into public.theme_sections (
        template_id, document_id, type, name, settings_json, sort_order, visible
      )
      values (
        v_template_id,
        coalesce(v_section->>'id', 'section-' || v_section_index),
        coalesce(v_section->>'type', 'rich-text'),
        coalesce(v_section->>'name', ''),
        coalesce(v_section->'settings', '{}'::jsonb),
        v_section_index,
        coalesce((v_section->>'visible')::boolean, true)
      )
      returning id into v_section_id;

      v_block_index := 0;

      for v_block in
        select value from jsonb_array_elements(coalesce(v_section->'blocks', '[]'::jsonb))
      loop
        insert into public.theme_blocks (
          section_id, document_id, type, settings_json, sort_order, visible
        )
        values (
          v_section_id,
          coalesce(v_block->>'id', 'block-' || v_block_index),
          coalesce(v_block->>'type', 'text'),
          coalesce(v_block->'settings', '{}'::jsonb),
          v_block_index,
          coalesce((v_block->>'visible')::boolean, true)
        );

        v_block_index := v_block_index + 1;
      end loop;

      v_section_index := v_section_index + 1;
    end loop;

    v_template_index := v_template_index + 1;
  end loop;

  insert into public.theme_settings (theme_id, key, value_json)
  select p_theme_id, entry.key, entry.value
  from jsonb_each(coalesce(p_document->'settings', '{}'::jsonb)) as entry;
end;
$$;

revoke execute on function public.theme_sync_normalized(uuid, jsonb)
  from public, anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Chargement de l'éditeur
 * ------------------------------------------------------------------ */

create or replace function public.theme_editor_load(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    return null;
  end if;

  return jsonb_build_object(
    'themes', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'status', t.status,
          'isActive', t.is_active,
          'draft', t.draft_json,
          'publishedAt', case
            when t.published_json is null then null
            else t.updated_at
          end,
          'updatedAt', t.updated_at
        )
        order by t.is_active desc, t.updated_at desc
      )
      from public.themes t
      where t.store_id = p_store_id
    ), '[]'::jsonb),
    'appEmbeds', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'appId', e.app_id,
          'name', e.name,
          'enabled', e.enabled,
          'settings', e.settings_json
        )
        order by e.created_at
      )
      from public.app_embeds e
      where e.store_id = p_store_id
    ), '[]'::jsonb),
    'appBlocks', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'appId', b.app_id,
          'name', b.name,
          'blockType', b.block_type,
          'settings', b.settings_json
        )
        order by b.created_at
      )
      from public.app_blocks b
      where b.store_id = p_store_id
    ), '[]'::jsonb),
    'assignments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'themeId', a.theme_id,
          'templateKey', a.template_key,
          'resourceType', a.resource_type,
          'resourceId', a.resource_id
        )
      )
      from public.theme_template_assignments a
      join public.themes t on t.id = a.theme_id
      where t.store_id = p_store_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.theme_editor_load(uuid)
  from public, anon, authenticated;
grant execute on function public.theme_editor_load(uuid) to authenticated;

/* ------------------------------------------------------------------ *
 *  Création / duplication / suppression
 * ------------------------------------------------------------------ */

create or replace function public.theme_create(
  p_store_id uuid,
  p_name     text,
  p_document jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer;
  v_name text := left(btrim(coalesce(p_name, 'Pashove Dawn')), 80);
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  select count(*) into v_count from public.themes where store_id = p_store_id;
  if v_count >= 20 then
    raise exception 'theme_limit' using errcode = '22023';
  end if;

  if p_document is null or jsonb_typeof(p_document) <> 'object' then
    raise exception 'theme_invalid_document' using errcode = '22023';
  end if;

  if v_name = '' then v_name := 'Pashove Dawn'; end if;

  insert into public.themes (store_id, name, draft_json, settings_json)
  values (p_store_id, v_name, p_document, coalesce(p_document->'settings', '{}'::jsonb))
  returning id into v_id;

  perform public.theme_sync_normalized(v_id, p_document);

  return jsonb_build_object(
    'id', v_id,
    'name', v_name,
    'status', 'draft',
    'isActive', false,
    'draft', p_document
  );
end;
$$;

revoke execute on function public.theme_create(uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.theme_create(uuid, text, jsonb) to authenticated;

create or replace function public.theme_duplicate(
  p_store_id uuid,
  p_theme_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_theme public.themes%rowtype;
  v_id uuid;
  v_name text;
  v_count integer;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  select * into v_theme
  from public.themes
  where id = p_theme_id and store_id = p_store_id;

  if v_theme.id is null then
    raise exception 'theme_not_found' using errcode = '22023';
  end if;

  select count(*) into v_count from public.themes where store_id = p_store_id;
  if v_count >= 20 then
    raise exception 'theme_limit' using errcode = '22023';
  end if;

  v_name := left(v_theme.name || ' (copie)', 80);

  insert into public.themes (store_id, name, status, is_active, draft_json, settings_json)
  values (p_store_id, v_name, 'draft', false, v_theme.draft_json, v_theme.settings_json)
  returning id into v_id;

  perform public.theme_sync_normalized(v_id, v_theme.draft_json);

  return jsonb_build_object(
    'id', v_id,
    'name', v_name,
    'status', 'draft',
    'isActive', false,
    'draft', v_theme.draft_json
  );
end;
$$;

revoke execute on function public.theme_duplicate(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.theme_duplicate(uuid, uuid) to authenticated;

create or replace function public.theme_delete(
  p_store_id uuid,
  p_theme_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  delete from public.themes
  where id = p_theme_id
    and store_id = p_store_id
    and is_active = false;

  return found;
end;
$$;

revoke execute on function public.theme_delete(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.theme_delete(uuid, uuid) to authenticated;

create or replace function public.theme_rename(
  p_store_id uuid,
  p_theme_id uuid,
  p_name     text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(btrim(coalesce(p_name, '')), 80);
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  if v_name = '' then
    raise exception 'theme_invalid_name' using errcode = '22023';
  end if;

  update public.themes
  set name = v_name, updated_at = now()
  where id = p_theme_id and store_id = p_store_id;

  if not found then
    raise exception 'theme_not_found' using errcode = '22023';
  end if;

  return jsonb_build_object('id', p_theme_id, 'name', v_name);
end;
$$;

revoke execute on function public.theme_rename(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.theme_rename(uuid, uuid, text) to authenticated;

/* ------------------------------------------------------------------ *
 *  Enregistrement du brouillon + versions
 * ------------------------------------------------------------------ */

create or replace function public.theme_save_draft(
  p_store_id      uuid,
  p_theme_id      uuid,
  p_document      jsonb,
  p_make_version  boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version integer;
  v_last jsonb;
  v_document jsonb := p_document;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  if v_document is null or jsonb_typeof(v_document) <> 'object' then
    raise exception 'theme_invalid_document' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(v_document->'templates', '[]'::jsonb)) <> 'array' then
    raise exception 'theme_invalid_templates' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(v_document->'settings', '{}'::jsonb)) <> 'object' then
    raise exception 'theme_invalid_settings' using errcode = '22023';
  end if;

  update public.themes
  set draft_json = v_document,
      settings_json = coalesce(v_document->'settings', '{}'::jsonb),
      updated_at = now()
  where id = p_theme_id and store_id = p_store_id;

  if not found then
    raise exception 'theme_not_found' using errcode = '22023';
  end if;

  perform public.theme_sync_normalized(p_theme_id, v_document);

  if p_make_version then
    select snapshot into v_last
    from public.theme_versions
    where theme_id = p_theme_id
    order by version_number desc
    limit 1;

    if v_last is distinct from v_document then
      select coalesce(max(version_number), 0) + 1 into v_version
      from public.theme_versions
      where theme_id = p_theme_id;

      insert into public.theme_versions (
        theme_id, version_number, snapshot, created_by
      )
      values (p_theme_id, v_version, v_document, (select auth.uid()));

      delete from public.theme_versions
      where id in (
        select id from public.theme_versions
        where theme_id = p_theme_id
        order by version_number desc
        offset 50
      );
    end if;
  end if;

  return v_document;
end;
$$;

revoke execute on function public.theme_save_draft(uuid, uuid, jsonb, boolean)
  from public, anon, authenticated;
grant execute on function public.theme_save_draft(uuid, uuid, jsonb, boolean)
  to authenticated;

create or replace function public.theme_publish(
  p_store_id uuid,
  p_theme_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_document jsonb;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  select draft_json into v_document
  from public.themes
  where id = p_theme_id and store_id = p_store_id;

  if v_document is null then
    raise exception 'theme_not_found' using errcode = '22023';
  end if;

  update public.themes
  set is_active = false
  where store_id = p_store_id and id <> p_theme_id;

  update public.themes
  set published_json = draft_json,
      status = 'published',
      is_active = true,
      updated_at = now()
  where id = p_theme_id and store_id = p_store_id;

  return jsonb_build_object(
    'id', p_theme_id,
    'status', 'published',
    'isActive', true,
    'published', v_document
  );
end;
$$;

revoke execute on function public.theme_publish(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.theme_publish(uuid, uuid) to authenticated;

create or replace function public.theme_restore_version(
  p_store_id  uuid,
  p_theme_id  uuid,
  p_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_snapshot jsonb;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  select v.snapshot into v_snapshot
  from public.theme_versions v
  join public.themes t on t.id = v.theme_id
  where v.id = p_version_id
    and v.theme_id = p_theme_id
    and t.store_id = p_store_id;

  if v_snapshot is null then
    raise exception 'theme_version_not_found' using errcode = '22023';
  end if;

  update public.themes
  set draft_json = v_snapshot,
      settings_json = coalesce(v_snapshot->'settings', '{}'::jsonb),
      updated_at = now()
  where id = p_theme_id and store_id = p_store_id;

  perform public.theme_sync_normalized(p_theme_id, v_snapshot);

  return v_snapshot;
end;
$$;

revoke execute on function public.theme_restore_version(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.theme_restore_version(uuid, uuid, uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Affectation de modèle
 * ------------------------------------------------------------------ */

create or replace function public.theme_assign_template(
  p_store_id      uuid,
  p_theme_id      uuid,
  p_template_key  text,
  p_resource_type text,
  p_resource_id   text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.themes
    where id = p_theme_id and store_id = p_store_id
  ) then
    raise exception 'theme_not_found' using errcode = '22023';
  end if;

  insert into public.theme_template_assignments (
    theme_id, template_key, resource_type, resource_id
  )
  values (p_theme_id, p_template_key, p_resource_type, p_resource_id)
  on conflict (theme_id, resource_type, resource_id) do update
  set template_key = excluded.template_key;

  return true;
end;
$$;

revoke execute on function public.theme_assign_template(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.theme_assign_template(uuid, uuid, text, text, text)
  to authenticated;

create or replace function public.theme_unassign_template(
  p_store_id uuid,
  p_theme_id uuid,
  p_resource_type text,
  p_resource_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  delete from public.theme_template_assignments
  where theme_id = p_theme_id
    and resource_type = p_resource_type
    and resource_id = p_resource_id
    and exists (
      select 1 from public.themes
      where id = p_theme_id and store_id = p_store_id
    );

  return true;
end;
$$;

revoke execute on function public.theme_unassign_template(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.theme_unassign_template(uuid, uuid, text, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Aperçus partageables
 * ------------------------------------------------------------------ */

create or replace function public.theme_create_preview(
  p_store_id uuid,
  p_theme_id uuid,
  p_token    text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.themes
    where id = p_theme_id and store_id = p_store_id
  ) then
    raise exception 'theme_not_found' using errcode = '22023';
  end if;

  insert into public.theme_preview_links (token, theme_id, store_id, expires_at)
  values (p_token, p_theme_id, p_store_id, now() + interval '7 days');

  return jsonb_build_object(
    'token', p_token,
    'expiresAt', now() + interval '7 days'
  );
end;
$$;

revoke execute on function public.theme_create_preview(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.theme_create_preview(uuid, uuid, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture publique
 * ------------------------------------------------------------------ */

create or replace function public.public_store_theme_document(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store public.stores%rowtype;
  v_theme public.themes%rowtype;
begin
  select s.* into v_store
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store.id is null then
    return null;
  end if;

  select t.* into v_theme
  from public.themes t
  where t.store_id = v_store.id
    and t.is_active = true
    and t.status = 'published'
    and t.published_json is not null
  limit 1;

  if v_theme.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'themeId', v_theme.id,
    'document', v_theme.published_json,
    'appEmbeds', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'appId', e.app_id,
          'name', e.name,
          'settings', e.settings_json
        )
        order by e.created_at
      )
      from public.app_embeds e
      where e.store_id = v_store.id and e.enabled = true
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.public_store_theme_document(text)
  from public, anon, authenticated;
grant execute on function public.public_store_theme_document(text)
  to anon, authenticated;

create or replace function public.public_theme_preview(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_link public.theme_preview_links%rowtype;
  v_theme public.themes%rowtype;
begin
  select * into v_link
  from public.theme_preview_links
  where token = p_token and expires_at > now();

  if v_link.token is null then
    return null;
  end if;

  select * into v_theme
  from public.themes
  where id = v_link.theme_id
    and store_id = v_link.store_id;

  if v_theme.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'themeId', v_theme.id,
    'document', v_theme.draft_json,
    'appEmbeds', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'appId', e.app_id,
          'name', e.name,
          'settings', e.settings_json
        )
        order by e.created_at
      )
      from public.app_embeds e
      where e.store_id = v_link.store_id and e.enabled = true
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.public_theme_preview(text)
  from public, anon, authenticated;
grant execute on function public.public_theme_preview(text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Affectations publiques (choix du modèle produit)
 * ------------------------------------------------------------------ */

create or replace function public.public_theme_assignment(
  p_slug text,
  p_resource_type text,
  p_resource_id text
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_key text;
begin
  select id into v_store_id
  from public.stores
  where slug = lower(btrim(p_slug)) and status = 'active';

  if v_store_id is null then return null; end if;

  select a.template_key into v_key
  from public.theme_template_assignments a
  join public.themes t on t.id = a.theme_id
  where t.store_id = v_store_id
    and t.is_active = true
    and a.resource_type = p_resource_type
    and a.resource_id = p_resource_id
  limit 1;

  return v_key;
end;
$$;

revoke execute on function public.public_theme_assignment(text, text, text)
  from public, anon, authenticated;
grant execute on function public.public_theme_assignment(text, text, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Méta-champs publics d'une ressource
 * ------------------------------------------------------------------ */

create or replace function public.public_metafields(
  p_slug       text,
  p_owner_type text,
  p_owner_id   text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
begin
  select id into v_store_id
  from public.stores
  where slug = lower(btrim(p_slug)) and status = 'active';

  if v_store_id is null then return '{}'::jsonb; end if;

  return coalesce((
    select jsonb_object_agg(
      m.namespace || '.' || m.key,
      m.value
    )
    from public.metafields m
    where m.store_id = v_store_id
      and m.owner_type = p_owner_type
      and m.owner_id = p_owner_id
  ), '{}'::jsonb);
end;
$$;

revoke execute on function public.public_metafields(text, text, text)
  from public, anon, authenticated;
grant execute on function public.public_metafields(text, text, text)
  to anon, authenticated;

notify pgrst, 'reload schema';
