-- PASHOVE — Mur de la réussite : classement mensuel des marchands
--
-- La page d'accueil publique affiche les boutiques qui ont généré le plus de
-- chiffre d'affaires sur le mois en cours. La fonction ne renvoie que des
-- informations déjà publiques (nom, slug, logo) : jamais les montants.
--
-- Règles :
--   * commandes payées du mois calendaire en cours ;
--   * une ligne par boutique, triée par chiffre d'affaires décroissant ;
--   * boutiques actives uniquement (une boutique suspendue ne s'affiche pas) ;
--   * 8 boutiques au maximum.

create or replace function public.get_top_merchants_of_month(
  p_limit integer default 8
)
returns table (
  store_id uuid,
  name     text,
  slug     text,
  logo_key text
)
language sql
security definer
set search_path = ''
stable
as $$
  with paid as (
    select
      o.store_id,
      sum(o.total_amount) as revenue
    from public.orders o
    where o.payment_status = 'paid'
      and o.created_at >= date_trunc('month', now())
      and o.created_at < date_trunc('month', now()) + interval '1 month'
    group by o.store_id
  )
  select
    s.id,
    s.name,
    s.slug,
    m.object_key
  from paid p
  join public.stores s on s.id = p.store_id
  left join public.media_assets m on m.id = s.logo_media_id
  where s.status = 'active'
  order by p.revenue desc, s.name asc
  limit greatest(least(coalesce(p_limit, 8), 8), 1);
$$;

revoke execute on function public.get_top_merchants_of_month(integer)
  from public, anon, authenticated;
grant execute on function public.get_top_merchants_of_month(integer)
  to anon, authenticated;
