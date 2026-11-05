-- Preset Dwell : ivoire, terre cuite, typographie serif.

alter table public.store_themes
  drop constraint if exists store_themes_preset_check;

alter table public.store_themes
  add constraint store_themes_preset_check
  check (preset in ('pashove', 'ivoire', 'foret', 'minuit', 'dwell'));

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

  if v_preset not in ('pashove', 'ivoire', 'foret', 'minuit', 'dwell') then
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
