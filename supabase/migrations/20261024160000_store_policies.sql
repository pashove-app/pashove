-- Pages légales et politiques de la boutique.
--
-- L'identité légale est saisie une fois ; les cinq documents sont des textes
-- libres, publiés un par un. Une page ne peut être publiée que si l'identité
-- requise est complète et si son contenu n'est pas vide.

create table public.store_legal_identity (
  store_id           uuid primary key references public.stores (id) on delete cascade,
  legal_name         text,
  legal_form         text,
  address            text,
  city               text,
  country            text,
  email              text,
  phone              text,
  registration_number text,
  tax_number         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger store_legal_identity_touch_updated_at
  before update on public.store_legal_identity
  for each row execute function public.touch_updated_at();

create table public.store_pages (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  slug         text not null check (slug in (
    'mentions', 'terms', 'privacy', 'shipping', 'returns'
  )),
  body         text not null default '' check (char_length(body) <= 20000),
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (store_id, slug)
);

create trigger store_pages_touch_updated_at
  before update on public.store_pages
  for each row execute function public.touch_updated_at();

create index store_pages_store_idx on public.store_pages (store_id);

create or replace function public.save_store_policies(
  p_store_id uuid,
  p_identity jsonb,
  p_pages    jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_published boolean;
  v_page      jsonb;
  v_slug      text;
  v_body      text;
begin
  if not public.has_store_role(
    p_store_id, array['owner', 'admin']::public.store_role[]
  ) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  if p_identity is null or jsonb_typeof(p_identity) <> 'object' then
    raise exception 'invalid_identity' using errcode = '22023';
  end if;

  if p_pages is null or jsonb_typeof(p_pages) <> 'array' then
    raise exception 'invalid_pages' using errcode = '22023';
  end if;

  select exists (
    select 1
    from jsonb_array_elements(p_pages) e
    where coalesce((e->>'is_published')::boolean, false)
  ) into v_published;

  if v_published then
    if coalesce(btrim(p_identity->>'legal_name'), '') = ''
       or coalesce(btrim(p_identity->>'address'), '') = ''
       or coalesce(btrim(p_identity->>'city'), '') = ''
       or coalesce(btrim(p_identity->>'country'), '') = ''
       or coalesce(btrim(p_identity->>'email'), '') = ''
       or coalesce(btrim(p_identity->>'phone'), '') = ''
       or coalesce(btrim(p_identity->>'registration_number'), '') = '' then
      raise exception 'identity_incomplete' using errcode = '22023';
    end if;
  end if;

  for v_page in select * from jsonb_array_elements(p_pages)
  loop
    v_slug := v_page->>'slug';
    v_body := coalesce(v_page->>'body', '');

    if v_slug not in ('mentions', 'terms', 'privacy', 'shipping', 'returns') then
      raise exception 'invalid_page' using errcode = '22023';
    end if;

    if coalesce((v_page->>'is_published')::boolean, false)
       and btrim(v_body) = '' then
      raise exception 'page_body_required' using errcode = '22023';
    end if;
  end loop;

  insert into public.store_legal_identity (
    store_id, legal_name, legal_form, address, city, country,
    email, phone, registration_number, tax_number
  )
  values (
    p_store_id,
    nullif(btrim(p_identity->>'legal_name'), ''),
    nullif(btrim(p_identity->>'legal_form'), ''),
    nullif(btrim(p_identity->>'address'), ''),
    nullif(btrim(p_identity->>'city'), ''),
    nullif(btrim(p_identity->>'country'), ''),
    nullif(btrim(p_identity->>'email'), ''),
    nullif(btrim(p_identity->>'phone'), ''),
    nullif(btrim(p_identity->>'registration_number'), ''),
    nullif(btrim(p_identity->>'tax_number'), '')
  )
  on conflict (store_id) do update
  set legal_name = excluded.legal_name,
      legal_form = excluded.legal_form,
      address = excluded.address,
      city = excluded.city,
      country = excluded.country,
      email = excluded.email,
      phone = excluded.phone,
      registration_number = excluded.registration_number,
      tax_number = excluded.tax_number,
      updated_at = now();

  for v_page in select * from jsonb_array_elements(p_pages)
  loop
    v_slug := v_page->>'slug';

    insert into public.store_pages (store_id, slug, body, is_published)
    values (
      p_store_id,
      v_slug,
      coalesce(v_page->>'body', ''),
      coalesce((v_page->>'is_published')::boolean, false)
    )
    on conflict (store_id, slug) do update
    set body = excluded.body,
        is_published = excluded.is_published,
        updated_at = now();
  end loop;
end;
$$;

revoke execute on function public.save_store_policies(uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_store_policies(uuid, jsonb, jsonb)
  to authenticated;

alter table public.store_legal_identity enable row level security;
alter table public.store_pages enable row level security;

create policy store_legal_identity_select_member on public.store_legal_identity
  for select to authenticated
  using (public.is_store_member(store_id));

create policy store_pages_select_member on public.store_pages
  for select to authenticated
  using (public.is_store_member(store_id));

create policy store_pages_select_public on public.store_pages
  for select to anon, authenticated
  using (is_published and public.is_public_store(store_id));

revoke all on public.store_legal_identity from public, anon, authenticated;
revoke all on public.store_pages from public, anon, authenticated;
grant select on public.store_legal_identity to authenticated;
grant select on public.store_pages to authenticated, anon;
