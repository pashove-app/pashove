# PASHOVE — Pashove Delivery, lots L2a/L2b

> 8 novembre 2026.

## L2a — réglages

- `stores.delivery_mode` (`self` | `pashove`) et `delivery_countries`.
- `deliveries` : commande, boutique, livreur, statut, frais, devise,
  champs OTP réservés à L2c.
- `/app/settings/shipping` : mode et zones, alimentées par les pays de vente.

## L2b — dispatch

- `couriers.is_online` ; bouton dans `/app/courier` (approuvés uniquement).
- À la commande **payée en ligne**, boutique en mode `pashove` et pays
  desservi : création d’une course `searching`, frais = `shipping_amount`.
- Dispatch : premier livreur `approved` + `is_online` du pays, sans course
  active et pas encore sollicité. Offre de **10 secondes**
  (`offers_expires_at`) ; compteur côté livreur.
- Accepter → `accepted` ; refuser ou expiration → livreur exclu, course
  reproposée au suivant.
- `/api/cron/delivery-offers` (toutes les minutes) : expire les offres
  oubliées et relance les courses en attente.

## Cron à ajouter

| URL | Fréquence |
|---|---|
| `https://pashove.com/api/cron/delivery-offers` | chaque minute (`* * * * *`) |

## Limites connues

- Pas de GPS : sélection par pays, pas par distance.
- Course en espèces (COD) exclue de Pashove Delivery.
- `shipping_amount = 0` crée une course à 0 ; le split L2c devra le gérer.
- Un remboursement n’annule pas encore la course.
- Le ramassage affiche le nom de la boutique : l’adresse de retrait sera
  ajoutée aux réglages boutique.

## L2c — OTP, escrow et litiges

### Escrow

- À la création de la course, `hold_delivery_fee` déplace les frais de
  livraison de `available` vers `reserved` : le marchand ne peut plus les
  retirer avant la livraison.
- À la validation OTP, `settle_delivery` :
  - marchand : `reserved` crédité, `fees` débité (la livraison sort de son
    solde) ;
  - livreur : `available` débité de **90 %** sur le ledger de sa boutique,
    `delivery_income` crédité ;
  - Pashove : **10 %** via `fees` / `delivery_commission_income`.
- Clés d’idempotence : `delivery-hold`, `delivery-settle`,
  `delivery-income`, `delivery-platform`, toutes suffixées par l’ordre.
- Un litige laisse `reserved` intact.

### OTP

- À l’acceptation, `issue_delivery_otp` génère 4 chiffres, stocke
  `sha256(code)`, expire en 24 h, remet le compteur de tentatives à zéro.
- Le code est envoyé **uniquement au client** par e-mail, depuis l’action
  serveur du livreur ; il n’est jamais renvoyé au navigateur du livreur.
- `deliver_delivery` compare le hash, limite à 5 tentatives, passe la course
  en `delivered` et déclenche le split.
- En cas d’échec d’envoi de l’e-mail, le code reste stocké ; prévoir un
  renvoi manuel support.

### Litige

- `report_delivery_problem` passe la course en `disputed`, enregistre le
  motif et un `order_event`.
- `/platform-admin/deliveries` liste les courses et les litiges.
- Résolution admin (libérer ou rembourser) : lot ultérieur.

### Comptes de ledger ajoutés

`delivery_income`, `delivery_commission_income`.

### Limites

- OTP à 4 chiffres : sécurité portée par les 5 tentatives et l’expiration.
- L’e-mail du code dépend de Brevo ; l’envoi n’est pas réessayé.
- Un litige n’a pas encore d’écran de résolution.
