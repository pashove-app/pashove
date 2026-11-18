-- Newsletter publique et témoignages réels.
--
-- Le formulaire public n'écrit jamais directement dans les tables : il passe
-- par `newsletter_subscribe`, qui valide l'adresse et normalise la casse.
-- Les témoignages sont lus publiquement seulement s'ils sont publiés.

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  locale     text not null default 'fr' check (locale in ('fr', 'en')),
  source     text not null default 'site' check (char_length(source) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_email_format
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create unique index newsletter_subscribers_email_idx
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

revoke all on public.newsletter_subscribers from public, anon, authenticated;

create or replace function public.newsletter_subscribe(
  p_email  text,
  p_locale text default 'fr',
  p_source text default 'site'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if char_length(v_email) > 254
     or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'newsletter_invalid_email' using errcode = '22023';
  end if;

  insert into public.newsletter_subscribers (email, locale, source)
  values (
    v_email,
    case when p_locale = 'en' then 'en' else 'fr' end,
    left(coalesce(nullif(btrim(p_source), ''), 'site'), 40)
  )
  on conflict ((lower(email))) do update
    set locale = excluded.locale,
        source = excluded.source,
        updated_at = now();

  return true;
end;
$$;

revoke execute on function public.newsletter_subscribe(text, text, text)
  from public, anon, authenticated;
grant execute on function public.newsletter_subscribe(text, text, text)
  to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Témoignages
 * ------------------------------------------------------------------ */

create table public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 2 and 80),
  role       text check (role is null or char_length(role) <= 80),
  quote      text not null check (char_length(btrim(quote)) between 10 and 800),
  rating     integer not null default 5 check (rating between 1 and 5),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 1000),
  published  boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index testimonials_public_idx
  on public.testimonials (published, sort_order, created_at desc);

alter table public.testimonials enable row level security;

create policy testimonials_public_read on public.testimonials
  for select to anon, authenticated
  using (published = true);

create policy testimonials_admin_all on public.testimonials
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

revoke all on public.testimonials from public, anon, authenticated;
grant select on public.testimonials to anon, authenticated;
grant insert, update, delete on public.testimonials to authenticated;

notify pgrst, 'reload schema';
