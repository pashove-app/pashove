# PASHOVE — M1 : marketing et analytics

> 5 novembre 2026 — campagnes, panier abandonné et analyses marchand.

## Analytics

`/app/analytics` : CA 30 jours, commandes payées, panier moyen, conversion
(paniers convertis / paniers), nouveaux clients, graphique 30 jours, top
produits et top clients.

RPC : `store_analytics(store_id)`, réservé aux membres de la boutique.

## Campagnes e-mail

`/app/marketing` :

- objet, message, segment (clients payants, tous les contacts, acheteurs
  numériques) ;
- audience calculée côté base ;
- campagne créée avec statut `sending`, puis envoyée en arrière-plan ;
- destinataires et erreurs conservés dans `email_campaign_recipients` ;
- plafond V1 de 200 destinataires par campagne.

Tables : `email_campaigns`, `email_campaign_recipients`.

## Panier abandonné

Le client peut laisser son e-mail depuis le panier (« Garde ton panier pour
plus tard »). C’est un **opt-in explicite**.

- table `cart_reminders`, unicité par panier ;
- cron `/api/cron/abandoned-carts`, protégé par `CRON_SECRET`, toutes les heures ;
- envoi unique après 24 h d’inactivité, si le panier est toujours ouvert ;
- lien `/cart/recover?token=…` qui repose le cookie HttpOnly du panier ;
- e-mail `abandoned_cart` avec les articles et le total.

Le cron nécessite `SUPABASE_SERVICE_ROLE_KEY`.

## Vérifications

- `store_analytics` et `store_audience` testés avec une session marchande.
- Expérience panier : ajout d’un produit, opt-in e-mail, ligne `pending` créée
  dans `cart_reminders`, confirmation affichée.
- Pages analytics et marketing capturées.
- Build, TypeScript et lint verts.
- Aucune campagne réelle envoyée pendant les tests.

## Limites

- Campagnes limitées à 200 destinataires et sans éditeur riche ni
  désabonnement.
- Pas encore de segments marketing avancés (RFM, panier, pays).
- Le cron de panier n’a pas été exécuté en local (service role) ; la logique
  est prête pour Vercel.
- Les analytics portent sur 30 jours et les commandes payées.
