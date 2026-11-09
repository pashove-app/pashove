-- PASHOVE — Purge unique des données d'audit avant lancement
--
-- À exécuter UNE FOIS dans le SQL Editor Supabase, en tant que postgres.
-- Ce fichier n'est PAS une migration : ne pas le déplacer dans supabase/migrations.
--
-- Le ledger est protégé par les triggers ledger_entries_immutable et
-- ledger_transactions_immutable. On les désactive uniquement le temps de la
-- transaction ; toute erreur annule le lot et réactive les triggers.
--
-- Cibles : 8 boutiques audit-* (commandes + ledger) et 4 boutiques livreur-*
-- de test (comptes livreurs audit-*). Les autres boutiques audit-* et
-- livreur-* sans ledger ont déjà été supprimées.

begin;

alter table public.ledger_entries
  disable trigger ledger_entries_immutable;
alter table public.ledger_transactions
  disable trigger ledger_transactions_immutable;

delete from public.ledger_entries
where store_id in (
  '47e205bd-e036-4a47-8811-bbc64035bf43',
  '4c4e453d-fab3-4d8f-aa3f-99fb17dd035e',
  '11b6b3e8-091b-4805-9ec2-504ce4608a7c',
  'ead7c80b-5345-4559-9ba6-e6498fc7d9ed',
  'd76b3a66-26da-4585-a769-c589bb08a37a',
  '815d95cb-e993-4442-aead-16b23190c896',
  'ed3861ed-82f3-41be-bc4c-e8a9b8734f30',
  'a85d78a7-4712-49ce-83ad-890ea9a5caee',
  'c6a18937-a6a5-4801-9ee0-fbcec8f33aa9',
  '2a10adf7-4474-4195-bb0f-2417c09ac1a9',
  '1bb39cc2-0f5e-4769-9571-fcec6fd7b840',
  '6aa840eb-b33a-49ca-b0b0-eed913ec656c'
);

delete from public.ledger_transactions
where store_id in (
  '47e205bd-e036-4a47-8811-bbc64035bf43',
  '4c4e453d-fab3-4d8f-aa3f-99fb17dd035e',
  '11b6b3e8-091b-4805-9ec2-504ce4608a7c',
  'ead7c80b-5345-4559-9ba6-e6498fc7d9ed',
  'd76b3a66-26da-4585-a769-c589bb08a37a',
  '815d95cb-e993-4442-aead-16b23190c896',
  'ed3861ed-82f3-41be-bc4c-e8a9b8734f30',
  'a85d78a7-4712-49ce-83ad-890ea9a5caee',
  'c6a18937-a6a5-4801-9ee0-fbcec8f33aa9',
  '2a10adf7-4474-4195-bb0f-2417c09ac1a9',
  '1bb39cc2-0f5e-4769-9571-fcec6fd7b840',
  '6aa840eb-b33a-49ca-b0b0-eed913ec656c'
);

delete from public.ledger_accounts
where store_id in (
  '47e205bd-e036-4a47-8811-bbc64035bf43',
  '4c4e453d-fab3-4d8f-aa3f-99fb17dd035e',
  '11b6b3e8-091b-4805-9ec2-504ce4608a7c',
  'ead7c80b-5345-4559-9ba6-e6498fc7d9ed',
  'd76b3a66-26da-4585-a769-c589bb08a37a',
  '815d95cb-e993-4442-aead-16b23190c896',
  'ed3861ed-82f3-41be-bc4c-e8a9b8734f30',
  'a85d78a7-4712-49ce-83ad-890ea9a5caee',
  'c6a18937-a6a5-4801-9ee0-fbcec8f33aa9',
  '2a10adf7-4474-4195-bb0f-2417c09ac1a9',
  '1bb39cc2-0f5e-4769-9571-fcec6fd7b840',
  '6aa840eb-b33a-49ca-b0b0-eed913ec656c'
);

-- Le reste (commandes, paiements, livraisons, paniers, produits, membres)
-- est supprimé en cascade par les clés étrangères.
delete from public.stores
where id in (
  '47e205bd-e036-4a47-8811-bbc64035bf43',
  '4c4e453d-fab3-4d8f-aa3f-99fb17dd035e',
  '11b6b3e8-091b-4805-9ec2-504ce4608a7c',
  'ead7c80b-5345-4559-9ba6-e6498fc7d9ed',
  'd76b3a66-26da-4585-a769-c589bb08a37a',
  '815d95cb-e993-4442-aead-16b23190c896',
  'ed3861ed-82f3-41be-bc4c-e8a9b8734f30',
  'a85d78a7-4712-49ce-83ad-890ea9a5caee',
  'c6a18937-a6a5-4801-9ee0-fbcec8f33aa9',
  '2a10adf7-4474-4195-bb0f-2417c09ac1a9',
  '1bb39cc2-0f5e-4769-9571-fcec6fd7b840',
  '6aa840eb-b33a-49ca-b0b0-eed913ec656c'
);

alter table public.ledger_entries
  enable trigger ledger_entries_immutable;
alter table public.ledger_transactions
  enable trigger ledger_transactions_immutable;

commit;
