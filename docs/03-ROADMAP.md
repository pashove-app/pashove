# PASHOVE — Feuille de route de construction

> Chaque phase produit quelque chose de **testable et déployé**. Jamais de « big bang ».
> Convention : `[ ]` à faire · `[x]` fait

---

## PHASE 0 — Installation (cette semaine)

- [x] Projet Next.js 16 + TS + Tailwind 4 créé (avec-groupe de routes)
- [ ] Comptes créés (voir `01-COMPTES-ET-APIS.md`)
- [ ] E-mails pro configurés (voir `05-SETUP-CLOUDFLARE-EMAIL.md`)
- [ ] `pashove.com` → Vercel (déploiement « Hello World »)
- [ ] Supabase créé (région eu-west) + connexion
- [ ] `.env.local` rempli depuis `.env.example`
- [ ] CI GitHub → déploiement automatique sur Vercel

**Livrable** : pashove.com en ligne, e-mails qui répondent.

---

## PHASE 1 — Fondations (P0)

> Sans ça, rien d'autre n'est sécurisé.

### Base de données
- [ ] Schéma : `users`, `profiles`, `organizations`, `organization_members`, `roles`, `permissions`
- [ ] Migrations Drizzle (ou SQL Supabase versionné)
- [ ] **Politiques RLS** sur toutes les tables (isolation multi-tenant)
- [ ] Tests automatisés : un marchand **ne peut pas** lire les données d'un autre

### Authentification
- [ ] Supabase Auth : inscription, connexion, session, refresh
- [ ] Vérification e-mail (Resend)
- [ ] Mot de passe oublié / réinitialisation
- [ ] 2FA (TOTP) + codes de secours
- [ ] Gestion des sessions actives + révocation
- [ ] Rate limiting (Upstash) + Turnstile

### Multi-boutiques
- [ ] Création de boutique, sélecteur, rôles par boutique
- [ ] Table `plans` + `subscriptions` + `plan_entitlements`
- [ ] Limites configurables (nb boutiques, stockage, membres…)

**Livrable** : on peut créer un compte, se connecter, créer une boutique vide.

---

## PHASE 2 — Boutique et catalogue (P0)

- [ ] Onboarding complet (15 étapes, sauvegarde auto, reprise)
- [ ] Thèmes officiels gratuits (≥ 6 : fashion, food, digital, services, minimal, creator)
- [ ] **Éditeur de thème** : sections, blocs, glisser-déposer, desktop/mobile, versions/restauration
- [ ] Storefront public rendu depuis le thème
- [ ] Produits **physiques** (variantes, stock, SKU, SEO, médias)
- [ ] Produits **numériques** (upload R2, versions, aperçu)
- [ ] **Services** (disponibilités, fuseau, réservation)
- [ ] Collections + catégories (manuelles + automatiques)
- [ ] Inventaire (stock, réservé, mouvements)
- [ ] Domaines : sous-domaine `*.pashove.com` + domaine perso (vérif DNS/SSL)
- [ ] Pages, navigation, SEO, blog

**Livrable** : un marchand publie une boutique complète avec produit, thème, domaine.

---

## PHASE 3 — Commerce et paiements (P0)

- [ ] Panier + checkout (étapes pays → infos → livraison → paiement → revue)
- [ ] **Moteur d'éligibilité des paiements** :
  `(pays, devise, plan marchand, fournisseurs actifs, type produit, risque) → méthodes`
- [ ] Intégration **Flutterwave** : checkout, sous-comptes, splits, webhooks
- [ ] Intégration **CinetPay** + **PayDunya** : mobile money CFA + webhooks
- [ ] Webhooks signés + **idempotence** (Upstash) — un webhook reçu 3× = 1 seule commande
- [ ] Cycle de commande complet (états, historique, événements)
- [ ] Réservation de stock atomique (pas de survente)
- [ ] Clients : comptes + invités + portail client
- [ ] Livraison : zones, tarifs, transporteurs, tracking

**Livrable** : un client achète réellement, le paiement est réparti, la commande existe.

---

## PHASE 4 — Finance, KYC, retraits (P0)

- [ ] **Ledger immuable** : `ledger_accounts`, `ledger_transactions`, `ledger_entries`
- [ ] Écritures immuables (correction = écriture compensatoire, jamais de suppression)
- [ ] Soldes : pending / available / reserved + explication par mouvement
- [ ] Commissions (plan : 10 % / 2 % / 0 %) + frais PSP
- [ ] Remboursements partiels/totaux + ajustements
- [ ] **Retraits** : demande, pays, méthode, bénéficiaire, PIN 4 chiffres, 2FA
- [ ] **KYC au 1er retrait** : Smile Identity (capture en direct + liveness) + file de revue admin
- [ ] États KYC (NOT_STARTED → … → EXPIRED) + resoumission
- [ ] États payout (REQUESTED → … → REVERSED)
- [ ] Réconciliation quotidienne
- [ ] Audit log (qui, quoi, quand, avant, après)
- [ ] Monitoring (Sentry) + alertes + status page
- [ ] Sauvegardes testées (restauration vérifiée)
- [ ] Support : tickets, escalades, macros

**Livrable** : l'argent est traçable de bout en bout, un marchand retire après KYC.

---

## CHECKPOINT — LANCEMENT PUBLIC (fin Phase 4)

Toutes les cases de `docs/06-CHECKLIST-LANCEMENT.md` doivent être cochées.

---

## PHASE 5 — Extensions (P1)

- [ ] **Produits numériques protégés** : liens signés, limites de téléchargement,
      filigrane individualisé (n° commande + ID pseudonymisé), journalisation, révocation
- [ ] **Vidéos** : Cloudflare Stream, token par session, filigrane dynamique
- [ ] **Services** : booking complet, rappels, annulation, QR/code de réservation
- [ ] **Cadeaux** : achat cadeau, destinataire, message, date d'envoi, claim atomique (pas de double réclamation), statuts
- [ ] **Partenaires / affiliation** : offre de partage, découverte, `PartnerListing`,
      attribution, commission pending→approved→available, anti-fraude, renversement sur remboursement
- [ ] Marketing : campagnes, automatisations, panier abandonné, segments, consentements
- [ ] Réductions : codes, automatiques, buy X get Y
- [ ] Analyses avancées + rapports

---

## PHASE 6 — Écosystème (P2)

- [ ] API publique + clés + quotas
- [ ] Webhooks marchands (événements documentés)
- [ ] OAuth / apps
- [ ] POS
- [ ] Internationalisation complète (EN, devises, formats)
- [ ] App mobile native

---

## Jalons de temps (estimation, non contractuelle)

| Jalon | Durée estimée |
|---|---|
| Phase 0 | 3–5 jours |
| Phase 1 | 4–6 semaines |
| Phase 2 | 6–8 semaines |
| Phase 3 | 6–8 semaines |
| Phase 4 | 4–6 semaines |
| **Lancement v1** | **~5–7 mois** |
| Phase 5 | 2–3 mois |
| Phase 6 | 3 mois+ |

> Rythme réel = fonction du temps que vous y consacrez à deux (vous + moi).

---

## Principe de progression

À chaque session : **on choisit UN lot testable**, on le construit, on le déploie, on le teste sur mobile.
Jamais deux gros chantiers en parallèle. Commits fréquents, déploiements fréquents.
