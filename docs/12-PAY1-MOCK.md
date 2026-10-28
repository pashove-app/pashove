# PASHOVE — PAY1 : moteur de paiement avec Mock

> 27/10/2026 — infrastructure de paiement en ligne testable sans clés PSP.

## Objectif

Construire le parcours complet — éligibilité, intention, confirmation, ledger,
remboursement, console admin — avec un fournisseur **Mock**. Le jour où les clés
Flutterwave arrivent, seule l’implémentation du fournisseur change.

## Moteur d’éligibilité

RPC `checkout_payment_methods(slug, has_non_physical, country, currency)` :

- COD si la boutique l’autorise ;
- Orange Money, Wave et carte si le plan du propriétaire est
  Standard/Pro **ou** si le panier contient du numérique/service ;
- les méthodes en ligne exigent que le fournisseur Mock soit actif ;
- le plan et le type de produit sont relus en base, jamais fournis par le
  client.

Vérifié : panier physique Free → `["cod"]` ; panier numérique Free →
`["cod","orange_money","wave","card"]`.

## Checkout

`/store/[slug]/checkout` affiche les cartes de moyens de paiement renvoyées par
le serveur :

- Paiement à la livraison ;
- Orange Money (Mock) ;
- Wave (Mock) ;
- Carte bancaire (Mock).

Mobile Money demande un numéro. Carte demande numéro, expiration et CVV ; ces
données sont validées côté serveur puis **jamais stockées** (aucune donnée de
carte en base, même en test). Le bouton confirme la commande et attend la
confirmation Mock (~2 s).

## Fournisseur Mock

`src/lib/payments/provider.ts` définit le contrat commun :
`createIntent()`, `confirm()`, `handleWebhook()`.

`MockProvider` :

- génère une référence `mock_<uuid>` ;
- simule 2 s de latence ;
- retourne un succès ;
- vérifie une signature HMAC SHA-256 sur les webhooks.

Route : `POST /api/payments/webhook/mock`, en-tête `x-pashove-signature`.
Secret : `MOCK_WEBHOOK_SECRET` (fallback de développement documenté).

## Base de données

- `payment_providers` : Mock actif, Flutterwave/CinetPay/PayDunya à configurer.
- `payments` : provider étendu (`cod`, `mock`, futurs PSP), `method`
  (`cod`, `orange_money`, `wave`, `card`).
- `place_online_order()` : appelle `place_order`, laisse la commande
  `pending`, transforme le paiement en Mock.
- `record_payment_intent()` : trace l’intention et sa référence.
- `confirm_mock_payment()` : capture, marque la commande payée, crée les droits
  numériques/services via le trigger existant, puis appelle le ledger.
- `post_online_sale()` : `online_capture`, débit `available`, crédit ventes et
  livraison, remise en débit.
- `post_online_commission()` : commission serveur sur la base remisée.
- `refund_online_order()` / `refund_payment()` : remboursement compensatoire,
  révocation des droits, statut `refunded`.

## Console plateforme

- `/platform-admin/payments` : COD + Mock, montant, moyen, statut, date,
  commande, boutique, bouton Rembourser.
- `/platform-admin/payment-providers` : Mock actif ; Flutterwave, CinetPay et
  PayDunya configurables avec clés publiques/secrètes/webhook.
- Les clés sont chiffrées **AES-256-GCM** avec `ENCRYPTION_KEY` avant stockage ;
  aucune clé n’est renvoyée au navigateur.

## Vérifications réelles

- Commande #1024 : Guide numérique, Orange Money Mock, 10 000 F → remise 1 000
  F → **9 000 F**, statut `delivered`, paiement `captured`, droit numérique
  `available`.
- Ledger #1024 : `online_capture` + commission **900 F** (10 %).
- Remboursement admin #1024 : `refunded`, droit **revoked**, écritures
  compensatoires.
- Commande #1025 : parcours Mobile Money rempli et confirmé depuis le checkout.
- Webhook Mock : signature valide → 200, signature invalide → 401.
- Configuration Flutterwave testée : clé enregistrée chiffrée (`v1:…`), puis
  remise à `not_configured` pour ne pas laisser de fausses clés.
- Aucun débordement mobile du checkout ; 4 méthodes visibles à 390 px.
- Build, TypeScript et lint verts.

## Limites

- Aucun vrai PSP : Mock uniquement.
- Les fournisseurs Flutterwave/CinetPay/PayDunya n’ont pas encore d’adaptateur.
- Les champs carte ne sont pas stockés, même en test ; un vrai PSP devra
  utiliser sa page hébergée ou son SDK (PCI).
- La commission utilise toujours `stores.commission_bps` (10 % pour la boutique
  actuelle), pas encore le taux du plan.
- Le remboursement COD par un admin non-membre de la boutique reste limité par
  la fonction COD existante ; le remboursement en ligne est ouvert aux admins.
- Pas de 3-D Secure, de routage multi-PSP, de réconciliation PSP ni de statut
  d’expiration asynchrone.
- Le compte admin de test utilisé pour les captures a été retiré de
  `platform_admins` et banni ; son mot de passe n’est pas réutilisable.
