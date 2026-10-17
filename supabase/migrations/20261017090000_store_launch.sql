-- Publication de la boutique.
--
-- `status` reste la source de vérité ; `launched_at` garde la date du
-- passage en ligne, qui servira aux analyses et au parcours « première vente ».
-- Il n'est renseigné qu'une fois : republier ne réécrit pas la date d'origine.

alter table public.stores
  add column launched_at timestamptz;
