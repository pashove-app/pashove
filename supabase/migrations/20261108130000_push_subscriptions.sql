-- PASHOVE — Notifications push du livreur
--
-- Un abonnement push appartient à un navigateur (endpoint) et à un compte.
-- Le même navigateur peut changer de compte : l'upsert transfère alors
-- l'abonnement au nouvel utilisateur, sans laisser fuiter les courses de
-- l'ancien.
--
-- Aucun secret d'envoi n'est stocké ici : les clés VAPID vivent dans les
-- variables d'environnement du serveur.

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own on public.push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.push_subscriptions from public, anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;

/* Le futur envoyeur (cron serveur) lit les abonnements avec la clé service. */
grant select, delete on public.push_subscriptions to service_role;

create or replace function public.save_push_subscription(
  p_endpoint   text,
  p_p256dh     text,
  p_auth       text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_endpoint text := btrim(coalesce(p_endpoint, ''));
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if position('https://' in v_endpoint) <> 1
     or char_length(v_endpoint) > 1200
     or char_length(btrim(coalesce(p_p256dh, ''))) < 20
     or char_length(btrim(coalesce(p_auth, ''))) < 8 then
    raise exception 'subscription_invalid' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (
    user_id, endpoint, p256dh, auth, user_agent
  )
  values (
    v_user, v_endpoint, btrim(p_p256dh), btrim(p_auth),
    left(nullif(btrim(coalesce(p_user_agent, '')), ''), 300)
  )
  on conflict (endpoint) do update
    set user_id = v_user,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.save_push_subscription(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.save_push_subscription(text, text, text, text)
  to authenticated;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  delete from public.push_subscriptions
  where endpoint = btrim(coalesce(p_endpoint, ''))
    and user_id = v_user;
end;
$$;

revoke execute on function public.delete_push_subscription(text)
  from public, anon, authenticated;
grant execute on function public.delete_push_subscription(text)
  to authenticated;
