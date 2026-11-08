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
