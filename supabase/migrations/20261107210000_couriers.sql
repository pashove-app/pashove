-- PASHOVE — L1 : comptes livreurs et vérification KYC
--
-- Un livreur est un utilisateur Pashove (il possède déjà une boutique, comme
-- tout compte). Son dossier est vérifié par la plateforme avant activation.
-- Les pièces sont stockées dans le bucket privé R2 ; seules des URL signées
-- sont générées côté admin.

create table if not exists public.couriers (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users (id) on delete cascade,
  full_name        text not null check (char_length(full_name) between 2 and 120),
  phone            text not null check (char_length(phone) between 6 and 40),
  email            text not null check (position('@' in email) > 1),
  id_document_key  text not null,
  selfie_key       text not null,
  status           text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by      uuid references auth.users (id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists couriers_status_idx
  on public.couriers (status, created_at desc);

alter table public.couriers enable row level security;

create policy couriers_select_own on public.couriers
  for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

revoke all on public.couriers from public, anon, authenticated;
grant select on public.couriers to authenticated;

/* Le type de titulaire distingue un retrait marchand d'un retrait livreur.
   Les colonnes sont posées dès maintenant ; le flux livreur arrive en L2. */
alter table public.payouts
  add column if not exists owner_type text not null default 'store'
    check (owner_type in ('store', 'courier'));

alter table public.payout_methods
  add column if not exists owner_type text not null default 'store'
    check (owner_type in ('store', 'courier'));

/* ------------------------------------------------------------------ *
 *  Dépôt du dossier
 * ------------------------------------------------------------------ */

create or replace function public.submit_courier_application(
  p_full_name text,
  p_phone     text,
  p_email     text,
  p_id_key    text,
  p_selfie_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row public.couriers%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_full_name, ''))) < 2
     or char_length(btrim(coalesce(p_phone, ''))) < 6
     or position('@' in coalesce(p_email, '')) < 2
     or coalesce(btrim(p_id_key), '') = ''
     or coalesce(btrim(p_selfie_key), '') = '' then
    raise exception 'courier_invalid' using errcode = '22023';
  end if;

  select * into v_row from public.couriers where user_id = v_user for update;

  if v_row.id is not null and v_row.status = 'approved' then
    return jsonb_build_object('status', 'approved', 'already', true);
  end if;

  insert into public.couriers (
    user_id, full_name, phone, email, id_document_key, selfie_key, status
  )
  values (
    v_user, btrim(p_full_name), btrim(p_phone), lower(btrim(p_email)),
    btrim(p_id_key), btrim(p_selfie_key), 'pending'
  )
  on conflict (user_id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        email = excluded.email,
        id_document_key = excluded.id_document_key,
        selfie_key = excluded.selfie_key,
        status = 'pending',
        rejection_reason = null,
        reviewed_by = null,
        reviewed_at = null,
        updated_at = now()
    where public.couriers.status <> 'approved';

  return jsonb_build_object('status', 'pending');
end;
$$;

revoke execute on function public.submit_courier_application(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_courier_application(text, text, text, text, text)
  to authenticated;

create or replace function public.my_courier_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row public.couriers%rowtype;
begin
  if v_user is null then
    return null;
  end if;

  select * into v_row from public.couriers where user_id = v_user;

  if v_row.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'fullName', v_row.full_name,
    'phone', v_row.phone,
    'email', v_row.email,
    'status', v_row.status,
    'rejectionReason', v_row.rejection_reason,
    'createdAt', v_row.created_at,
    'reviewedAt', v_row.reviewed_at
  );
end;
$$;

revoke execute on function public.my_courier_profile()
  from public, anon, authenticated;
grant execute on function public.my_courier_profile()
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Administration
 * ------------------------------------------------------------------ */

create or replace function public.admin_couriers()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'userId', c.user_id,
          'fullName', c.full_name,
          'phone', c.phone,
          'email', c.email,
          'status', c.status,
          'rejectionReason', c.rejection_reason,
          'idDocumentKey', c.id_document_key,
          'selfieKey', c.selfie_key,
          'createdAt', c.created_at,
          'reviewedAt', c.reviewed_at
        )
        order by c.created_at desc
      )
      from public.couriers c
    ),
    '[]'::jsonb
  );
end;
$$;

revoke execute on function public.admin_couriers()
  from public, anon, authenticated;
grant execute on function public.admin_couriers()
  to authenticated;

create or replace function public.review_courier(
  p_id     uuid,
  p_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_status not in ('approved', 'rejected') then
    raise exception 'status_invalid' using errcode = '22023';
  end if;

  if v_status = 'rejected' and v_reason is null then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  update public.couriers
  set status = v_status,
      rejection_reason = case when v_status = 'rejected' then v_reason else null end,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_id;

  return jsonb_build_object('status', v_status);
end;
$$;

revoke execute on function public.review_courier(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_courier(uuid, text, text)
  to authenticated;
