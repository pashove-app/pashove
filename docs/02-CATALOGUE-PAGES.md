# PASHOVE — Catalogue complet des pages

> Toutes les pages sont **responsive mobile-first**. Framework : Next.js App Router.
> Total v1 : **~180 pages**. Total cible (v1+v1.1) : **~260 pages**.

---

## 1. Site vitrine `(public)` — pashove.com

| Route | Page | Ph. |
|---|---|---|
| `/` | Accueil (hero, démo, 3 types produit, paiements, retraits, cadeaux, partenaires, plans, FAQ, CTA) | P2 |
| `/features` | Toutes les fonctionnalités | P2 |
| `/features/store` | Boutique / domaine / thèmes | P2 |
| `/features/products` | Physique / numérique / service | P2 |
| `/features/payments` | Paiements | P2 |
| `/features/checkout` | Checkout | P2 |
| `/features/digital-products` | Produits numériques protégés | P2 |
| `/features/services` | Services / réservation | P2 |
| `/features/gifts` | Cadeaux | P2 |
| `/features/partners` | Partenaires / affiliation | P2 |
| `/features/inventory` | Stock | P2 |
| `/features/analytics` | Analyses | P2 |
| `/features/security` | Sécurité | P2 |
| `/pricing` | Tarifs Free / Standard / Pro | P2 |
| `/themes` | Bibliothèque de thèmes | P2 |
| `/themes/[category]` | Thèmes par catégorie (fashion, food, digital…) | P2 |
| `/themes/[id]` | Détail thème (preview desktop/mobile) | P2 |
| `/payments` | Paiements (overview) | P2 |
| `/payments/methods` · `/local-payments` · `/security` · `/payouts` · `/fees` · `/countries` | Sous-pages paiements | P2 |
| `/security` | Sécurité plateforme | P2 |
| `/help` + `/help/[category]` + `/help/[slug]` | Centre d'aide | P2 |
| `/docs` + `/docs/[section]` | Documentation | P6 |
| `/blog` + `/blog/[slug]` | Blog | P5 |
| `/status` | État de la plateforme | P4 |
| `/legal/cgu` · `/legal/confidentialite` · `/legal/mentions` | Pages légales | P1 |

---

## 2. Authentification `(auth)` — `/auth`

| Route | Page | Ph. |
|---|---|---|
| `/auth/register` | Inscription (prénom, nom, email, tél, pays, mdp, CGU) | P1 |
| `/auth/verify-email` | Vérification email | P1 |
| `/auth/resend-verification` | Renvoyer la vérification | P1 |
| `/auth/login` | Connexion | P1 |
| `/auth/login/2fa` | Saisie 2FA | P1 |
| `/auth/login/recovery` | Code de secours | P1 |
| `/auth/forgot-password` | Mot de passe oublié | P1 |
| `/auth/reset-password` | Réinitialisation | P1 |
| `/auth/2fa/setup` · `/auth/2fa/verify` | Configuration 2FA | P1 |
| `/auth/sessions` | Appareils / sessions actives + révocation | P1 |
| `/auth/account-locked` | Compte verrouillé | P1 |
| `/auth/accept-invitation` | Accepter une invitation d'équipe | P4 |
| `/auth/logout` | Déconnexion | P1 |

---

## 3. Onboarding `(onboarding)` — `/onboarding`

| Route | Page |
|---|---|
| `/onboarding/welcome` | Bienvenue |
| `/onboarding/profile` | Profil (nom, tél, pays, langue, fuseau) |
| `/onboarding/business` | Informations commerciales (optionnel) |
| `/onboarding/store` | Nom, identifiant, sous-domaine, devise, secteur |
| `/onboarding/category` | Catégorie d'activité |
| `/onboarding/products` | Premier produit (ou passer) |
| `/onboarding/countries` | **Pays de vente** (détermine le checkout) |
| `/onboarding/currency` | Devise |
| `/onboarding/payments` | Méthodes (plateforme selon plan) |
| `/onboarding/shipping` | Livraison (si physique) |
| `/onboarding/theme` | Choix du thème |
| `/onboarding/domain` | Sous-domaine / domaine perso |
| `/onboarding/policies` | Politiques |
| `/onboarding/preview` | Aperçu desktop/tablet/mobile |
| `/onboarding/launch` | Checklist + publier |

> Sauvegarde automatique après chaque étape + reprise.

---

## 4. Espace marchand `(app)` — `/app`

### 4.1 Cœur
| Route | Page |
|---|---|
| `/app` → `/app/dashboard` | Tableau de bord (CA, commandes, solde, activité) |
| `/app/stores` + `/app/stores/new` + `/app/stores/[id]/settings` | Multi-boutiques + sélecteur |
| `/app/notifications` | Centre de notifications |
| `/app/help` | Aide |

### 4.2 Commandes — `/app/orders`
`/all` · `/unpaid` · `/paid` · `/processing` · `/unfulfilled` · `/fulfilled` · `/delivered` · `/cancelled` · `/refunded` · `/returns` · `/disputes` · `/abandoned` · `/[orderId]`

Détail commande : infos, client, articles (+ commission & attribution partenaire), paiement, livraison (tracking), digital (entitlement), service (booking), cadeau, partenaire.

### 4.3 Produits — `/app/products`
`/all` · `/new` (choix physique/numérique/service) · `/physical` · `/digital` · `/services` · `/drafts` · `/published` · `/archived` · `/collections` · `/categories` · `/inventory` · `/variants` · `/pricing` · `/files` · `/shared` · `/imports` · `/exports` · `/[productId]`

### 4.4 Clients — `/app/customers`
`/all` · `/segments` · `/accounts` · `/guests` · `/import` · `/[customerId]`

### 4.5 Marketing — `/app/marketing`
`/overview` · `/campaigns` · `/automations` · `/email` · `/sms` · `/abandoned-cart` · `/attribution`

### 4.6 Réductions — `/app/discounts`
`/all` · `/codes` · `/automatic` · `/new` · `/expired`

### 4.7 Boutique en ligne — `/app/online-store`
`/themes` · `/editor` · `/pages` · `/navigation` · `/blog` · `/articles` · `/domains` · `/preferences` · `/seo`

### 4.8 Canaux — `/app/channels`
`/online-store` · `/social` · `/marketplaces` · `/pos` · `/custom`

### 4.9 Partenaires — `/app/partners` *(v1.1)*
`/overview` · `/discover` · `/my-products` · `/shared-products` · `/applications` · `/affiliates` · `/commissions` · `/links` · `/sales` · `/settings`

### 4.10 Cadeaux — `/app/gifts` *(v1.1)*
`/overview` · `/sent` · `/received` · `/settings` · `/templates`

### 4.11 Analyses — `/app/analytics`
`/overview` · `/sales` · `/orders` · `/customers` · `/products` · `/inventory` · `/marketing` · `/partners` · `/digital` · `/services` · `/finance`

### 4.12 Finance — `/app/finance`
`/overview` · `/balance` · `/transactions` · `/fees` · `/commissions` · `/refunds` · `/payouts` · `/statements` · `/invoices`

**Retraits** — `/app/finance/payouts/new`
`/new` → `/select-country` → `/select-method` → `/beneficiary` → `/identity-verification` → `/security-pin` → `/two-factor` → `/review` → `/confirmation`
**Méthodes** — `/app/finance/payout-methods` : `/add` · `/orange-money` · `/wave` · `/bank-account` · `/manage` · `/remove`

### 4.13 Livraison — `/app/shipping`
`/zones` · `/rates` · `/carriers` · `/shipments` · `/returns`

### 4.14 Paramètres — `/app/settings`
`/store` · `/account` · `/billing` · `/plan` · `/payments` · `/payouts` · `/security` · `/domains` · `/shipping` · `/taxes` · `/markets` · `/notifications` · `/policies` · `/languages` · `/currencies` · `/users` · `/permissions` · `/integrations` · `/danger-zone`

### 4.15 Support — `/app/support`
`/home` · `/tickets` · `/tickets/new` · `/messages` · `/help` · `/status`

---

## 5. Boutique publique `(store)` — `/store/[slug]` ou domaine dédié

| Route | Page |
|---|---|
| `/` | Accueil boutique (sections configurables) |
| `/collections` + `/collections/[slug]` | Collections |
| `/categories/[slug]` | Catégories |
| `/products/[slug]` | Produit (galerie, variantes, avis, associés) |
| `/services/[slug]` | Service |
| `/search` | Recherche |
| `/cart` | Panier |
| `/pages/[slug]` | Page standard |
| `/blog` + `/blog/[slug]` | Blog |
| `/about` · `/contact` · `/faq` | Pages |
| `/shipping-policy` · `/returns-policy` · `/privacy-policy` · `/terms` | Politiques |
| `/order-status/[token]` | Suivi commande invité |
| `/404` | Introuvable |

---

## 6. Checkout `(checkout)` — `/checkout`

| Route | Étape |
|---|---|
| `/checkout/[id]` | Vue d'ensemble |
| `/checkout/[id]/country` | Pays (parmi ceux autorisés par le marchand) |
| `/checkout/[id]/contact` | Informations client |
| `/checkout/[id]/delivery` | Livraison / accès / booking |
| `/checkout/[id]/gift` | Option cadeau |
| `/checkout/[id]/payment` | Méthode de paiement (moteur d'éligibilité) |
| `/checkout/[id]/review` | Vérification |
| `/checkout/[id]/processing` | En cours |
| `/checkout/success` · `/checkout/failed` · `/checkout/expired` | Résultats |

---

## 7. Compte client `(account)` — `/account`

`/login` · `/register` · `/verify` · `/profile` · `/orders` · `/orders/[id]` · `/digital` · `/digital/access/[token]` · `/services` · `/services/booking/[token]` · `/gifts` · `/gifts/claim/[token]` · `/addresses` · `/security` · `/logout`

---

## 8. Partenaire `(partner)` — `/partner` *(v1.1)*

`/dashboard` · `/discover` · `/my-listings` · `/links` · `/sales` · `/commissions` · `/settings`

---

## 9. Admin plateforme `(admin)` — `/platform-admin`

| Route | Page |
|---|---|
| `/platform-admin/dashboard` | KPI : GMV, revenus, commissions, marchands actifs, KYC en attente, litiges |
| `/platform-admin/users` | Utilisateurs (recherche, suspendre, reset sécurité) |
| `/platform-admin/merchants` + `/[id]` | Marchands + fiche complète |
| `/platform-admin/stores` | Boutiques (suspendre, domaine, trafic) |
| `/platform-admin/orders` | Commandes globales |
| `/platform-admin/customers` | Clients |
| `/platform-admin/payments` (+ `/transactions` `/failed` `/refunded` `/disputed` `/providers` `/methods`) | Paiements |
| `/platform-admin/payouts` (+ `/pending` `/processing` `/completed` `/failed` `/reversed` `/risk`) | Retraits |
| `/platform-admin/ledger` | Grand livre |
| `/platform-admin/reconciliation` | Rapprochement |
| `/platform-admin/commissions` | Commissions |
| `/platform-admin/kyc` (+ `/queue` `/under-review` `/approved` `/rejected` `/resubmissions` `/audit`) | KYC |
| `/platform-admin/risk` (+ `/alerts` `/transactions` `/payouts` `/merchants` `/customers` `/devices` `/rules`) | Risque |
| `/platform-admin/partners` | Partenaires |
| `/platform-admin/gift-orders` | Cadeaux |
| `/platform-admin/themes` (+ `/official-library` `/drafts` `/reviews` `/published` `/versions`) | Thèmes |
| `/platform-admin/products` | Produits |
| `/platform-admin/subscriptions` (+ `/plans` `/merchants` `/billing` `/changes` `/limits`) | Abonnements |
| `/platform-admin/payment-providers` | Fournisseurs de paiement |
| `/platform-admin/countries` · `/currencies` | Pays / devises |
| `/platform-admin/storage` · `/media` | Stockage / médias |
| `/platform-admin/support` (+ `/inbox` `/tickets` `/escalations` `/sla` `/macros` `/knowledge-base`) | Support |
| `/platform-admin/reports` | Rapports |
| `/platform-admin/audit-logs` | Journal d'audit |
| `/platform-admin/staff` · `/roles-permissions` | Équipe interne |
| `/platform-admin/feature-flags` | Drapeaux de fonctionnalité |
| `/platform-admin/system-health` · `/jobs` · `/webhooks` | Exploitation |
| `/platform-admin/security-incidents` | Incidents sécurité |
| `/platform-admin/emails` | **Boîte e-mail interne** (envoi/réception — voir doc 05) |
| `/platform-admin/settings` | Configuration plateforme |

---

## Priorisation de construction

| Priorité | Pages |
|---|---|
| **P1** | Auth (13) + Onboarding (15) + Légales (3) |
| **P2** | Vitrine (25) + Boutique publique (17) + Checkout (11) + Éditeur thème |
| **P3** | Espace marchand cœur : dashboard, produits, commandes, clients, finance, retraits, paramètres (~60) |
| **P4** | Admin plateforme (~50) + KYC + Support |
| **P5** | Marketing, analyses, cadeaux, partenaires, blog |
| **P6** | Docs, API, POS |
