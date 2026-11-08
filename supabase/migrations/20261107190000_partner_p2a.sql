-- PASHOVE — P2a : détails d'offre et garde-fous de propriété
--
-- Le propriétaire garde le contrôle du produit source : prix modifié, produit
-- dépublié ou boutique suspendue désactivent automatiquement le miroir.
-- Supprimer l'offre ou le produit source supprime les miroirs.

/* ------------------------------------------------------------------ *
 *  Statistiques d'une offre (ventes)
 * ------------------------------------------------------------------ */

create or replace function public.partner_offer_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(s.offer_id::text, s.total),
    '{}'::jsonb
  )
  from (
    select ps.offer_id, count(*)::integer as total
    from public.partner_sales ps
    where ps.offer_id is not null
    group by ps.offer_id
  ) s;
$$;

revoke execute on function public.partner_offer_stats()
  from public, anon, authenticated;
grant execute on function public.partner_offer_stats()
  to authenticated;

/* ------------------------------------------------------------------ *
 *  Produit source modifié → miroirs
 * ------------------------------------------------------------------ */

create or replace function public.partner_sync_from_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Un miroir ne propage rien : seul le produit source déclenche.
  if NEW.source_product_id is not null then
    return NEW;
  end if;

  if NEW.status <> 'published' or NEW.price_amount <> OLD.price_amount then
    update public.products
    set status = 'draft'
    where source_product_id = NEW.id
      and status <> 'draft';
  else
    update public.products
    set name = NEW.name,
        description = NEW.description
    where source_product_id = NEW.id;
  end if;

  return NEW;
end;
$$;

revoke execute on function public.partner_sync_from_source()
  from public, anon, authenticated;

drop trigger if exists products_partner_sync_from_source on public.products;
create trigger products_partner_sync_from_source
  after update of status, price_amount, name, description on public.products
  for each row execute function public.partner_sync_from_source();

/* ------------------------------------------------------------------ *
 *  Suppression du produit source → suppression des miroirs
 * ------------------------------------------------------------------ */

create or replace function public.partner_delete_mirrors_on_source_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if OLD.source_product_id is not null then
    return OLD;
  end if;

  delete from public.products where source_product_id = OLD.id;
  return OLD;
end;
$$;

revoke execute on function public.partner_delete_mirrors_on_source_delete()
  from public, anon, authenticated;

drop trigger if exists products_partner_delete_mirrors on public.products;
create trigger products_partner_delete_mirrors
  before delete on public.products
  for each row execute function public.partner_delete_mirrors_on_source_delete();

/* ------------------------------------------------------------------ *
 *  Offre modifiée ou supprimée
 * ------------------------------------------------------------------ */

create or replace function public.partner_offer_sync_mirrors()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if NEW.active = false then
    update public.products
    set status = 'draft'
    where partner_offer_id = NEW.id
      and status <> 'draft';
  elsif NEW.commission_bps <> OLD.commission_bps then
    update public.products
    set partner_commission_bps = NEW.commission_bps
    where partner_offer_id = NEW.id;
  end if;

  return NEW;
end;
$$;

revoke execute on function public.partner_offer_sync_mirrors()
  from public, anon, authenticated;

drop trigger if exists partner_offers_sync_mirrors on public.partner_offers;
create trigger partner_offers_sync_mirrors
  after update of active, commission_bps on public.partner_offers
  for each row execute function public.partner_offer_sync_mirrors();

create or replace function public.partner_offer_delete_mirrors()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.products where partner_offer_id = OLD.id;
  return OLD;
end;
$$;

revoke execute on function public.partner_offer_delete_mirrors()
  from public, anon, authenticated;

drop trigger if exists partner_offers_delete_mirrors on public.partner_offers;
create trigger partner_offers_delete_mirrors
  before delete on public.partner_offers
  for each row execute function public.partner_offer_delete_mirrors();

/* ------------------------------------------------------------------ *
 *  Boutique source suspendue → miroirs désactivés
 * ------------------------------------------------------------------ */

create or replace function public.partner_store_status_mirrors()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if NEW.status <> 'active' then
    update public.products
    set status = 'draft'
    where partner_source_store_id = NEW.id
      and status <> 'draft';
  end if;

  return NEW;
end;
$$;

revoke execute on function public.partner_store_status_mirrors()
  from public, anon, authenticated;

drop trigger if exists stores_partner_status_mirrors on public.stores;
create trigger stores_partner_status_mirrors
  after update of status on public.stores
  for each row execute function public.partner_store_status_mirrors();
