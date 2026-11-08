# PASHOVE — Tarifs de livraison plateforme et alertes sonores

> 8 novembre 2026.

## Grille de livraison

- `delivery_zones` : pays + devise, nom de zone, tarif, zone par défaut.
- `/platform-admin/delivery-pricing` : ajout, modification et suppression,
  une seule zone par défaut par pays.
- `public_delivery_zones(slug)` : zones actives du pays de la boutique, dans
  sa devise.
- `apply_delivery_zone(order_token, zone_id)` : vérifie la zone, le pays et
  la devise, puis remplace `shipping_amount` et recalcule `total_amount`.

## Checkout

- Si la boutique est en mode `pashove` et que le panier contient du physique,
  le sélecteur de pays est remplacé par un sélecteur de **zone de livraison**
  (nom + tarif). Le pays de livraison est celui de la boutique.
- Le récapitulatif affiche le tarif de la zone et le total correspondant.
- Après création de la commande, l’action serveur applique la zone avant de
  créer l’intention de paiement ; le montant envoyé au prestataire est le
  total avec livraison.
- Si aucune zone n’existe, le checkout refuse la commande Pashove Delivery.

## Sons

- `SoundAlert` synthétise un « cha-ching » (Web Audio), sans fichier.
- Tableau de bord marchand : rafraîchissement toutes les 20 s ; le son joue
  quand le nombre de commandes augmente.
- Espace livreur : rafraîchissement toutes les 5 s quand en ligne ; le son
  joue quand une nouvelle offre arrive.
- Le navigateur exige une interaction avant l’audio : le contexte est
  débloqué au premier clic ou touche.

## Limites

- Zones limitées au pays et à la devise de la boutique ; pas encore de
  livraison multi-pays.
- Pashove Delivery + marché de paiement dans une autre devise : refusé.
- Les frais SasPay affichés au checkout sont calculés sur le panier avant
  application de la zone ; le webhook reste la source du montant réel.
- Les sons ne se déclenchent que si le navigateur autorise l’audio.
