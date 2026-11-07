# PASHOVE — Personnalisation de la page de paiement

> 7 novembre 2026. Principe : le marchand personnalise son identité, jamais
> les règles de paiement.

## Ce que le marchand peut modifier

| Réglage | Où |
|---|---|
| Logo, couleurs, police | Thème de vitrine (`/app/online-store/themes`) — le checkout hérite |
| Modèle : Compact ou Détaillé | `/app/settings/checkout` |
| Ordre des blocs | `/app/settings/checkout` |
| Titre, sous-titre, libellé du bouton | `/app/settings/checkout` |
| Afficher l’achat cadeau | `/app/settings/checkout` |
| Afficher le champ code promo | `/app/settings/checkout` |

Blocs disponibles : `contact`, `delivery`, `gift`, `summary`, `payment`.
`payment` ne peut pas être retiré (sans lui, aucune commande).

## Ce qui est verrouillé

- **Les pays** : ils viennent du pays de la boutique et du référentiel SasPay.
- **Les moyens de paiement par pays** : `GET /pricing/my-rates/`, filtré sur
  `country_code` et `payin.available`.
- **Les logos** : catalogue plateforme (`src/lib/payments/catalog.ts`), rendu
  en pastilles de marque. Le marchand ne peut ni les changer ni les retirer.
- **Les frais** : calculés côté serveur, jamais exposés comme réglage.

## Fonctionnement du catalogue

1. `checkout_payment_methods` (SQL) décide si l’encaissement en ligne est ouvert
   et quelles familles sont permises selon le plan et le total du panier.
2. Si SasPay répond, `getCheckoutOptions` prend la liste réelle des réseaux du
   pays (nom, OTP requis, disponibilité).
3. Sinon, repli sur le référentiel plateforme (Orange, Wave, MTN, Moov, carte),
   filtré par pays.

Le code réseau choisi par le client (`orange_ml`) est **revérifié côté serveur**
avant toute écriture. La famille comptable (`orange_money`, `mobile_money`,
`card`…) est déduite du préfixe, jamais envoyée par le navigateur.

Les réseaux qui ne sont ni Orange, ni Moov, ni MTN, ni Wave (Djamo, Celtiis,
Airtel, Wizall, Mobi Cash…) sont enregistrés sous la famille `mobile_money`.

## OTP

Certains réseaux exigent un code **avant** le paiement (Orange Côte d’Ivoire et
Burkina Faso). `otp_required` et `otp_instructions` viennent de
`/pricing/my-rates/` ; le champ apparaît dans le bloc paiement et le code part
dans le corps de `POST /payments/softpay/` (`otp`).

Ne pas confondre avec l’OTP **après** push (Coris Bénin, Wizall Sénégal), qui
passe par `/payments/{id}/confirm-otp/` — pas encore branché côté UI.

## Règles par plan (migration `20261107122000`)

| Plan | Encaissement | Carte |
|---|---|---|
| Free | Mobile money autorisé | À partir de 25 000 |
| Standard | Tous | Toujours |
| Pro | Tous | Toujours |

Le total du panier est passé à `checkout_payment_methods(p_total)` pour le seuil
carte. Il reste calculé en base, jamais lu depuis le client.

## Migrations à appliquer

1. `20261107120000_checkout_settings.sql`
2. `20261107121000_mobile_money_family.sql`
3. `20261107122000_plan_checkout_rules.sql`

Sans la 1 : le checkout utilise les réglages par défaut (aucune casse).
Sans la 2 : les réseaux hors Orange/Wave/MTN/Moov sont refusés.
Sans la 3 : le code retombe sur l’ancienne règle (COD seul en Free + physique).

## Limite connue

La carte SasPay est facturée en USD (« International (USD) »). Un store en XOF
qui propose la carte peut recevoir `currency_country_mismatch`. À traiter avec
la conversion de devise, ou masquer la carte en XOF d’ici là.
