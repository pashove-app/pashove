# PASHOVE — Notes de projet pour Claude

## Nature du projet
Plateforme e-commerce SaaS multi-tenant (« Commerce OS »). Domaine : pashove.com.
Construite par sessions successives avec l'utilisateur (francophone → répondre en français).

## Documents de référence (à lire avant toute session)
- `docs/00-PROGRAMME-MAITRE.md` — vue d'ensemble + décisions D1→D14
- `docs/01-COMPTES-ET-APIS.md` — comptes à créer, API, coûts
- `docs/02-CATALOGUE-PAGES.md` — toutes les pages + routes
- `docs/03-ROADMAP.md` — phases de construction
- `docs/04-DECISIONS.md` — décisions + points ouverts
- `docs/05-SETUP-CLOUDFLARE-EMAIL.md` — e-mails pro

## Stack (verrouillée)
Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Postgres+Auth+RLS)
Vercel · Cloudflare (DNS, R2, Stream, Turnstile) · Resend · Upstash · Termii · Smile Identity

## Règles absolues
1. **Toutes les pages sont responsive mobile-first.** Non négociable.
2. **Toute donnée marchande porte un `store_id`** et est protégée par **RLS en base**.
   Ne jamais faire confiance à un `store_id` venant du client.
3. **Aucun calcul financier côté client.** Montants, frais, commissions, éligibilité paiement :
   toujours recalculés côté serveur.
4. **Idempotence obligatoire** sur : webhooks paiement, payout, refund, commission, gift claim.
5. **Le ledger est immuable** : jamais d'UPDATE/DELETE. Une correction = écriture compensatoire.
6. **Modèle de fonds = split-on-capture** : la plateforme ne détient jamais l'argent des tiers.
7. Jamais de secret dans le client. `SUPABASE_SERVICE_ROLE_KEY` = serveur uniquement.
8. Fichiers numériques : jamais d'URL publique permanente. Liens signés + expiration.

## Conventions
- Espaces via route groups : `(public) (auth) (onboarding) (app) (store) (checkout) (account) (partner) (admin)`
- Validation systématique des payloads avec Zod
- Un lot de travail testable par session, déployé, testé sur mobile

## Méthode de travail avec l'utilisateur
- Il valide les décisions métier ; je décide de la technique.
- Progression par petits lots testables, commits + déploiements fréquents.
- Toujours signaler ce qui est incertain ou à confirmer.
