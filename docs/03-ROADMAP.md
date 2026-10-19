# PASHOVE — Feuille de route de construction

> Chaque phase produit quelque chose de **testable et déployé**. Jamais de « big bang ».
> Convention : `[x]` fait · `[~]` partiel · `[ ]` à faire
> Dernière mise à jour : **19/10/2026**

---

## Où en est le projet (19/10/2026)

| Bloc | État |
|---|---|
| Socle technique (Next 16, Supabase, RLS, R2, 5 langues, thème) | ✅ livré |
| Authentification (inscription, connexion, vérification, mot de passe oublié, TOTP, sessions, pages sécurité) | ✅ livrée |
| Onboarding marchand (4 étapes : boutique → profil → vente → lancement) | ✅ livré |
| Dashboard marchand (coquille premium, accueil, KPI, palette ⌘K) | ✅ livré |
| Produits (C1 créer/lister, C2 trois types, C3a galerie/prix/livraison, C3b variantes) | 🔄 C3b en validation |
| Vitrine (socle R2, réglages boutique, accueil `/store/[slug]`) | 🔄 en pause, page produit à faire |
| Commandes, clients, finance, marketing, partenaires | ⏳ non commencés |

### Points de vigilance connus

- **Identifiants de variantes** : la mise à jour remplace aujourd'hui les
  variantes (suppression puis réinsertion), donc leurs `id` changent à chaque
  enregistrement. **À corriger avant le module Commandes** : les lignes de
  commande doivent pouvoir référencer une variante stable (et conserver un
  instantané du nom, du SKU et du prix au moment de l'achat).
- **Rate limiting applicatif** : seules les limites natives de Supabase Auth
  s'appliquent ; Upstash + Turnstile restent à brancher avant l'ouverture
  publique.

---

## Séquence de construction validée le 19/10/2026

Après la fin du module Produits :

1. **C4 — Liste avancée des produits** : recherche, onglets Tous / Publiés /
   Brouillons / Rupture, filtre par étiquette, actions en ligne.
2. **Parcours d'achat public** : page produit (galerie, variantes, stock),
   panier, checkout. **Couche de paiement abstraite + paiement à la livraison
   d'abord**, PSP (Flutterwave, CinetPay, PayDunya) ensuite, quand les comptes
   seront validés. Livraison minimale du fichier numérique (lien signé) incluse.
3. **Commandes** : liste et onglets par statut, fiche commande, transitions de
   statut et historique.
4. **Clients** : liste, fiche client, commandes, total dépensé, invités et
   comptes.
5. **Finance** : ledger immuable, soldes, retraits, KYC au premier retrait.
6. **Codes promo** : pourcentage / montant fixe, portée produit / collection /
   boutique, dates, limites d'utilisation.
7. **Marketing** : panier abandonné d'abord, puis campagnes et segments.
8. **Éditeur de thème** : couleurs, polices, sections, versions.
9. **Partenaires / affiliation** : partage de produits entre marchands,
   attribution, commissions, anti-fraude.

> L'éditeur de thème est placé après les modules qui génèrent du revenu : la
> vitrine possède déjà un socle fonctionnel, l'éditeur n'est pas un prérequis
> aux premières ventes.

---

## PHASE 0 — Installation

- [x] Projet Next.js 16 + TS + Tailwind 4 créé (avec groupes de routes)
- [x] Supabase créé et connecté (région eu-west)
- [x] `.env.local` rempli (Supabase, R2)
- [~] Comptes externes : R2 opérationnel ; PSP, Termii, Smile Identity à ouvrir
- [~] E-mails pro : Resend branché pour l'authentification ; boîtes humaines à finaliser
- [ ] `pashove.com` → Vercel (déploiement de production)
- [ ] CI GitHub → déploiement automatique sur Vercel

---

## PHASE 1 — Fondations

### Base de données
- [x] Schéma réel : `profiles`, `stores`, `store_members` (remplace
      `organizations`), produits et médias
- [x] Migrations SQL versionnées + appliquées
- [x] **Politiques RLS** sur toutes les tables (isolation multi-tenant)
- [x] Vérifications d'isolation faites en SQL (lecture et écriture croisées refusées)

### Authentification
- [x] Inscription, connexion, session, rafraîchissement
- [x] Vérification e-mail
- [x] Mot de passe oublié / réinitialisation
- [x] 2FA (TOTP) + codes de secours
- [x] Gestion des sessions actives + révocation
- [x] Gestion des appareils et pages de sécurité
- [ ] Rate limiting applicatif (Upstash) + Turnstile

### Multi-boutiques
- [x] Création de boutique, rôles par boutique (`store_members`)
- [ ] Sélecteur multi-boutiques
- [ ] Table `plans` + `subscriptions` + `plan_entitlements`
- [ ] Limites configurables (nb boutiques, stockage, membres…)

---

## PHASE 2 — Boutique et catalogue

- [x] **Onboarding** : 4 étapes (boutique, profil, vente, lancement) — décision
      revue à la baisse par rapport aux 15 étapes initiales
- [x] Produits **physiques** : trois types, galerie, prix comparé, dimensions,
      pays de livraison, **variantes et stock global**
- [x] Produits **numériques** : champs de base + fichier dans le bucket privé
- [x] **Services** : champs de base (durée, lieu)
- [x] Médias : téléversement R2 (public et privé)
- [~] Storefront public : accueil `/store/[slug]` et réglages ; **page produit,
      panier et checkout à construire**
- [ ] Thèmes officiels gratuits (≥ 6)
- [ ] **Éditeur de thème** : sections, blocs, glisser-déposer, versions —
      planifié après le commerce (voir séquence)
- [ ] Collections + catégories (manuelles + automatiques)
- [ ] Inventaire (mouvements, stock réservé)
- [ ] Domaines : sous-domaine `*.pashove.com` + domaine perso (vérif DNS/SSL)
- [ ] Pages, navigation, SEO, blog

---

## PHASE 3 — Commerce et paiements

- [ ] Page produit publique (galerie, variantes, stock disponible)
- [ ] Panier + checkout (pays → infos → livraison → paiement → revue)
- [ ] **Couche de paiement abstraite** (interface commune aux fournisseurs)
- [ ] **Paiement à la livraison (COD)** — premier moyen encaissable, sans PSP
- [ ] **Moteur d'éligibilité des paiements** :
      `(pays, devise, plan marchand, fournisseurs actifs, type produit, risque) → méthodes`
- [ ] Intégration **Flutterwave** : checkout, sous-comptes, splits, webhooks
- [ ] Intégration **CinetPay** + **PayDunya** : mobile money CFA + webhooks
- [ ] Webhooks signés + **idempotence** (Upstash) — un webhook reçu 3× = 1 seule commande
- [ ] Cycle de commande complet (états, historique, événements)
- [ ] **Identifiants de variantes stables + instantané de ligne de commande**
- [ ] Réservation de stock atomique (pas de survente)
- [ ] Clients : comptes + invités + portail client
- [ ] Livraison : zones, tarifs, transporteurs, tracking

---

## PHASE 4 — Finance, KYC, retraits

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

---

## CHECKPOINT — LANCEMENT PUBLIC (fin Phase 4)

Toutes les cases de `docs/06-CHECKLIST-LANCEMENT.md` doivent être cochées.

---

## PHASE 5 — Extensions

- [ ] **Produits numériques protégés** : limites de téléchargement, filigrane
      individualisé, journalisation, révocation (le lien signé minimal arrive
      dès le checkout)
- [ ] **Vidéos** : Cloudflare Stream, token par session, filigrane dynamique
- [ ] **Services** : calendrier de disponibilités, fuseau, rappels, annulation,
      QR/code de réservation (une date souhaitée simple arrive dès le checkout)
- [ ] **Cadeaux** : achat cadeau, destinataire, message, date d'envoi,
      claim atomique, statuts
- [ ] **Partenaires / affiliation** : reseller + affilié, découverte,
      `PartnerListing`, attribution, commission pending→approved→available,
      anti-fraude, renversement sur remboursement
- [ ] Marketing : campagnes, automatisations, panier abandonné, segments,
      consentements
- [ ] Réductions : codes, automatiques, buy X get Y
- [ ] Analyses avancées + rapports

---

## PHASE 6 — Écosystème

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

À chaque session : **on choisit UN lot testable**, on le construit, on le
déploie, on le teste sur mobile. Jamais deux gros chantiers en parallèle.
Commits fréquents, déploiements fréquents.
