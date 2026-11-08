# PASHOVE — PLAN1c : refacturation des frais SasPay

> 7 novembre 2026.

## Règles appliquées

| Plan | Mode | `fee_charge_mode` envoyé | Ligne client | Ledger |
|---|---|---|---|---|
| Free | — | `DEDUCTED` | aucune | frais absorbés, tracés dans la commission |
| Standard/Pro | client | `ADD_ON` | frais + total | aucun débit (le client a payé) |
| Standard/Pro | merchant | `DEDUCTED` | aucune | débit `fees` / crédit `available` |

Les 2 % (ou 0 %) de Pashove restent calculés sur le sous-total produit, jamais
sur les frais.

## Calcul du frais

`networkFeeMinor(amount, currency, tiers)` dans `src/lib/payments/catalog.ts` :
tier correspondant à `min_amount`/`max_amount`, puis
`amount × percent / 100 + fixed`, borné par `floor_amount` et `cap_amount`,
arrondi dans la devise du marché.

La grille vient de `GET /pricing/my-rates/` (`payin.tiers`). Les frais affichés
sont ceux du réseau sélectionné ; le montant réel est confirmé par le webhook
(`fee`) et stocké sur `payments.provider_fee`.

## Checkout

- `checkout_payment_methods` renvoie `feeIncluded` (plan) et `feeChargeMode`
  (boutique).
- Chaque option porte `clientFeeMinor`, calculé sur le montant du marché
  (converti si devise étrangère).
- Le bloc paiement affiche « Frais de paiement » et « Total à payer ».
- L'intention SasPay reçoit `fee_charge_mode` ; le montant envoyé reste le
  prix produit, SasPay ajoute les frais en `ADD_ON`.

## Ledger

- **Free** : pas de débit marchand. Le marchand reçoit 90 % ; la commission
  porte `provider_fee`, `fee_absorbed`, `platform_net`.
- **Standard/Pro merchant** : le webhook poste, avec la clé d'idempotence
  `saspay-fee-charge:<order>`, un débit `fees` et un crédit `available` du
  frais converti en devise de boutique. Le solde marchand devient
  `98 % − frais`, ce qui correspond au net réellement reçu.
- **Standard/Pro client** : aucune écriture de frais ; le client a payé le
  supplément.

## Limites

- Les frais carte (8 % + 0,5 USD) ne sont pas calculés : la carte reste
  limitée à la devise de la boutique et n'est pas encore facturée correctement.
- Un écart d'arrondi d'un centime entre notre calcul et SasPay reste possible ;
  le webhook fait foi.
- L'abonnement reste en XOF (voir PLAN1b).
