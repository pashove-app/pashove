# PASHOVE — Séquestre 24 h, solde net et litiges

> 8 novembre 2026.

## Holding period

- À l’encaissement, la part marchand part en `pending` (`payout-hold`), pas en
  `available`.
- `orders.payout_available_at` :
  - produits physiques : fixé 24 h après le passage de la commande en
    `delivered` (ou après l’OTP pour Pashove Delivery) ;
  - numériques et services : 24 h après le paiement.
- `orders.payout_hold_amount` mémorise le montant retenu.
- Le cron `/api/cron/payout-release` (chaque heure) appelle
  `release_matured_payouts` : `pending` → `available`, idempotent
  (`payout-release:<order>`).
- Pashove Delivery : le séquestre `reserved` est libéré à l’OTP ; la part
  produit va en `pending` pour 24 h, le livreur est payé immédiatement.

## Solde retirable

`request_payout` et les écrans de retrait utilisent
`available + commission_due` (net), et non plus `available` seul : la
commission Pashove ne peut plus être retirée par erreur.

## Litiges

`/platform-admin/deliveries` propose, pour une course `disputed` :

- **Libérer l’argent** : `settle_delivery` (part produit en attente 24 h,
  livreur et Pashove payés).
- **Rembourser le client** : produit remboursé (hors livraison et frais
  SasPay), livreur payé, commission Pashove annulée, commande `refunded`,
  course `cancelled`. Le transfert réel au client se fait depuis SasPay.
- **Annuler la course** : course annulée, séquestre conservé (à traiter
  manuellement).

Le remboursement produit est affiché dans le bouton admin.

## Cron à ajouter

| URL | Fréquence |
|---|---|
| `https://pashove.com/api/cron/payout-release` | chaque heure (`17 * * * *`) |

## Limites

- Un remboursement SasPay n’existe pas côté API : le virement au client est
  manuel.
- « Annuler la course » ne libère pas le séquestre.
- Le mélange physique + numérique applique le délai physique (le plus strict).
