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

## Ce qui reste (FX3/FX4)

1. **FX3 — checkout** : marquer un marché d’une autre devise disponible,
   afficher « 1 XOF ≈ X GHS » et le total converti, calculé côté serveur.
2. **FX4 — confirmation** : `confirm_saspay_payment` doit comparer le montant
   du webhook à `orders.payment_amount` (devise du marché) et non au total en
   devise de boutique. Sans cela, tout paiement étranger finit en
   `amount_mismatch`.

Tant que FX4 n’est pas fait, les marchés d’une autre devise restent
volontairement indisponibles au checkout.
