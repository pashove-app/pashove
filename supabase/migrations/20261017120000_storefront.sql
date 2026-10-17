-- Vitrine publique.
--
-- `stores` ne contient que des données publiques par nature : c'est ce qui
-- permet d'ouvrir la lecture aux visiteurs sans exposer autre chose. Tout ce
-- qui est privé (retraits, facturation, vérification) vivra dans d'autres
-- tables, jamais ici.

alter table public.stores
  add column description   text,
  add column logo_url      text,
  add column banner_url    text,
  add column contact_email text,
  add column contact_phone text;

alter table public.stores
  add constraint stores_description_length
    check (description is null or char_length(description) <= 280),
  add constraint stores_contact_email_shape
    check (
      contact_email is null
      or contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    ),
  add constraint stores_contact_phone_length
    check (contact_phone is null or char_length(contact_phone) between 6 and 24),
  add constraint stores_logo_url_shape
    check (logo_url is null or logo_url ~ '^https://'),
  add constraint stores_banner_url_shape
    check (banner_url is null or banner_url ~ '^https://');

/* ------------------------------------------------------------------ *
 *  Lecture publique
 *
 *  Seules les boutiques ouvertes sont lisibles par un visiteur. Un brouillon
 *  ou une boutique suspendue restent invisibles, y compris à qui devine leur
 *  identifiant.
 * ------------------------------------------------------------------ */

create policy stores_select_public on public.stores
  for select to anon, authenticated
  using (status = 'active');

/* ------------------------------------------------------------------ *
 *  État public d'un identifiant
 *
 *  Sert à distinguer trois cas sans exposer la ligne : le slug n'existe pas
 *  (404), la boutique est ouverte (vitrine), la boutique est suspendue (écran
 *  d'indisponibilité). Un brouillon répond « missing » : il ne doit pas être
 *  devinable.
 * ------------------------------------------------------------------ */

create or replace function public.storefront_status(p_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case
        when s.status = 'active' then 'active'
        when s.status = 'suspended' then 'suspended'
        else 'missing'
      end
      from public.stores s
      where s.slug = lower(btrim(p_slug))
    ),
    'missing'
  );
$$;

grant execute on function public.storefront_status(text) to anon, authenticated;

/* ------------------------------------------------------------------ *
 *  Pour les futures tables filles
 *
 *  « Cette ressource appartient-elle à une boutique ouverte ? » — une ligne
 *  de produit ou une page ne sera publique que si sa boutique l'est.
 * ------------------------------------------------------------------ */

create or replace function public.is_public_store(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores s
    where s.id = target and s.status = 'active'
  );
$$;

grant execute on function public.is_public_store(uuid) to anon, authenticated;
