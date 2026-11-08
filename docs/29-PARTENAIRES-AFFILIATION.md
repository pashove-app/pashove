# PASHOVE — Partenaires : état et plan affiliation

> 7 novembre 2026. Le module « revendeur » existe déjà ; l'affiliation par lien
> et les garde-fous de propriété restent à faire.

## Ce qui existe (revendeur / produit miroir)

- `partner_offers` : le propriétaire autorise un produit avec `commission_bps`.
- `products.source_product_id`, `partner_offer_id`, `partner_source_store_id`,
  `partner_commission_bps` : la copie contrôlée chez le partenaire.
- `add_partner_listing` : crée la copie (produits physiques uniquement
  aujourd'hui), refuse sa propre boutique et les doublons.
- `partner_sales` : montant, commission partenaire, commission plateforme,
  revenu source, statut.
- Ledger des deux boutiques via `20261025402000_partner_ledger.sql`.

## Ce qui manque

1. **Affiliation par lien** (`?ref=CODE`) : table de liens, clics, attribution
   de commande, commission à la vente.
2. **Détails d'une offre** : nombre de ventes, date de création, créateur,
   commission prévisionnelle — avant « Ajouter à ma boutique ».
3. **Synchronisation propriétaire → miroir** : si le prix change, si le produit
   est supprimé ou repassé en brouillon, le miroir doit être désactivé ou mis à
   jour automatiquement. Aucun trigger ne le fait aujourd'hui.
4. **Sécurité numérique** : `add_partner_listing` refuse les produits non
   physiques. Le jour où on ouvre le numérique, le partenaire ne doit jamais
   obtenir de lien de téléchargement : seul l'acheteur reçoit un
   `digital_entitlement`, jamais le partenaire.
5. **Comptabilité affiliation** : la vente via lien se fait sur la boutique du
   propriétaire ; le ledger doit séparer propriétaire, affilié, Pashove.

## Schéma proposé (affiliation)

```sql
affiliate_links
  id, owner_store_id, affiliate_user_id, affiliate_store_id (nullable),
  code text unique (8 caractères), commission_bps, product_id (nullable),
  active, created_at

affiliate_clicks
  id, link_id, occurred_at, order_id (nullable), ip_hash

orders
  add affiliate_link_id uuid references affiliate_links,
  add affiliate_commission integer not null default 0
```

- Cookie `pashove_ref` (30 jours) posé par la page boutique quand `?ref=`.
- À la commande, le code est résolu côté serveur, jamais depuis un champ libre.
- La commission d'affiliation est calculée sur le sous-total, après remise, et
  écrite au ledger à la capture (idempotente).
- Le taux est plafonné par la marge : `affiliate + platform <= commission
  disponible` (à valider).

## Décisions nécessaires

1. **Fenêtre d'attribution** : 30 jours (cookie) ou session uniquement ?
2. **Qui paie la commission d'affiliation** : sur la part du propriétaire, ou
   partagée avec Pashove ?
3. **Produits numériques en revente** : autorisés (avec fichier invisible) ou
   physiques seulement pour l'instant ?
4. **Affilié sans boutique** : un simple compte utilisateur peut-il générer un
   lien, ou faut-il une boutique ?

## Ordre proposé

1. **P2a** — détails d'offre + triggers de synchronisation / désactivation.
2. **P2b** — affiliation : liens, cookie, attribution, ledger.
3. **P2c** — écran partenaire (deux onglets : Revendeur, Affilié) + statistiques.
4. **P2d** — sécurité numérique et tests de non-régression.
