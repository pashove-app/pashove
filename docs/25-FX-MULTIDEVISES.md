# PASHOVE — Conversion FX (FX1/FX2)

> 7 novembre 2026. Les wallets SasPay sont par (marchand, pays) : encaisser au
> Ghana crédite un wallet Ghana en GHS, sans conversion côté SasPay. La
> conversion ne sert qu’à convertir le **prix affiché**.

## Vérifié dans la spec SasPay

- `GET /merchant-balances/` : un wallet par couple marchand × pays, créés
  automatiquement. Un marchand malien aura donc un wallet ML (XOF) et un
  wallet GH (GHS).
- `GET /exchange-rates/` : paires `from_currency` → `to_currency` avec `rate`
  (unités de `to` pour 1 `from`), paginées par 100 maximum.
- `currency_country_mismatch` (422) sur les payouts : la devise doit
  correspondre au pays.

**Non vérifié en live** : l’appel authentifié n’a pas pu être fait (clé locale
invalide). À confirmer avec une clé live : `GET /merchant-balances/` puis un
softpay de 5 GHS au Ghana.

## Moteur (FX1)

`src/lib/fx/rates.ts`

1. `listExchangeRates()` — cache 10 min.
2. Paire directe, sinon paire inverse (`1 / rate`).
3. Repli : `public_fx_rate(from, to)` sur la table `fx_rates` (taux manuel).
4. Sans taux, la conversion renvoie `null` : le marché reste indisponible.

`convertMinor(amount, from, to)` arrondit au plus proche ; Pashove absorbe
l’écart. Le client paie le montant affiché.

`src/lib/fx/currency.ts` : décimales ISO (XOF/XAF/GNF/UGX/RWF = 0, le reste 2).

## Schéma (FX2)

- `orders.payment_currency`, `payment_amount`, `fx_rate`, `fx_rate_at`,
  `fx_source` — taux figé par commande.
- `payments.amount_charged` — montant réellement débité dans la devise du
  marché.
- `fx_rates` — taux manuels de secours.
- `set_order_fx(...)` — écrit le taux figé, service_role uniquement.

### Taux manuel

```sql
insert into public.fx_rates (from_currency, to_currency, rate, source)
values ('XOF', 'GHS', 0.00011000, 'manual')
on conflict (from_currency, to_currency)
do update set rate = excluded.rate, source = 'manual', updated_at = now();
```

## Synchronisation des taux (FX1 corrigé)

L’API renvoie **9 045 paires sur 91 pages**. Le checkout ne les parcourt
jamais : le cron `/api/cron/fx-rates` (protégé par `CRON_SECRET`, toutes les
6 h) les copie dans `fx_rates` avec `source = 'saspay'`. Les taux `manual`
ne sont pas touchés ; les paires disparues sont supprimées.

À ajouter sur cron-job.org :

| URL | Fréquence |
|---|---|
| `https://pashove.com/api/cron/fx-rates` | toutes les 6 h (`13 */6 * * *`) |

## FX3 — checkout

- Chaque marché expose `paymentCurrency`, `paymentAmountMinor`,
  `paymentAmountDecimal`, `fxRate`, `fxSource`.
- Le taux est lu dans `fx_rates` (`public_fx_quote`), jamais l’API.
- Le client voit « Total à payer : X GHS · 1 XOF ≈ Y GHS ».
- `set_order_fx` fige le taux sur la commande avant l’intention SasPay.
- Le paiement à la livraison est limité aux marchés de la devise de la
  boutique ; la carte aussi (SasPay la facture en USD).

## FX4 — confirmation

`confirm_saspay_payment(text, numeric, text)` compare le montant du webhook
à `orders.payment_amount` quand il existe, sinon au total converti dans la
devise de paiement. Le ledger reste en devise de boutique ; Pashove absorbe
l’écart d’arrondi. `payments.amount_charged` garde le montant réellement
débité.

## Limites restantes

- Pas de taux pour `XOF → KES/NGN/GNF/XAF` dans l’API : ces marchés exigent
  un taux manuel dans `fx_rates`.
- La carte SasPay est en USD : masquée hors devise de boutique.
- Les retraits restent par wallet pays (PAY2b).
