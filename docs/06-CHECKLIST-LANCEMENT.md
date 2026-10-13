# PASHOVE — Checklist de lancement

> À cocher **avant** d'ouvrir au public. Aucun lancement sans 100 %.

## Fondations
- [ ] Authentification + récupération de compte testées
- [ ] Isolation multi-boutiques + **RLS vérifiées par test automatisé**
- [ ] Sauvegardes configurées **et restauration testée**
- [ ] Rôles et permissions admin configurés

## Commerce
- [ ] Création + publication d'une boutique fonctionnelles
- [ ] Éditeur + thèmes gratuits opérationnels
- [ ] Produits physiques / numériques / services testés
- [ ] Pays de vente + règles de livraison validés

## Paiements et retraits
- [ ] Commissions Free / Standard / Pro validées
- [ ] Webhooks + idempotence testés (2× même webhook = 1 commande)
- [ ] Ledger + rapprochement quotidien opérationnels
- [ ] Retraits, bénéficiaires et KYC testés
- [ ] Test : 2 retraits simultanés ne doublent pas le solde

## Protection et opérations
- [ ] Fichiers privés + liens temporaires sécurisés
- [ ] Test : un client ne peut pas accéder au fichier d'un autre
- [ ] Test : un marchand ne peut pas accéder à une autre boutique
- [ ] Remboursements, cadeaux, affiliation testés (si activés)
- [ ] Journalisation + alertes activées
- [ ] Support + procédure d'incident prêts
- [ ] Supabase passé en **Pro** (pas de pause 7 jours)
- [ ] Status page / monitoring en ligne
- [ ] Politiques légales publiées (CGU, confidentialité, retraits)

## Scénarios de test obligatoires
| Scénario | Attendu |
|---|---|
| 2 clients achètent la dernière unité | 1 seule réservation valide |
| Le PSP envoie 2× le même webhook | 1 seule écriture |
| Client ferme la page après paiement | Commande mise à jour via serveur |
| Retrait > solde | Bloqué, aucun débit |
| Bénéficiaire modifié | Auth renforcée + contrôles |
| Commande remboursée | Soldes + commissions ajustés |
| Produit retiré d'un pays | Plus achetable dans ce pays |
| Cadeau réclamé 2× | 1 seule réclamation |
| Vérification KYC échouée | Bloqué + voie de résolution |
