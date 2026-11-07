-- PASHOVE — Réglages du checkout par boutique
--
-- Le marchand personnalise son identité (modèle, ordre des blocs, textes,
-- cadeau, remise) mais jamais les pays ni les moyens de paiement : ceux-ci
-- viennent de la plateforme et de SasPay.

create table if not exists public.store_checkout_settings (
  store_id      uuid primary key references public.stores (id) on delete cascade,
  preset        text not null default 'compact'
    check (preset in ('compact', 'detailed')),
  blocks        jsonb not null default
    '["contact","delivery","gift","summary","payment"]'::jsonb,
  texts         jsonb not null default '{}'::jsonb,
  show_gift     boolean not null default true,
  show_discount boolean not null default true,
  updated_at    timestamptz not null default now()
);

alter table public.store_checkout_settings enable row level security;

create policy store_checkout_settings_select on public.store_checkout_settings
  for select to authenticated
  using (public.is_store_member(store_id));

revoke all on public.store_checkout_settings from public, anon, authenticated;
grant select on public.store_checkout_settings to authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture marchande et publique
 * ------------------------------------------------------------------ */

create or replace function public.checkout_settings(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row public.store_checkout_settings%rowtype;
begin
  if not public.is_store_member(p_store_id) then
    return null;
  end if;

  select * into v_row
  from public.store_checkout_settings
  where store_id = p_store_id;

  return jsonb_build_object(
    'preset', coalesce(v_row.preset, 'compact'),
    'blocks', coalesce(
      v_row.blocks,
      '["contact","delivery","gift","summary","payment"]'::jsonb
    ),
    'texts', coalesce(v_row.texts, '{}'::jsonb),
    'showGift', coalesce(v_row.show_gift, true),
    'showDiscount', coalesce(v_row.show_discount, true),
    'updatedAt', v_row.updated_at
  );
end;
$$;

revoke execute on function public.checkout_settings(uuid)
  from public, anon, authenticated;
grant execute on function public.checkout_settings(uuid)
  to authenticated;

create or replace function public.public_checkout_settings(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_row public.store_checkout_settings%rowtype;
begin
  select s.id into v_store_id
  from public.stores s
  where s.slug = lower(btrim(p_slug))
    and s.status = 'active';

  if v_store_id is null then
    return null;
  end if;

  select * into v_row
  from public.store_checkout_settings
  where store_id = v_store_id;

  return jsonb_build_object(
    'preset', coalesce(v_row.preset, 'compact'),
    'blocks', coalesce(
      v_row.blocks,
      '["contact","delivery","gift","summary","payment"]'::jsonb
    ),
    'texts', coalesce(v_row.texts, '{}'::jsonb),
    'showGift', coalesce(v_row.show_gift, true),
    'showDiscount', coalesce(v_row.show_discount, true)
  );
end;
$$;

revoke execute on function public.public_checkout_settings(text)
  from public, anon, authenticated;
grant execute on function public.public_checkout_settings(text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Écriture marchande
 * ------------------------------------------------------------------ */

create or replace function public.save_checkout_settings(
  p_store_id      uuid,
  p_preset        text,
  p_blocks        jsonb,
  p_texts         jsonb,
  p_show_gift     boolean,
  p_show_discount boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preset text := lower(btrim(coalesce(p_preset, 'compact')));
  v_blocks jsonb;
  v_texts  jsonb;
  v_allowed text[] := array['contact','delivery','gift','summary','payment'];
  v_entry  jsonb;
  v_seen   text[] := array[]::text[];
  v_key    text;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if v_preset not in ('compact', 'detailed') then
    raise exception 'preset_invalid' using errcode = '22023';
  end if;

  if p_blocks is null or jsonb_typeof(p_blocks) <> 'array'
     or jsonb_array_length(p_blocks) > 5 then
    raise exception 'blocks_invalid' using errcode = '22023';
  end if;

  for v_entry in select * from jsonb_array_elements(p_blocks) loop
    v_key := v_entry #>> '{}';
    if v_key is null or not (v_key = any (v_allowed)) or v_key = any (v_seen) then
      raise exception 'blocks_invalid' using errcode = '22023';
    end if;
    v_seen := v_seen || v_key;
  end loop;

  -- « payment » ne peut pas être retiré : sans lui, pas de commande.
  if not ('payment' = any (v_seen)) then
    v_seen := v_seen || 'payment';
  end if;

  if p_texts is null or jsonb_typeof(p_texts) <> 'object'
     or length(p_texts::text) > 8000 then
    raise exception 'texts_invalid' using errcode = '22023';
  end if;

  select jsonb_agg(to_jsonb(entry)) into v_blocks
  from unnest(v_seen) as t(entry);

  v_texts := p_texts;

  insert into public.store_checkout_settings (
    store_id, preset, blocks, texts, show_gift, show_discount, updated_at
  )
  values (
    p_store_id, v_preset, v_blocks, v_texts,
    coalesce(p_show_gift, true), coalesce(p_show_discount, true), now()
  )
  on conflict (store_id) do update
    set preset = excluded.preset,
        blocks = excluded.blocks,
        texts = excluded.texts,
        show_gift = excluded.show_gift,
        show_discount = excluded.show_discount,
        updated_at = now();

  return jsonb_build_object(
    'preset', v_preset,
    'blocks', v_blocks,
    'texts', v_texts,
    'showGift', coalesce(p_show_gift, true),
    'showDiscount', coalesce(p_show_discount, true)
  );
end;
$$;

revoke execute on function public.save_checkout_settings(uuid, text, jsonb, jsonb, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.save_checkout_settings(uuid, text, jsonb, jsonb, boolean, boolean)
  to authenticated;
