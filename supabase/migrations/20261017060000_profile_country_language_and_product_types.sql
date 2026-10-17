-- Étape 2 : le pays de résidence et la langue rejoignent le profil.
-- Étape 3 : la boutique déclare ce qu'elle vend.

alter table public.profiles
  add column country  text,
  add column language text not null default 'fr';

alter table public.profiles
  add constraint profiles_country_shape
    check (country is null or country ~ '^[A-Z]{2}$'),
  add constraint profiles_language_allowed
    check (language in ('fr', 'en', 'bm', 'ln', 'ar'));

-- Trois valeurs possibles, un tableau suffit : une table de jointure
-- n'apporterait qu'une jointure de plus.
alter table public.stores
  add column product_types text[] not null default '{}';

alter table public.stores
  add constraint stores_product_types_allowed
    check (product_types <@ array['physical', 'digital', 'service']::text[]);
