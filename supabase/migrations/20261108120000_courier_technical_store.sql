-- PASHOVE — Livreur : pays d'opération et boutique technique
--
-- Un compte livreur n'a pas besoin de passer par l'onboarding marchand. Pour
-- autant, le ledger et le dispatch reposent sur une boutique : le livreur reçoit
-- ses gains sur le ledger d'une boutique possédée, et le dispatch exige une
-- boutique active dans le pays de la course.
--
-- Le pays est donc demandé au dépôt du dossier. À la validation, si le livreur
-- n'a pas déjà une boutique active dans ce pays, une boutique technique est
-- créée. Elle n'est jamais montrée comme une boutique à configurer.

alter table public.couriers
  add column if not exists country text
    check (country ~ '^[A-Z]{2}$');

/* L'ancienne version à cinq arguments est remplacée : on ne garde pas deux
   surcharges qui rendraient l'appel PostgREST ambigu. */
drop function if exists public.submit_courier_application(
  text, text, text, text, text
);

create or replace function public.submit_courier_application(
  p_full_name  text,
  p_phone      text,
  p_email      text,
  p_id_key     text,
  p_selfie_key text,
  p_country    text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_country text := upper(btrim(coalesce(p_country, '')));
  v_row public.couriers%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_full_name, ''))) < 2
     or char_length(btrim(coalesce(p_phone, ''))) < 6
     or position('@' in coalesce(p_email, '')) < 2
     or coalesce(btrim(p_id_key), '') = ''
     or coalesce(btrim(p_selfie_key), '') = ''
     or v_country !~ '^[A-Z]{2}$' then
    raise exception 'courier_invalid' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.platform_markets m
    where m.country_code = v_country and m.is_enabled
  ) then
    raise exception 'market_unavailable' using errcode = '22023';
  end if;

  select * into v_row from public.couriers where user_id = v_user for update;

  if v_row.id is not null and v_row.status = 'approved' then
    return jsonb_build_object('status', 'approved', 'already', true);
  end if;

  insert into public.couriers (
    user_id, full_name, phone, email, country,
    id_document_key, selfie_key, status
  )
  values (
    v_user, btrim(p_full_name), btrim(p_phone), lower(btrim(p_email)), v_country,
    btrim(p_id_key), btrim(p_selfie_key), 'pending'
  )
  on conflict (user_id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        email = excluded.email,
        country = excluded.country,
        id_document_key = excluded.id_document_key,
        selfie_key = excluded.selfie_key,
        status = 'pending',
        rejection_reason = null,
        reviewed_by = null,
        reviewed_at = null,
        updated_at = now()
    where public.couriers.status <> 'approved';

  return jsonb_build_object('status', 'pending', 'country', v_country);
end;
$$;

revoke execute on function public.submit_courier_application(
  text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.submit_courier_application(
  text, text, text, text, text, text
) to authenticated;

/* ------------------------------------------------------------------ *
 *  Validation : boutique technique du livreur
 * ------------------------------------------------------------------ */

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
  v_courier public.couriers%rowtype;
  v_country text;
  v_currency text;
  v_store_id uuid;
  v_slug text;
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

  select * into v_courier from public.couriers where id = p_id for update;

  if v_courier.id is null then
    raise exception 'courier_not_found' using errcode = '22023';
  end if;

  update public.couriers
  set status = v_status,
      rejection_reason = case when v_status = 'rejected' then v_reason else null end,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_id;

  if v_status = 'approved' then
    -- Les dossiers déposés avant cette migration n'ont pas de pays : on prend
    -- celui du profil, et on refuse la validation s'il reste inconnu. Un
    -- livreur sans pays ne recevrait jamais aucune course.
    v_country := coalesce(
      v_courier.country,
      (
        select upper(p.country)
        from public.profiles p
        where p.id = v_courier.user_id
          and p.country ~ '^[A-Za-z]{2}$'
      )
    );

    if v_country is null then
      raise exception 'country_required' using errcode = '22023';
    end if;

    update public.couriers
    set country = v_country
    where id = p_id and country is null;

    select m.currency into v_currency
    from public.platform_markets m
    where m.country_code = v_country
      and m.is_enabled
    order by m.code
    limit 1;

    if v_currency is null then
      raise exception 'market_unavailable' using errcode = '22023';
    end if;

    -- Une boutique déjà active dans le pays d'opération fait l'affaire : elle
    -- porte le ledger du livreur. Sinon on en crée une, technique.
    select s.id into v_store_id
    from public.store_members sm
    join public.stores s on s.id = sm.store_id
    where sm.user_id = v_courier.user_id
      and sm.role = 'owner'
      and s.status = 'active'
      and s.country = v_country
    order by s.created_at
    limit 1;

    if v_store_id is null then
      v_slug := 'livreur-' || substr(
        replace(v_courier.user_id::text, '-', ''), 1, 20
      );

      insert into public.stores (name, slug, country, currency, status)
      values ('Espace livreur', v_slug, v_country, v_currency, 'active')
      on conflict (slug) do nothing
      returning id into v_store_id;

      -- Un conflit de slug ne doit jamais rattacher le livreur à la boutique
      -- d'un autre compte : on repart d'un identifiant aléatoire.
      if v_store_id is null then
        v_slug := 'liv-' || substr(
          replace(gen_random_uuid()::text, '-', ''), 1, 22
        );
        insert into public.stores (name, slug, country, currency, status)
        values ('Espace livreur', v_slug, v_country, v_currency, 'active')
        returning id into v_store_id;
      end if;

      insert into public.store_members (store_id, user_id, role)
      values (v_store_id, v_courier.user_id, 'owner')
      on conflict (store_id, user_id) do nothing;
    end if;
  end if;

  return jsonb_build_object('status', v_status, 'storeId', v_store_id);
end;
$$;

revoke execute on function public.review_courier(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_courier(uuid, text, text)
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Lecture du dossier
 * ------------------------------------------------------------------ */

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
    'country', v_row.country,
    'status', v_row.status,
    'isOnline', v_row.is_online,
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
          'country', c.country,
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
