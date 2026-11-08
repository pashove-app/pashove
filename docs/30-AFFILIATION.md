# PASHOVE — P2b : affiliation par lien

> 7 novembre 2026.

## Parcours

1. L'affilié ouvre `/app/partners`, trouve une offre et clique
   « Générer mon lien ».
2. `create_affiliate_link` crée un code de 10 caractères (`affiliate_links`),
   unique par couple (offre, boutique affiliée).
3. Le lien est `https://pashove.com/fr/store/<boutique-source>?ref=CODE`.
4. Le proxy pose le cookie `pashove_ref` (30 jours, httpOnly, SameSite Lax).
5. Au checkout, `attach_affiliate(order_token, code)` vérifie :
   - lien actif, offre active ;
   - la commande appartient bien à la boutique source ;
   - le produit de l'offre est dans la commande ;
   - l'affilié n'est pas le propriétaire.
6. Il écrit `affiliate_link_id`, `affiliate_store_id` et
   `affiliate_commission` (line_total × commission_bps / 10000).
7. Quand la commande passe à `paid`, le trigger `orders_affiliate_commission`
   appelle `post_affiliate_commission` :
   - boutique propriétaire : `available` crédité (le solde diminue) et
     `affiliate_commission` débité ;
   - boutique affiliée : `available` débité (le solde augmente) et
     `affiliate_income` crédité.

Chaque écriture est idempotente (`affiliate-owner:<order>`,
`affiliate-income:<order>`).

## Où l'affilié voit son argent

Sa commission tombe sur le ledger de **sa propre boutique**, comme un revenu
marchand. Elle apparaît dans `/app/finance`, et le retrait passe par
`/app/finance/payouts` avec le KYC et le PIN existants. Aucune boutique
spéciale n'est créée.

## Comptes de ledger ajoutés

- `affiliate_commission` (côté propriétaire, contrepartie de la baisse de
  `available`) ;
- `affiliate_income` (côté affilié).

## Interface

- Bouton « Générer mon lien » sur chaque offre.
- Bandeau avec le lien et un bouton de copie.
- Section « Mes liens d'affiliation » : code, ventes payées, commission gagnée.

## Limites V1

- **Devise** : la commission est écrite dans la devise de la commande. Si la
  boutique de l'affilié est dans une autre devise, un compte multi-devises est
  créé ; les retraits restent par devise de boutique. À traiter avec le
  multi-devises des payouts.
- **Remboursement** : la commission n'est pas encore annulée par une écriture
  compensatoire quand la commande est remboursée.
- **Clics** : pas de compteur de clics pour l'instant, seules les ventes
  payées sont suivies.
- **Cumul** : une commande ne peut avoir qu'un seul affilié (dernier lien
  attaché avant paiement).

## Test

```sql
select code, affiliate_store_id, offer_id from public.affiliate_links;
select number, affiliate_link_id, affiliate_store_id, affiliate_commission
from public.orders where affiliate_link_id is not null;
select * from public.ledger_transactions
where idempotency_key like 'affiliate-%' order by occurred_at desc;
```
