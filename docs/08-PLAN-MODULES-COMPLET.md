# PASHOVE — Plan de construction module par module

> Complète `docs/07-AUDIT-ET-PLAN-COMPLET.md`.
> Chaque module décrit : état actuel, pages, données, flux, dépendances,
> critères d'acceptation et effort indicatif.
> Légende : ✅ livré · 🟡 partiel · 🔴 à construire.

---

## 0. Règles du plan

- Un module = plusieurs lots testables, chacun déployé et vérifié sur mobile.
- Toute donnée marchande porte `store_id` et une politique RLS.
- Aucun calcul financier dans le navigateur.
- Idempotence sur paiement, retrait, remboursement, commission, cadeau, partenaire.
- Le ledger reste immuable ; les corrections sont des écritures compensatoires.
- Les modules dépendants ne démarrent pas avant leurs fondations.

---

## 1. Socle : multi-boutiques, équipe, rôles, plans — ✅ livré (V1, 25/10/2026)

### Pourquoi c'est la première brique

Tout le reste (partenaires, thèmes, domaines, finances) doit être **rattaché à
une boutique précise**. Aujourd'hui l'interface suppose une seule boutique.

### Pages

- `/app/stores` : liste des boutiques du compte, statut, plan, accès.
- `/app/stores/new` : création (nom, slug, pays, devise, langue).
- Sélecteur de boutique dans la sidebar (mémorisé).
- `/app/settings/users` : membres, invitations, rôles.
- `/app/settings/roles` : matrice de permissions.
- `/app/settings/plan` : plan actuel, limites, upgrade.
- `/app/settings/billing` : historique de facturation.

### Données

- `stores` (existe), `store_members` (existe, rôle simple).
- `plans`, `plan_limits`, `subscriptions`, `billing_events`.
- `store_invitations`, `roles`, `permissions`, `role_permissions`.
- `stores.plan_id` + `commission_bps` appliqué par plan.

### Flux

1. Un compte crée une 2e boutique → limite du plan vérifiée côté serveur.
2. Invitation par e-mail → acceptation → rôle appliqué.
3. Changement de plan → nouveau taux de commission pour les **ventes futures**
   (le passé garde son taux).
4. Rétrogradation → données conservées, fonctionnalités limitées, jamais de
   suppression immédiate.

### Critères d'acceptation

- Un utilisateur Free possède au maximum 2 boutiques (limite côté serveur).
- Un membre `Product Manager` ne peut pas accéder à la finance.
- Toutes les requêtes restent filtrées par la boutique active.

**Effort** : 2 semaines.

---

## 2. Site public Pashove — 🔴

### Pages (blueprint §3–21, docs/02 §1)

- `/` accueil : hero, 3 types de produits, paiements, retraits, cadeaux,
  partenaires, plans, témoignages, FAQ, CTA.
- `/features` + `/features/store`, `products`, `orders`, `payments`, `checkout`,
  `customers`, `marketing`, `analytics`, `digital-products`, `services`,
  `gifts`, `partners`, `shipping`, `inventory`, `domains`, `themes`, `mobile`,
  `security`.
- `/pricing` : Free 0 / Standard 25 000 / Pro 45 000, commissions 10 / 2 / 0 %.
- `/themes` + catégories + `/themes/[id]` : bibliothèque gratuite, previews.
- `/payments` + `overview`, `methods`, `local-payments`, `security`, `payouts`,
  `fees`, `countries`.
- `/help` + catégories et articles.
- `/docs` + sections.
- `/status`.
- `/legal/*`.
- `/blog` (plus tard, P1).

### Données

- Contenu éditorial versionné (fichiers MDX ou table `site_content`).
- Aucune donnée marchande.

### Critères

- 5 langues + RTL, responsive, SEO/OG, sitemap.
- Un prospect peut s'inscrire depuis chaque CTA.
- Le site est **vérifiable par Flutterwave** (mentionné dans docs/01).

**Effort** : 2 semaines.

---

## 3. Onboarding complet — 🟡 (4 étapes sur 15)

### Pages

`/onboarding/welcome`, `profile`, `business`, `store`, `category`, `products`,
`countries`, `currency`, `payments`, `shipping`, `theme`, `domain`, `policies`,
`preview`, `launch`.

### Données

- `stores` : pays, devise, langue, secteur, statut de publication.
- `store_markets` : pays de vente.
- `store_settings` : thème, domaine, politique.
- Progression `onboarding_progress` (reprise automatique).

### Flux

- Chaque étape enregistre un brouillon ; retour possible.
- `countries` détermine le checkout.
- `payments` dépend du plan (Free = paiement plateforme uniquement).
- `theme`, `domain`, `policies` préparent la publication.
- `preview` : desktop/tablette/mobile.
- `launch` : checklist + publication.

**Effort** : 2 semaines.

---

## 4. Thèmes, éditeur, pages, navigation, domaines, SEO — 🔴

### Pages marchand

- `/app/online-store/themes` : bibliothèque (tous gratuits), installation.
- `/app/online-store/editor` : sections, blocs, aperçu, versions.
- `/app/online-store/pages` : pages standard.
- `/app/online-store/navigation` : menus.
- `/app/online-store/blog` + articles.
- `/app/settings/domains` : sous-domaine, domaine perso, DNS/SSL.
- `/app/online-store/seo` : title, description, canonical, sitemap, OG.

### Données

- `themes`, `theme_versions`, `theme_settings`, `theme_sections`.
- `store_pages`, `store_menus`, `store_domains`.
- Le thème est **déclaratif** (sections/blocs), jamais du code arbitraire
  exécuté côté serveur.

### Storefront

- Le layout de la boutique lit le thème installé.
- Les pages critiques du checkout restent contrôlées par la plateforme.
- Domaines : `slug.pashove.com` puis domaine personnalisé.

**Effort** : 4 semaines.

---

## 5. Produits, inventaire, collections — 🟡

### Déjà livré

Produits physiques/numériques/services, variantes, galerie, stock, pays de
livraison, collections manuelles, paquets.

### À compléter

- `product_files` (numérique), poids/dimensions, coût, code-barres.
- Inventaire : mouvements, ajustements, historique, seuils d'alerte.
- Collections automatiques (règles tag/prix/stock/type).
- Catégories.
- Import/export CSV.
- Historique des prix.
- SEO produit (déjà partiellement).

**Effort** : 2 semaines.

---

## 6. Produits numériques protégés — ✅ V1 livrée le 26/10/2026

### Objectif

Vendre un PDF/EPUB/ZIP/audio/vidéo sans jamais exposer une URL publique.

### Pages marchand

- `/app/products/new/digital` : fichier, version, taille, couverture, aperçu.
- `/app/content/files` : médiathèque privée (images, PDF, audio, vidéo).
- `/app/products/[id]` : onglet numérique (fichiers, limites, watermark).

### Pages client

- `/account/digital` : mes achats numériques.
- `/digital/access/[token]` : accès sécurisé après paiement.
- `/checkout/success` : lien vers l'accès.

### Données

- `product_files` : asset, version, hash, taille, type.
- `digital_entitlements` : client/commande/ligne/fichier, statut, expiration.
- `download_grants` : token, expiration, nombre max.
- `download_events` : IP, appareil, date, résultat.
- `watermark_jobs` : statut, fichier généré.

### Flux

1. Paiement confirmé → entitlement créé.
2. Le client ouvre `/account/digital` ou le lien e-mail.
3. Le serveur vérifie entitlement + risque → URL signée courte (R2 privé).
4. Téléchargement journalisé ; limite respectée.
5. Remboursement → entitlement révoqué, liens invalidés.
6. PDF : filigrane numéro de commande + e-mail pseudonymisé.
7. Vidéo : Cloudflare Stream + token signé.

### Critères

- Un client ne peut pas accéder au fichier d'un autre.
- Un lien expiré ou révoqué ne fonctionne plus.
- Le quota de téléchargements est appliqué côté serveur.

**Effort** : 3 semaines.

---

## 7. Services et réservation — ✅ V1 livrée le 26/10/2026

### Objectif

Vendre une consultation, une formation ou une prestation avec créneau.

### Pages marchand

- `/app/services` : liste, disponibilités, réservations.
- `/app/services/[id]` : durée, fuseau, lieu/visio, règles d'annulation.
- `/app/services/bookings` : à venir, passées, annulées.

### Pages client

- `/store/[slug]/services/[slug]` : présentation + calendrier.
- `/checkout` : choix du créneau.
- `/account/services` : mes réservations.
- `/service/booking/[token]` : confirmation, QR/code.

### Données

- `services`, `service_availability`, `service_blackouts`.
- `bookings` : créneau, fuseau, statut, token, client.
- `booking_events` : confirmation, rappel, annulation.

### Flux

1. Le client choisit un créneau disponible.
2. Le serveur verrouille le créneau et crée la réservation.
3. Paiement (COD ou en ligne selon la configuration).
4. Confirmation e-mail + rappel.
5. Annulation → créneau libéré.
6. Le prestataire vérifie le code/QR.

**Effort** : 3 semaines.

---

## 8. Comptes clients — ✅ V1 livrée le 26/10/2026

### Pages

`/account/login`, `register`, `verify`, `profile`, `orders`, `orders/[id]`,
`digital`, `services`, `gifts`, `addresses`, `security`, `logout`.

### Données

- `customers` (compte lié à `auth.users`, distinct du client invité).
- `customer_addresses`.
- Liaison commandes invité → compte à la création (par e-mail vérifié).

### Flux

- Achat invité possible ; après paiement, lien sécurisé de suivi.
- Création de compte → récupération des commandes liées à l'e-mail vérifié.
- Le client voit : commandes, téléchargements, réservations, cadeaux, adresses.
- Aucun accès aux données d'une autre boutique.

### Décision

Un compte client est **global** (un seul login) mais chaque commande reste
rattachée à sa boutique. Les boutiques ne voient que leurs propres clients.

**Effort** : 2 semaines (après digital/services pour les onglets).

### V1 livrée le 26/10/2026

- Pages `/store/[slug]/account/login`, `register`, tableau de bord, commandes,
  détail de commande, téléchargements, rendez-vous.
- Les commandes invitées sont rattachées au compte par l'e-mail, à la
  connexion et à l'ouverture de l'espace client.
- Téléchargements : droit créé à l'encaissement, 3 téléchargements maximum,
  lien R2 signé 15 minutes, compteur incrémenté côté serveur, révocation au
  remboursement, accès refusé à tout autre client.
- Services : créneaux du lundi au samedi, 9 h–17 h (Africa/Abidjan), sur
  14 jours ; créneau enregistré dans la commande et rendez-vous créé à
  l'encaissement.
- **Décision temporaire** : le COD accepte aussi les produits numériques et les
  services, faute de paiement en ligne. À restreindre quand le PSP sera branché.
- L'envoi d'e-mails de confirmation dépend de la configuration SMTP Supabase /
  Brevo.

---

## 9. Cadeaux — 🔴

### Pages marchand

`/app/gifts` : envoyés, reçus, configuration, modèles de message.

### Checkout

Option « Acheter comme cadeau » : destinataire, e-mail/téléphone, message,
date d'envoi.

### Pages client

`/account/gifts`, `/gifts/claim/[token]`.

### Données

- `gift_orders`, `gift_recipients`, `gift_claims`, `gift_messages`.
- Statuts : créé, payé, programmé, envoyé, livré, réclamé, expiré, annulé.

### Règles

- Cadeau numérique : entitlement attribué au **destinataire**, pas à l'acheteur.
- Réclamation atomique : un token = une seule réclamation.
- Cadeau physique : adresse du destinataire, suivi visible par l'acheteur.
- Cadeau service : bon/code de réservation.

**Effort** : 2 semaines.

---

## 10. Partenaires et affiliation — ✅ V1 livrée le 25/10/2026

### Objectif exact

Un marchand A autorise un produit au partage avec une commission (ex. 5 %).
Un marchand B voit ce produit dans son espace Partenaires, l'ajoute à sa
boutique, le vend, et perçoit sa commission. A reste propriétaire du produit,
du stock et du fulfillment.

### Pages marchand propriétaire (A)

- `/app/products/[id]` : interrupteur « Autoriser les partenaires ».
- Réglages : commission 1 %, 2 %, 5 % ou personnalisée ; pays ; dates ;
  nombre max de partenaires ; approbation automatique ou manuelle.
- `/app/partners/my-products` : produits partagés, partenaires, ventes.
- `/app/partners/commissions` : commissions à payer/reçues.

### Pages marchand partenaire (B)

- `/app/partners/discover` : catalogue des produits partageables (prix,
  commission, catégorie, vendeur, pays, conditions).
- `/app/partners/shared-products` : produits ajoutés à sa boutique.
- `/app/partners/sales` : ventes attribuées.
- `/app/partners/links` : liens/identifiants d'attribution.
- `/app/partners/settings` : préférences.

### Storefront

- Le produit partenaire apparaît dans la boutique B comme un produit normal.
- La fiche mentionne le vendeur/fournisseur selon les règles légales.
- Le panier et la commande conservent : `source_product_id`,
  `partner_store_id`, `partner_listing_id`, `attribution_id`.

### Données

- `partner_offers` : produit source, commission, pays, dates, règles.
- `partner_listings` : boutique partenaire, produit source, prix autorisé,
  statut, personnalisation.
- `partner_links` / `attributions`.
- `partner_sales` : commande, listing, montants.
- `partner_commissions` : pending → approved → available → paid / reversed.

### Flux de vente

1. Client achète chez B.
2. Le moteur identifie le listing et l'offre source.
3. Le stock est celui de A (ou réservé chez A).
4. Le ledger calcule : revenu A, commission B, commission Pashove, frais PSP.
5. La commission B reste `pending` pendant la fenêtre de remboursement.
6. Commande confirmée → `approved` → `available`.
7. Remboursement → `reversed`.

### Fulfillment

- A possède le stock et expédie (ou fournit le numérique/service).
- B est le vendeur commercial ; la commande indique les informations légales.
- Les litiges remontent à A, avec B en copie.

### Anti-fraude

- Auto-attribution interdite (A ne peut pas acheter via son propre listing).
- Multi-comptes, clics artificiels, remboursements abusifs.
- Commissions bloquées jusqu'à validation.

### Admin

- `/platform-admin/partners` : offres, listings, ventes, commissions, litiges.

### Dépendances

Multi-boutiques + commandes + ledger + paiements (ou COD). Ne peut pas être
construit avant le socle multi-boutiques.

**Effort** : 4 semaines.

### V1 livrée le 25/10/2026

- Sélecteur de boutique, création (limite Free = 2, vérifiée en base),
  invitations admin / gestionnaire de produits (lien copiable ; envoi e-mail
  à brancher avec Brevo).
- Offre de partage sur un produit (1 à 50 %), découverte, ajout d'une copie
  contrôlée dans la boutique partenaire.
- **Limites V1** : produits physiques sans variantes uniquement ; pas de
  partage en chaîne ; commission partenaire `pending` (virements plus tard) ;
  le prix est recopié à l'ajout (pas encore de synchronisation).
- Ledger : reclassement chez B, revenu source et commission Pashove chez A,
  remboursement partenaire testé en base.

---

## 11. Commandes, fulfillment, retours, litiges — 🟡

### Déjà livré

Liste, filtres, détail, statuts, confirmation, préparation, expédition,
livraison, annulation, remboursement.

### À compléter

- Statuts `fulfilled`, `partially_fulfilled`, `completed`, `disputed`.
- Retours et remboursements partiels.
- Litiges et preuves.
- Commandes abandonnées.
- Historique de statut avec acteur/motif.
- Attribution partenaire et commission par ligne.
- Entitlement/booking/cadeau dans le détail.

**Effort** : 2 semaines.

---

## 12. Paiements en ligne — 🔴 (bloquant commercial)

### Prérequis externes

Compte Flutterwave (priorité), entité légale, compte bancaire, site public.

### Pages

- Checkout : étape pays → méthodes disponibles → paiement.
- `/checkout/processing`, `/checkout/failed`, `/checkout/expired`.
- Admin : `/platform-admin/payment-providers`, `/platform-admin/payments`.

### Données

- `payment_providers`, `payment_methods`, `payment_countries`.
- `payment_attempts`, `payment_events`, `webhook_events`.
- `orders.payment_status` étendu.

### Flux

1. Le moteur reçoit pays + devise + plan + type produit + montant.
2. Il retourne les méthodes autorisées (Orange Money, Wave, carte, COD).
3. Création d'une intention de paiement + redirection PSP.
4. Webhook signé → vérification → idempotence → commande payée.
5. Ledger : espèces/online_capture, frais, commission, settlement.
6. Remboursement → écritures compensatoires.
7. Rapprochement quotidien PSP ↔ ledger.

### Critères

- Deux webhooks identiques = une seule écriture.
- Un client qui ferme la page après paiement a quand même sa commande payée.
- Les méthodes dépendent réellement du pays et du plan.

**Effort** : 3 semaines après clés.

---

## 13. Livraison avancée — 🟡

- Zones et tarifs (poids, panier, pays).
- Transporteurs et numéros de suivi.
- Livraison gratuite au-delà d'un seuil.
- Retours, colis perdus, adresses incorrectes.
- Suivi dans la commande et l'e-mail.

**Effort** : 2 semaines.

---

## 14. Finance, KYC, retraits — 🟡

### Déjà livré

Ledger, soldes, commissions, journal, relevés, méthodes, PIN, KYC, retraits,
réconciliation théorique, audit.

### À compléter

- Rapprochement PSP réel et imports de relevés.
- Facturation/abonnements.
- Réserves de risque, limites, blocages.
- Retraits via PSP (au lieu du traitement manuel actuel).
- KYC automatisé (Smile Identity) et QR desktop.
- Factures et documents fiscaux.

**Effort** : 3 semaines.

---

## 15. Marketing et réductions avancées — 🟡

### Déjà livré

Codes promo (pourcentage, montant fixe, minimum, quota, dates, actif).

### À compléter

- Livraison gratuite, achetez X obtenez Y, réduction produit/collection.
- Réductions automatiques.
- Segments clients, consentements.
- Campagnes e-mail/SMS, panier abandonné.
- Attribution marketing.

**Effort** : 3 semaines.

---

## 16. Analyses — 🔴

`/app/analytics` : vue d'ensemble, ventes, commandes, clients, produits,
inventaire, marketing, partenaires, numérique, services, finance.

KPI : CA brut/net, commandes, panier moyen, conversion, remboursements,
nouveaux/récurrents, top produits, top partenaires.

**Effort** : 2 semaines (après les données).

---

## 17. Notifications, e-mails, SMS — 🔴

### E-mails transactionnels (Brevo)

Compte créé, e-mail vérifié, commande créée, paiement réussi/échoué,
expédition, livraison, remboursement, accès numérique, cadeau, réservation,
KYC, retrait.

### SMS (Termii)

OTP, commande, retrait, sécurité.

### Centre marchand

`/app/notifications` par catégories.

**Effort** : 2 semaines.

---

## 18. Support — 🔴

`/app/support` : accueil, tickets, nouveau ticket, messages, aide, statut.
`/platform-admin/support` : boîte, tickets, escalades, SLA, macros, base de
connaissances.

**Effort** : 2 semaines.

---

## 19. Administration plateforme complète — 🟡

### Déjà livré

KYC, retraits, réconciliation, audit.

### À construire

Utilisateurs, marchands, boutiques, commandes, clients, paiements,
transactions, commissions, ledger, litiges, risques, fraude, partenaires,
produits, thèmes, contenu, plans/abonnements, fournisseurs, pays, devises,
médias, notifications, support, logs, monitoring, configuration.

**Effort** : 3 semaines.

---

## 20. API, webhooks, POS, PWA — 🔴

- API publique : stores, products, orders, customers, payments, payouts.
- Webhooks marchands signés.
- POS (vente en boutique).
- PWA installable, mode hors-ligne limité.
- OAuth/apps.

**Effort** : 4 à 6 semaines.

---

## 21. Qualité, sécurité, exploitation — 🟡

- Tests E2E des parcours critiques.
- Tests RLS inter-boutiques.
- CI lint + types + build + tests.
- Rate limiting (Upstash), Turnstile.
- Sentry, status page, alertes.
- Sauvegardes testées.
- Revue de sécurité avant lancement.
- Journal d'audit étendu.

**Effort** : en continu, 2 semaines dédiées avant lancement.

---

## 22. Séquence recommandée

```
Socle multi-boutiques + plans + équipe        (2 sem.)
        ↓
Onboarding complet                           (2 sem.)
        ↓
Thèmes / éditeur / domaines / SEO            (4 sem.)
        ↓
Produits avancés + inventaire               (2 sem.)
        ↓
Comptes clients                              (2 sem.)
        ↓
Numérique protégé                            (3 sem.)
        ↓
Services / réservation                       (3 sem.)
        ↓
Cadeaux                                      (2 sem.)
        ↓
Partenaires / affiliation                    (4 sem.)
        ↓
Paiements en ligne (dès clés PSP)            (3 sem.)
        ↓
Finance avancée + admin complet              (3 + 3 sem.)
        ↓
Marketing / analyses / support / e-mails     (2 + 2 + 2 + 2 sem.)
        ↓
Livraison avancée                            (2 sem.)
        ↓
API / POS / PWA                              (4–6 sem.)
```

En parallèle :

- **toi** : entité légale, compte Flutterwave, clés, site public vérifiable ;
- **moi** : site public Pashove (2 sem.) et tests automatisés dès le socle.

### Variante « partenaires d'abord »

Si les partenaires sont la priorité commerciale, on peut faire :

```
Socle multi-boutiques → Commandes/ledger multi-boutiques
→ Partenaires (offres, listings, attribution, commissions)
→ Paiements en ligne
```

Mais les partenaires **ne peuvent pas** être construits avant le multi-boutiques
et le ledger par boutique : ce sont leurs fondations.

---

## 23. Estimation globale

| Périmètre | Effort |
|---|---|
| Socle SaaS (multi-boutiques, plans, équipe) | 2 semaines |
| Site public | 2 semaines |
| Onboarding + thèmes/domaines | 6 semaines |
| Commerce avancé (produits, inventaire, livraison, commandes) | 4 semaines |
| Comptes clients | 2 semaines |
| Numérique protégé | 3 semaines |
| Services / réservation | 3 semaines |
| Cadeaux | 2 semaines |
| Partenaires | 4 semaines |
| Paiements en ligne | 3 semaines (+ délais PSP) |
| Finance/Admin/Marketing/Analyses/Support/E-mails | 12 semaines |
| API/POS/PWA | 4–6 semaines |
| **Total** | **~9 à 11 mois** (un développeur assisté) |

Le **MVP commercial** (socle + site public + onboarding + thèmes + paiements +
commandes + finance) reste autour de **12 à 16 semaines** après obtention des
clés PSP.

---

## 24. Ce que je propose comme prochaine session

**Lot suivant recommandé : socle multi-boutiques + sélecteur + limites de plan +
invitations d'équipe.** C'est la fondation des partenaires, des thèmes par
boutique, des domaines et de la finance multi-boutiques.

En parallèle, tu peux lancer la création du compte Flutterwave et me transmettre
les clés ; je préparerai le lot paiements dès qu'elles seront disponibles.
