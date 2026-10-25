-- Rôle « gestionnaire de produits » ajouté aux membres d'une boutique.
alter type public.store_role add value if not exists 'product_manager';
