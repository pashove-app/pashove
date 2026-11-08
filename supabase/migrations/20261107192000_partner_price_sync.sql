-- PASHOVE — P2a (prix) : synchroniser le prix, garder le miroir actif
--
-- Le miroir ne passe en brouillon que si le produit source est dépublié,
-- supprimé, ou si la boutique source est suspendue. Un simple changement de
-- prix est répercuté sans interrompre la vente du partenaire.

create or replace function public.partner_sync_from_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if NEW.source_product_id is not null then
    return NEW;
  end if;

  if NEW.status <> 'published' then
    update public.products
    set status = 'draft'
    where source_product_id = NEW.id
      and status <> 'draft';
  else
    update public.products
    set name = NEW.name,
        description = NEW.description,
        price_amount = NEW.price_amount
    where source_product_id = NEW.id;
  end if;

  return NEW;
end;
$$;

revoke execute on function public.partner_sync_from_source()
  from public, anon, authenticated;
