# Pashove

Plateforme e-commerce SaaS multi-tenant — **pashove.com**

Créer une boutique, vendre des produits **physiques**, **numériques** et des **services**,
encaisser par mobile money et carte, retirer ses revenus, offrir en cadeau, et distribuer
via un réseau de partenaires.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui
Supabase (Postgres + Auth + RLS) · Vercel · Cloudflare (DNS · R2 · Stream · Turnstile)
Resend (e-mails) · Upstash (Redis) · Termii (SMS) · Smile Identity (KYC)

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev                  # http://localhost:3000
```

## Documentation du programme

Tout le plan de construction est dans `docs/` :

| Fichier | Contenu |
|---|---|
| [00 — Programme maître](docs/00-PROGRAMME-MAITRE.md) | Vue d'ensemble, décisions D1→D14, stack, phases |
| [01 — Comptes et API](docs/01-COMPTES-ET-APIS.md) | Tous les comptes à créer, API, coûts, documents |
| [02 — Catalogue des pages](docs/02-CATALOGUE-PAGES.md) | Toutes les pages + routes |
| [03 — Feuille de route](docs/03-ROADMAP.md) | Construction phase par phase |
| [04 — Décisions](docs/04-DECISIONS.md) | Décisions verrouillées + points à trancher |
| [05 — Setup e-mail](docs/05-SETUP-CLOUDFLARE-EMAIL.md) | E-mails pro + redirection Gmail |
| [06 — Checklist lancement](docs/06-CHECKLIST-LANCEMENT.md) | À cocher avant ouverture publique |

## État actuel

- [x] Projet initialisé (Next.js 16 + TS + Tailwind 4)
- [ ] Comptes créés — voir `docs/01`
- [ ] E-mails pro configurés — voir `docs/05`
- [ ] Phase 1 — Fondations (auth, multi-boutiques, RLS)
