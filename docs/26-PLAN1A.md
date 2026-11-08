# PASHOVE — PLAN1a : expiration et commissions

> 7 novembre 2026.

## Livré

- `account_plans.expires_at` / `started_at` ;
- `plans.fee_included` (Free = vrai) ;
- `stores.fee_charge_mode` (`client` | `merchant`) ;
- `apply_plan_to_stores(user, plan)` : synchronise `stores.commission_bps`
  (10 % / 2 % / 0 %), repasse en `draft` les boutiques au-delà de la limite
  Free, et restaure les boutiques suspendues lors d’un retour payant ;
- `set_account_plan(user, plan, days)` — service_role, prolonge à partir de
  la date de fin existante ;
- `expire_account_plans()` + cron `/api/cron/plan-expiry` (quotidien,
  `CRON_SECRET`) ;
- `current_plan()` pour l’écran marchand ;
- toggle « Qui paie les frais SasPay ? » dans `/app/settings/markets`
  (Standard/Pro uniquement) ;
- rattrapage des `stores.commission_bps` existants.

## Cron à ajouter

| URL | Fréquence |
|---|---|
| `https://pashove.com/api/cron/plan-expiry` | une fois par jour (`23 4 * * *`) |

## Non fait — décision nécessaire

La compensation des frais SasPay en Free est **en attente**. Le cahier des
charges contient deux règles incompatibles :

- « Pashove paie les frais de sa poche » → vente 10 000, commission 1 000,
  frais 400 payés par Pashove, **le marchand reçoit 9 000** ;
- l’exemple chiffré « le marchand reçoit 8 600 » → les 400 sont déduits du
  marchand, donc les frais ne sont pas inclus.

Le ledger actuel (vente au brut, commission de 10 %, aucun débit de frais)
produit **9 000**. Poster une ligne de frais de 400 produirait 8 600.

Tant que ce point n’est pas tranché, `payments.provider_fee` n’est pas
enregistré et aucune écriture de compensation n’est postée.

## À suivre (PLAN1b)

- paiement Standard/Pro par softpay + webhook ;
- `set_account_plan` appelé à la confirmation ;
- emails J-7 / J-1 / J+0 ;
- envoi de `fee_charge_mode` à SasPay et affichage des frais au checkout
  (PLAN1c).
