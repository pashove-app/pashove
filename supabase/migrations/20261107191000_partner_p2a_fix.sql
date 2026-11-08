-- PASHOVE — P2a (correctif) : détacher les miroirs, ne jamais les supprimer
--
-- `order_items.product_id` est en `on delete cascade`. Supprimer un produit
-- miroir effacerait donc les lignes de commande correspondantes. On détache
-- plutôt le miroir : il redevient un produit autonome en brouillon, son
-- historique de commandes reste intact.

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

  update public.products
  set status = 'draft',
      source_product_id = null,
      partner_offer_id = null,
      partner_source_store_id = null,
      partner_commission_bps = null
  where source_product_id = OLD.id;

  return OLD;
end;
$$;

revoke execute on function public.partner_delete_mirrors_on_source_delete()
  from public, anon, authenticated;

create or replace function public.partner_offer_delete_mirrors()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
  set status = 'draft',
      source_product_id = null,
      partner_offer_id = null,
      partner_source_store_id = null,
      partner_commission_bps = null
  where partner_offer_id = OLD.id;

  return OLD;
end;
$$;

revoke execute on function public.partner_offer_delete_mirrors()
  from public, anon, authenticated;
