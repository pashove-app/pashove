# PASHOVE — PLAN1b : paiement d'abonnement

> 7 novembre 2026.

## Flux

1. Le marchand ouvre `/app/settings/plan`.
2. Il choisit Standard ou Pro, son réseau Mobile Money et son numéro.
3. `create_plan_payment` crée une ligne `plan_payments` en `pending`.
4. Le serveur crée un softpay SasPay avec `Idempotency-Key = plan_payment.id`
   et `fee_charge_mode = ADD_ON` (le prix du plan est reçu en entier).
5. `record_plan_payment_intent` stocke l'id SasPay, le réseau et le pays.
6. Le webhook `transaction.success` :
   - tente d'abord `confirm_saspay_payment` (commande) ;
   - si la référence est inconnue, appelle `confirm_plan_payment`.
7. `confirm_plan_payment` vérifie le montant, appelle
   `set_account_plan(user, plan, 30)` puis remplit `period_start/period_end`.
8. Le plan est actif immédiatement ; la page affiche la date de fin.

Pas de renouvellement automatique. Le marchand clique « Renouveler » :
`set_account_plan` prolonge à partir de la date de fin existante.

## Schéma

`plan_payments` : `user_id`, `plan_code`, `amount`, `currency`, `reference`
(unique), `network_code`, `country_code`, `status`, `period_start/end`.

RLS : le marchand ne lit que ses propres lignes.

## Frais SasPay

`payments.provider_fee` et `net_amount` conservent les frais réels envoyés par
le webhook.

La commission (`post_online_commission`) enregistre dans ses métadonnées :
`provider_fee` (converti en devise de boutique), `fee_absorbed` et
`platform_net`.

**Pourquoi pas une écriture séparée en Free ?** Le solde retirable du marchand
est `available + commission_due`. Débiter `commission_due` de 400 ferait
passer `commission_due` de −1 000 à −600, donc le solde de 9 000 à **9 400**.
Le marchand recevrait 400 de plus que prévu. La bonne lecture est :

- vente 10 000 → `available` +10 000 ;
- commission 1 000 → `commission_due` −1 000 ;
- solde marchand = 9 000 ;
- la commission porte `provider_fee = 400`, `fee_absorbed = true`,
  `platform_net = 600`.

Pashove absorbe donc bien les 400 sur sa commission, sans ligne qui augmente
le solde du marchand.

## Limite V1

Le prix des plans est en **XOF**. Le paiement d'abonnement n'est proposé que
si la devise de la boutique est XOF. Pour un store GHS/KES, il faudra convertir
le prix du plan avec le moteur FX (colonnes `payment_currency/payment_amount`
à ajouter sur `plan_payments`).

## Test

```sql
select * from public.plan_payments order by created_at desc limit 5;
select public.current_plan();
```

Parcours : `/app/settings/plan` → choisir Standard → réseau Mali → numéro →
payer. Vérifier `plan_payments.status = 'captured'` et
`account_plans.plan_code = 'standard'`, `expires_at ≈ now() + 30 j`.
