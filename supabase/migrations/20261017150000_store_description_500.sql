-- La description de vitrine passe de 280 à 500 caractères, pour laisser
-- au marchand la place de présenter son activité en deux phrases.

alter table public.stores drop constraint stores_description_length;

alter table public.stores
  add constraint stores_description_length
  check (description is null or char_length(description) <= 500);
