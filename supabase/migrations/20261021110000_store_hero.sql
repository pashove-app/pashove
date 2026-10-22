-- Titre et sous-titre de la bannière d'accueil de la vitrine.

alter table public.stores
  add column hero_title text
    check (hero_title is null or char_length(btrim(hero_title)) between 1 and 80),
  add column hero_subtitle text
    check (hero_subtitle is null or char_length(btrim(hero_subtitle)) between 1 and 160);
