-- Thèmes de vitrine : réglages déclaratifs par boutique.
--
-- Aucun code arbitraire : un preset, des couleurs, une police et l'ordre des
-- sections. Le storefront lit ces valeurs via une RPC publique ; le marchand
-- écrit via `save_store_theme`, réservé aux membres de la boutique.

create table public.store_themes (
  store_id          uuid primary key references public.stores (id) on delete cascade,
  preset            text not null default 'pashove'
    check (preset in ('pashove', 'ivoire', 'foret', 'minuit')),
  accent_color      text not null default '#2f5cff'
    check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  background_color  text not null default '#04060d'
    check (background_color ~ '^#[0-9a-fA-F]{6}$'),
  surface_color     text not null default '#0b101b'
    check (surface_color ~ '^#[0-9a-fA-F]{6}$'),
  foreground_color  text not null default '#ffffff'
    check (foreground_color ~ '^#[0-9a-fA-F]{6}$'),
  font              text not null default 'sans'
    check (font in ('sans', 'serif', 'mono')),
  sections          jsonb not null default
    '[{"key":"products","enabled":true},{"key":"collections","enabled":true},{"key":"bundles","enabled":true}]'::jsonb,
  updated_at        timestamptz not null default now()
);

alter table public.store_themes enable row level security;

create policy store_themes_select on public.store_themes
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.store_themes from public, anon, authenticated;
grant select on public.store_themes to authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture marchande
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
    'updatedAt', v_theme.updated_at
  );
end;
$$;

revoke execute on function public.store_theme(uuid)
  from public, anon, authenticated;
grant execute on function public.store_theme(uuid)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture publique par slug
 * ------------------------------------------------------------------ */

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
    'updatedAt', v_theme.updated_at
  );
end;
$$;

revoke execute on function public.public_store_theme(text)
  from public, anon, authenticated;
grant execute on function public.public_store_theme(text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Écriture marchande
 * ------------------------------------------------------------------ */

create or replace function public.save_store_theme(
  p_store_id         uuid,
  p_preset           text,
  p_accent_color     text,
  p_background_color text,
  p_surface_color    text,
  p_foreground_color text,
  p_font             text,
  p_sections         jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preset text := lower(btrim(coalesce(p_preset, 'pashove')));
  v_font   text := lower(btrim(coalesce(p_font, 'sans')));
  v_sections jsonb;
  v_keys   text[];
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'theme_unavailable' using errcode = '22023';
  end if;

  if v_preset not in ('pashove', 'ivoire', 'foret', 'minuit') then
    v_preset := 'pashove';
  end if;

  if v_font not in ('sans', 'serif', 'mono') then
    v_font := 'sans';
  end if;

  if p_accent_color !~ '^#[0-9a-fA-F]{6}$'
     or p_background_color !~ '^#[0-9a-fA-F]{6}$'
     or p_surface_color !~ '^#[0-9a-fA-F]{6}$'
     or p_foreground_color !~ '^#[0-9a-fA-F]{6}$' then
    raise exception 'theme_invalid_color' using errcode = '22023';
  end if;

  if p_sections is null or jsonb_typeof(p_sections) <> 'array' then
    raise exception 'theme_invalid_sections' using errcode = '22023';
  end if;

  if jsonb_array_length(p_sections) > 6 then
    raise exception 'theme_invalid_sections' using errcode = '22023';
  end if;

  select array_agg(distinct entry->>'key')
  into v_keys
  from jsonb_array_elements(p_sections) as entry;

  if v_keys is not null and (
    'products' <> all (v_keys) and 'collections' <> all (v_keys)
    and 'bundles' <> all (v_keys)
  ) then
    raise exception 'theme_invalid_sections' using errcode = '22023';
  end if;

  v_sections := (
    select jsonb_agg(
      jsonb_build_object(
        'key', entry->>'key',
        'enabled', coalesce((entry->>'enabled')::boolean, true)
      )
    )
    from jsonb_array_elements(p_sections) as entry
    where entry->>'key' in ('products', 'collections', 'bundles')
  );

  if v_sections is null then
    v_sections := '[]'::jsonb;
  end if;

  insert into public.store_themes (
    store_id, preset, accent_color, background_color, surface_color,
    foreground_color, font, sections
  )
  values (
    p_store_id, v_preset, upper(p_accent_color),
    upper(p_background_color), upper(p_surface_color),
    upper(p_foreground_color), v_font, v_sections
  )
  on conflict (store_id) do update set
    preset = excluded.preset,
    accent_color = excluded.accent_color,
    background_color = excluded.background_color,
    surface_color = excluded.surface_color,
    foreground_color = excluded.foreground_color,
    font = excluded.font,
    sections = excluded.sections,
    updated_at = now();

  return public.store_theme(p_store_id);
end;
$$;

revoke execute on function public.save_store_theme(
  uuid, text, text, text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.save_store_theme(
  uuid, text, text, text, text, text, text, jsonb
) to authenticated;
