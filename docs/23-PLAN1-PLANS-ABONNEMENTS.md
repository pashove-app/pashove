# PASHOVE — PLAN1 : plans, commissions et abonnements

> 7 novembre 2026 — conception avant code. PAY2a (encaissement SasPay) est
> livré séparément ; PLAN1 touche à l'argent, il mérite son propre lot testé.

## Ce qui existe déjà

- `plans` : `free` (10 %, 2 boutiques), `standard` (2 %, 5, 25 000),
  `pro` (0 %, 10, 45 000). Prix et commissions sont déjà justes.
- `account_plans` : une ligne par compte, `plan_code`, sans date d'expiration.
- `stores.commission_bps` : **la commission réellement appliquée au ledger**.
- `checkout_payment_methods` : gère déjà l'éligibilité en ligne par plan.

## Les trois trous à combler

1. **`stores.commission_bps` n'est jamais synchronisé avec le plan.**
   Changer `account_plans.plan_code` ne change aucune commission. Aujourd'hui,
   passer en Pro ne met pas la commission à 0.
2. **Aucune notion d'expiration.** `account_plans` n'a pas de date de fin,
   donc pas de downgrade possible.
3. **La règle carte < 25 000 n'est pas exprimable** : `checkout_payment_methods`
   ne reçoit pas le total du panier.

## Schéma proposé

```sql
alter table public.plans
  add column fee_mode text not null default 'absorbed'
    check (fee_mode in ('absorbed', 'pass_through')),
  add column card_min_amount integer not null default 0;

update public.plans set fee_mode = 'absorbed',    card_min_amount = 25000 where code = 'free';
update public.plans set fee_mode = 'pass_through', card_min_amount = 0     where code = 'standard';
update public.plans set fee_mode = 'pass_through', card_min_amount = 0     where code = 'pro';

alter table public.account_plans
  add column started_at timestamptz not null default now(),
  add column expires_at timestamptz;

create table public.plan_payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  plan_code     text not null references public.plans (code),
  amount        integer not null check (amount > 0),
  currency      text not null default 'XOF',
  provider      text not null default 'saspay',
  reference     text unique,              -- id SasPay
  network_code  text,
  redirect_url  text,
  status        text not null default 'pending'
    check (status in ('pending', 'captured', 'failed')),
  period_start  timestamptz,
  period_end    timestamptz,
  created_at    timestamptz not null default now(),
  captured_at   timestamptz
);

-- Boutiques mises en brouillon par un downgrade, pour les réactiver au retour.
create table public.store_plan_suspensions (
  store_id     uuid primary key references public.stores (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  suspended_at timestamptz not null default now(),
  restored_at  timestamptz
);
```

## RPC à écrire

| RPC | Rôle |
|---|---|
| `start_plan_payment(plan_code)` | crée `plan_payments` en `pending`, renvoie id + montant |
| `record_plan_payment_intent(id, reference, network, url)` | stocke l'id SasPay |
| `confirm_plan_payment(reference, amount, currency)` | vérifie le montant, active 30 jours, synchronise les commissions, restaure les boutiques |
| `expire_account_plans()` | downgrade à `free`, commissions à 10 %, boutiques au-delà de 2 en `draft` |
| `apply_plan_to_stores(user_id, plan_code)` | met `commission_bps` et gère les suspensions |

`confirm_plan_payment` est appelée par le **même webhook SasPay** que les
commandes : la route cherche d'abord dans `payments`, puis dans
`plan_payments`.

## Points de décision restants

- **Grâce** : 0 jour (strict) est simple, mais un paiement qui arrive à
  23 h 59 après l'expiration sera perdu. Recommandation : 0 jour pour le
  downgrade, **24 h de tolérance sur le paiement de renouvellement** (si un
  paiement du bon montant arrive dans les 24 h, le plan est rétabli avec la
  date initiale comme base).
- **Frais SasPay** : le mode « frais payés par le client » exige de connaître
  le tarif réel par réseau. Il vient de `GET /pricing/my-rates/` (tiers
  `percent`/`fixed`). À calculer **côté serveur** et à afficher comme ligne
  distincte. Ne jamais laisser le client calculer ce montant.
- **Notification J-7 / J-1 / J+0** : trois gabarits d'e-mail et une table de
  rappels pour ne pas envoyer deux fois. À faire dans le lot notifications.
- **Commission Free** : 10 % sur le sous-total après remise, déjà le calcul
  de `post_online_commission`. Rien à changer si `stores.commission_bps` est
  synchronisé.

## Découpage

1. **PLAN1a** — schéma + `apply_plan_to_stores` + `expire_account_plans`.
2. **PLAN1b** — paiement d'abonnement (RPC + webhook + page upgrade).
3. **PLAN1c** — règles checkout (carte < 25 000, mode de frais).
4. **PLAN1d** — pages `/app/settings/plan` et `/pricing`.
5. **PLAN1e** — notifications J-7 / J-1 / J+0.

## À vérifier avant PLAN1a

Le total du panier doit être passé à `checkout_payment_methods` pour appliquer
la règle carte. Cela change la signature de la RPC : prévoir une surcharge avec
`p_total integer default 0` et mettre à jour `getCheckoutPaymentMethods`.
