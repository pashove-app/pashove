-- PASHOVE — Verrouillage des RPC de paiement de démonstration
--
-- `confirm_mock_payment` marque une commande comme payée et écrit au ledger.
-- Elle était exécutable avec la clé `anon`, publique par construction : un
-- visiteur connaissant le jeton public de sa propre commande pouvait la
-- confirmer sans qu'aucun argent n'ait été encaissé.
--
-- `record_payment_intent` écrit dans `payment_transactions` et fixe la
-- référence de paiement ; elle est verrouillée pour la même raison.
--
-- Ces deux fonctions ne sont désormais appelables qu'avec la clé de service,
-- depuis les server actions et la route webhook — jamais depuis le navigateur.

revoke execute on function public.confirm_mock_payment(uuid, text)
  from public, anon, authenticated;
grant execute on function public.confirm_mock_payment(uuid, text)
  to service_role;

revoke execute on function public.record_payment_intent(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_payment_intent(uuid, text, text, text)
  to service_role;
