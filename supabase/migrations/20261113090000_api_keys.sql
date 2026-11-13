-- PASHOVE — API publique v1 : clés marchand
--
-- La clé n'est jamais stockée en clair : seule son empreinte SHA-256 reste en
-- base. Elle est affichée une seule fois, à sa création. Les lectures passent
-- par la clé de service après vérification de l'empreinte, jamais par le
-- client navigateur.

create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 2 and 60),
  prefix       text not null check (char_length(prefix) between 8 and 24),
  key_hash     text not null unique check (char_length(key_hash) = 64),
  scopes       text[] not null default array['read']::text[]
    check (scopes <@ array['read', 'write']::text[]),
  created_by   uuid references auth.users (id) on delete set null,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index api_keys_store_idx
  on public.api_keys (store_id, created_at desc);

alter table public.api_keys enable row level security;
revoke all on public.api_keys from public, anon, authenticated;
grant select on public.api_keys to authenticated;

create policy api_keys_select on public.api_keys
  for select to authenticated
  using (public.is_store_member(store_id) or public.is_platform_admin());
