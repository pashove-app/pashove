# PASHOVE — Programme maître de construction

> Plateforme e-commerce SaaS multi-tenant · Domaine : **pashove.com** (acheté chez Cloudflare)
> Version : 1.0 · Dernière mise à jour : 12/10/2026

---

## 0. Ce que l'on construit, en une phrase

Un **« Commerce OS »** : n'importe qui crée une boutique (produits physiques, numériques, services),
reçoit des paiements adaptés à son pays, encaisse, retire son argent, vend en cadeau, et distribue
via un réseau de partenaires — le tout depuis une seule plateforme.

---

## 1. Les 5 réalités qui ont dicté ce programme

Ces faits ont été **vérifiés par recherche**, pas supposés. Ils changent vos décisions initiales.

### 1.1 Stripe est impossible au Mali / Sénégal / Côte d'Ivoire
Stripe n'ouvre pas de compte marchand dans ces pays. Seule l'Afrique du Sud est native.
👉 **Décision** : on **lance sans Stripe**. Flutterwave couvre les cartes internationales.
Stripe devient une **phase 2 optionnelle**, conditionnée à la création d'une entité US
(Stripe Atlas / Doola, ~800 $ la 1re année). À faire **seulement si** vous voulez : taux carte
international moins cher + abonnements récurrents natifs + facturation USD.

### 1.2 Flutterwave est la pièce maîtresse, pas un accessoire
Flutterwave gère **30+ pays**, le **mobile money** (Wave, Orange Money…), les **cartes**, et surtout
les **sous-comptes + split payments** : à l'encaissement, la part plateforme et la part marchand
sont réparties **automatiquement**. C'est exactement le moteur dont un marketplace a besoin.

### 1.3 Le modèle de détention des fonds est LA décision structurante
Deux modèles possibles pour l'argent :

| | Modèle A — Split (recommandé v1) | Modèle B — Encaissement central |
|---|---|---|
| Qui encaisse | Le PSP encaisse et **répartit** | La plateforme encaisse **tout** |
| Qui détient les fonds | Le PSP (jamais nous) | **La plateforme** |
| Retrait marchand | Payout depuis le sous-compte | On reverse depuis notre solde |
| Légal | Simple, pas d'agrément | ⚠️ Détention de fonds pour tiers → **agrément EMI / partenariat régulé** |

👉 **Décision : Modèle A au lancement.** Le « ledger » et le « solde marchand » décrits dans
votre architecture restent **identiques** — on modélise les mouvements de la même façon. On ne
touche simplement jamais à l'argent réel nous-mêmes. On pourra migrer vers B plus tard si le
volume le justifie, sans réécrire le modèle de données.

### 1.4 Cloudflare ne peut pas héberger d'e-mail
**Email Routing = réception seule.** Il redirige `contact@pashove.com` → votre Gmail, mais :
- ne crée **aucune boîte** (rien n'est stocké) ;
- ne peut **pas envoyer** ;
- **entre en conflit** avec un vrai hébergeur mail (les deux veulent les MX).

👉 **Décision** : deux services distincts, deux rôles distincts (voir §3.6).

### 1.5 Le KYC marchand n'est pas un blocage au démarrage
On peut créer compte + boutique + produits + vendre **sans KYC**. Le KYC se déclenche **au premier
retrait**. C'est le bon design : il maximise l'activation, et il est conforme.

---

## 2. Décisions verrouillées (D1 → D14)

| # | Décision | Valeur retenue | Réversible ? |
|---|---|---|---|
| D1 | Stack front/back | **Next.js 16 (App Router) + TypeScript** | Non (fondation) |
| D2 | UI | **Tailwind CSS v4 + shadcn/ui** | Oui |
| D3 | Backend / BDD | **Supabase** (Postgres + Auth + RLS) | Difficilement |
| D4 | Hébergement | **Vercel** (app + API) | Oui |
| D5 | DNS / edge | **Cloudflare** (zone pashove.com) | Oui |
| D6 | Devise primaire | **XOF (FCFA)** + EUR/USD | Oui |
| D7 | Pays de lancement (v1) | **SN, CI, ML, BF, BJ, TG** (UEMOA) | Oui |
| D8 | Paiements v1 | **Flutterwave** (socle) + **CinetPay** + **PayDunya** | Oui |
| D9 | Stripe | **Reporté phase 2** (si entité US) | Oui |
| D10 | Modèle de fonds | **Split-on-capture** (Modèle A) | Difficilement |
| D11 | Emails | **Brevo** (transactionnel) + **Zoho Mail** (boîtes humaines) | Oui |
| D12 | Médias | **Cloudflare R2** (objets) + **Cloudflare Stream** (vidéo) | Oui |
| D13 | KYC / identité | **Smile Identity** + revue manuelle admin v1 | Oui |
| D14 | Mobile | **Responsive mobile-first + PWA** (app native = v2) | Oui |

> Les décisions marquées « Non / Difficilement » sont celles à confirmer **avant** d'écrire le schéma SQL.

---

## 3. Stack technique cible

### 3.1 Front-end
- **Next.js 16.4** (App Router, React Server Components)
- **TypeScript** strict
- **Tailwind CSS v4**
- **shadcn/ui** (composants accessibles, thémables par boutique)
- **next-intl** (FR d'abord, EN ensuite)
- **Toutes les pages responsive mobile-first** (contrainte non négociable)

### 3.2 Back-end applicatif
- **Route Handlers** Next.js (`/api/*`) pour l'API interne
- **Server Actions** pour les mutations
- **Supabase** : Postgres + Auth + RLS + Storage (métadonnées uniquement)
- **Drizzle ORM** (typage + migrations) — ou SQL brut Supabase, au choix
- **Zod** : validation de tous les payloads
- **Upstash Redis** : rate limiting, files d'attente légères, idempotence

### 3.3 Découpage des espaces (route groups Next.js)

```
src/app/
├── (public)/        → site vitrine pashove.com
├── (auth)/          → /auth/*
├── (onboarding)/    → /onboarding/*
├── (app)/           → /app/*        espace marchand
├── (store)/         → /store/*      boutique publique
├── (checkout)/      → /checkout/*   checkout
├── (account)/       → /account/*    compte client
├── (partner)/       → /partner/*    affiliés / revendeurs
├── (admin)/         → /platform-admin/*
└── api/             → API interne + webhooks
```

### 3.4 Services externes

| Rôle | Service retenu | Coût v1 |
|---|---|---|
| Paiement (socle) | Flutterwave | %/transaction |
| Paiement mobile money CFA | CinetPay + PayDunya | %/transaction |
| Cartes internationales (phase 2) | Stripe (si entité US) | — |
| E-mail transactionnel | Brevo | Gratuit (300/jour) |
| Boîtes humaines | Zoho Mail | Gratuit (5 boîtes) |
| DNS / Edge | Cloudflare | Gratuit |
| Stockage fichiers | Cloudflare R2 | ~0,015 $/Go |
| Vidéo protégée | Cloudflare Stream | à l'usage |
| BDD + Auth | Supabase | Gratuit → 25 $/mois |
| Hébergement app | Vercel | Gratuit → 20 $/mois |
| SMS / OTP | Termii (ou Africa's Talking) | à l'usage |
| KYC / liveness | Smile Identity | à l'usage |
| Monitoring erreurs | Sentry | Gratuit |
| Anti-bot / captcha | Cloudflare Turnstile | Gratuit |
| Analytics produit | PostHog (optionnel) | Gratuit |

**Budget v1 réaliste : ~0 F/mois** jusqu'à la traction (tout en gratuit), puis **~45 $/mois**
(Vercel Pro + Supabase Pro) à l'échelle.

---

## 4. Les 6 phases de construction

| Phase | Contenu | Priorité |
|---|---|---|
| **P1 — Fondations** | Auth, users, orgs, multi-boutiques, rôles, RLS, settings | P0 |
| **P2 — Boutique** | Onboarding, thèmes gratuits, éditeur, produits (3 types), domaines, publication | P0 |
| **P3 — Commerce** | Panier, checkout, pays, paiements, commandes, clients | P0 |
| **P4 — Finance & lancement** | Ledger, commissions, soldes, retraits, KYC, audit, monitoring, support | P0 |
| **P5 — Extensions** | Numérique protégé, services/booking, cadeaux, partenaires, marketing | P1 |
| **P6 — Écosystème** | API publique, POS, webhooks marchands, internationalisation | P2 |

Détail complet des tâches : `docs/03-ROADMAP.md`.

---

## 5. Documents du programme

| Fichier | Contenu |
|---|---|
| `docs/01-COMPTES-ET-APIS.md` | **Tous les comptes à créer**, dans l'ordre, avec les API, les coûts, les documents requis |
| `docs/02-CATALOGUE-PAGES.md` | **Toutes les pages** de la plateforme, par espace, avec routes |
| `docs/03-ROADMAP.md` | Plan de construction phase par phase, jusqu'au lancement |
| `docs/04-DECISIONS.md` | Décisions verrouillées + points à trancher |
| `docs/05-SETUP-CLOUDFLARE-EMAIL.md` | **À faire maintenant** : e-mails pro + redirection Gmail |
| `.env.example` | Toutes les variables d'environnement à remplir |

---

## 6. Prochaine action immédiate

**Créer les comptes dans l'ordre du fichier `01-COMPTES-ET-APIS.md`.**
Le premier bloc (Cloudflare + e-mails) se fait **maintenant**, en ~20 min, et ne dépend d'aucun autre compte.
