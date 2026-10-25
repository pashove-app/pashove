# PASHOVE — Audit complet et plan directeur

> Date : 25/10/2026 · Dernier commit : `6bf1e22`
> Sources : code du dépôt, `docs/00` → `docs/06`, blueprint `AGENTSb.md`.
> Méthode : lecture des routes, des écrans, des RPC et tests réels (SQL + navigateur).

---

## 1. Verdict en une page

### Ce qui fonctionne réellement aujourd'hui

- **Comptes et sécurité** : inscription, vérification e-mail, connexion, 2FA TOTP,
  sessions révocables, réinitialisation, pages de sécurité.
- **Onboarding** : création de boutique, profil, mode de vente, lancement.
- **Espace marchand** : tableau de bord, commandes (liste, détail, statuts,
  remboursement), produits physiques/numériques/services, variantes, galerie,
  collections, paquets, clients, réductions, finance (ledger, soldes, journal,
  commissions, retraits, méthodes, PIN, KYC, relevés), réglages boutique et
  politiques légales.
- **Vitrine** : accueil, produit, recherche, panier + tiroir, checkout COD,
  succès, collections, paquets, pages légales de la boutique, 5 langues + RTL.
- **Admin plateforme** : KYC, retraits, réconciliation, audit.
- **Socle de données** : 40 migrations, RLS multi-tenant, ledger immuable,
  idempotence, stock atomique, commissions, remises.

### Ce qui ne fonctionne pas ou manque

- **Paiements en ligne** : seuls les paiements à la livraison existent. Aucun
  prestataire (Flutterwave, CinetPay, PayDunya) n'est branché, aucune clé n'est
  présente. Donc **Orange Money, Wave, cartes ne peuvent pas s'afficher**.
- **Site public Pashove** : `/fr` et toutes les pages marketing répondent 404.
  Le blueprint (accueil, tarifs, fonctionnalités, thèmes, aide, statut) n'est
  pas construit.
- **Multi-boutiques** : la base le permet, l'interface ne gère qu'une boutique
  à la fois (pas de sélecteur, pas de création, pas de limites par plan).
- **Produits numériques** : le type existe, mais pas l'envoi de fichier, ni les
  droits d'accès, ni les liens signés, ni le filigrane.
- **Services** : type de produit seulement, pas de calendrier ni de réservation.
- **Cadeaux, partenaires/affiliation, marketing, analyses, applications,
  support** : pages « à venir ».
- **Thèmes, éditeur, domaines, blog, SEO** : absents.
- **Comptes clients** : la page `/store/[slug]/account` est un écran d'attente.
- **E-mails transactionnels, SMS, notifications, rate limiting, Turnstile,
  monitoring, sauvegardes testées** : absents ou non vérifiables.
- **Tests automatisés** : aucun. Les validations sont manuelles (SQL + navigateur).

### Les codes promo semblaient ne pas fonctionner : cause exacte

Trois causes réelles, toutes traitées :

1. **Le champ code promo n'existait que sur la page panier.** Un client qui
   cliquait « Passer commande » depuis le tiroir allait directement au checkout,
   sans champ. → Le champ est maintenant **aussi sur le checkout**, avec
   recalcul serveur des totaux.
2. **`PROMO2026` était enregistré inactif** (case « Code actif » décochée), donc
   volontairement refusé. `PROMO20260`, actif, a été testé et fonctionne.
3. **Aucune modification ni suppression** n'était possible. → Édition et
   suppression ajoutées, avec confirmation.
4. Bonus : les montants saisis avec des espaces (« 20 000 ») sont désormais
   acceptés.

### Écart avec le blueprint

Le blueprint décrit ~260 pages et une quinzaine de domaines. Le dépôt en compte
**79 pages** (dont 8 placeholders et 14 pages d'authentification). Nous sommes
donc sur un **socle marchand solide et testé**, mais très loin du produit complet.
Le lancement commercial n'est pas possible sans les paiements en ligne et le site
public.

---

## 2. Audit des points signalés

### 2.1 Codes promo — corrigé le 25/10/2026 (`6bf1e22`)

| Problème | Cause | Correction |
|---|---|---|
| Impossible d'appliquer le code au checkout | Champ uniquement sur `/cart` | Champ ajouté au checkout, `router.refresh()` pour recalculer les totaux |
| Le code « ne marche pas » | `PROMO2026` inactif ; `PROMO20260` fonctionne | Le statut est visible en liste ; l'édition permet de réactiver |
| Impossible de modifier un code | Action de création seulement | Page `/app/discounts/[id]`, `saveDiscountAction`, formulaire prérempli |
| Impossible de supprimer | Aucune action | Suppression en deux temps depuis la liste |
| Montants avec espaces refusés | `parsePrice` strict | Normalisation des espaces avant validation |
| Sections du menu sans contenu | Placeholders | Badge « Bientôt » ajouté dans le menu |

Preuves : commande #1013 avec `NOEL2026` (25 000 − 2 500 + 1 500 = 24 000),
ledger équilibré, commission 2 250 ; application de `PROMO20260` au checkout
(totaux 25 500) et persistance après rechargement.

### 2.2 Moyens de paiement — absence, pas bug

Le checkout ne propose que le paiement à la livraison. Ce n'est pas un défaut
d'affichage : **aucun prestataire n'est intégré**.

- `payments.provider` n'accepte que `cod`.
- Aucune route de webhook paiement.
- Aucune clé `FLUTTERWAVE_*`, `CINETPAY_*`, `PAYDUNYA_*` dans `.env.local`.
- Aucun moteur d'éligibilité (pays + plan + devise + fournisseur + type produit).
- Les comptes marchands exigent une entité légale, un compte bancaire pro et un
  site vérifiable (voir `docs/01`), que je ne peux pas créer à ta place.

### 2.3 Site public — absent

`/` redirige vers `/fr`, qui répond **404**. Seules les pages `/legal/*` existent.
Conséquence directe : impossible de présenter la plateforme, de convertir un
prospect, et **Flutterwave exige un site web vérifiable** pour approuver le compte.

### 2.4 Sections « à venir »

Marketing, Boutique en ligne, Canaux de vente, Partenaires, Cadeaux, Analyses,
Applications, Support : elles répondent par un écran « en construction ». Elles
sont désormais marquées **« Bientôt »** dans le menu pour ne plus tromper.

---

## 3. Inventaire complet : construit / partiel / manquant

Légende : ✅ livré et testé · 🟡 partiel · 🔴 absent.

### 3.1 Identité et comptes

| Élément | État | Détail |
|---|---|---|
| Inscription, vérification e-mail, renvoi | ✅ | Supabase Auth, 5 langues |
| Connexion, mot de passe oublié, réinitialisation | ✅ | |
| 2FA TOTP, codes de récupération | ✅ | |
| Sessions révocables, page sécurité | ✅ | |
| Verrouillage / limitation de tentatives | 🟡 | Page compte verrouillé, mais pas de rate limiting applicatif |
| Vérification téléphone / OTP SMS | 🔴 | Termii non branché |
| Connexions sociales | 🔴 | Non prévu v1 |
| Multi-comptes / rôles équipe | 🔴 | Une seule relation propriétaire par boutique |

### 3.2 Onboarding

| Étape blueprint | État |
|---|---|
| Bienvenue, profil, boutique, lancement | ✅ (4 étapes) |
| Informations commerciales, catégorie | 🔴 |
| Premier produit, pays de vente, devise, paiements | 🔴 |
| Thème, domaine, politiques, aperçu | 🔴 |
| Sauvegarde/reprise automatique | 🟡 (brouillon de boutique) |

### 3.3 Espace marchand

| Module | État | Détail |
|---|---|---|
| Tableau de bord | ✅ | Accueil, bandeau, indicateurs de base |
| Commandes liste + détail | ✅ | Filtres, recherche, statuts, remboursement |
| Retours, litiges, commandes abandonnées | 🔴 | |
| Produits 3 types | ✅ | Physique, numérique, service |
| Variantes, galerie, stock, pays de livraison | ✅ | |
| Fichiers numériques protégés | 🔴 | |
| Collections | ✅ | Manuelles, ordre, couverture |
| Paquets | ✅ | Achat réel, stock, ledger |
| Clients | 🟡 | Liste + fiche issus des commandes ; pas de comptes/segments |
| Réductions | ✅ | CRUD, pourcentage/fixe, minimum, quota, dates, checkout |
| Marketing (campagnes, e-mails, SMS, panier abandonné) | 🔴 | Placeholder |
| Boutique en ligne (thèmes, éditeur, pages, navigation, blog, domaines, SEO) | 🔴 | Placeholder |
| Canaux de vente | 🔴 | Placeholder |
| Partenaires / affiliation | 🔴 | Placeholder |
| Cadeaux | 🔴 | Placeholder |
| Analyses | 🔴 | Placeholder |
| Applications | 🔴 | Placeholder |
| Support | 🔴 | Placeholder |
| Paramètres boutique + politiques | ✅ | |
| Plan, facturation, paiements, domaines, marchés, équipe, permissions | 🔴 | |
| Notifications | 🔴 | |

### 3.4 Vitrine

| Page | État |
|---|---|
| Accueil, produit, recherche | ✅ |
| Panier + tiroir | ✅ |
| Checkout COD + succès | ✅ |
| Collections, paquets | ✅ |
| Pages légales de la boutique | ✅ |
| Compte client | 🔴 Écran d'attente |
| Catégories, blog, à propos, contact, FAQ | 🔴 |
| Suivi de commande public | 🟡 Succès uniquement (pas de suivi durable) |
| Multi-devises, marchés, taxes | 🔴 |
| Thèmes / personnalisation | 🔴 |

### 3.5 Checkout et paiements

| Élément | État |
|---|---|
| Panier anonyme, cookie HttpOnly, RPC | ✅ |
| Calcul serveur (sous-total, remise, livraison, total) | ✅ |
| COD, commande payée, stock, ledger, commission | ✅ (avec la réserve COD déjà signalée) |
| Paiement en ligne (Orange Money, Wave, cartes) | 🔴 |
| Moteur d'éligibilité des méthodes | 🔴 |
| Webhooks signés + idempotence | 🔴 |
| Frais PSP, capture, settlement, chargeback | 🔴 |
| Réessai de paiement, expiration de checkout | 🔴 |
| Cadeau au checkout | 🔴 |

### 3.6 Finance

| Élément | État |
|---|---|
| Ledger immuable double entrée | ✅ |
| Soldes pending/available/cod/commission | ✅ |
| Journal, commissions, remises | ✅ |
| Relevés CSV | ✅ |
| Retraits : méthodes, bénéficiaires, PIN, 2FA | ✅ |
| KYC manuel + admin | ✅ |
| Rapprochement théorique | ✅ |
| Rapprochement PSP réel | 🔴 |
| Remboursements et commissions inversées | ✅ |
| Facturation / abonnements | 🔴 |
| Réserves, limites, risques | 🔴 |

### 3.7 Administration plateforme

| Élément | État |
|---|---|
| Dashboard admin | 🟡 KPIs de base |
| KYC (revue) | ✅ |
| Retraits | ✅ |
| Réconciliation | ✅ |
| Audit | ✅ |
| Utilisateurs, marchands, boutiques | 🔴 |
| Commandes, paiements, commissions globales | 🔴 |
| Plans, abonnements, fournisseurs | 🔴 |
| Pays, devises, thèmes, médias | 🔴 |
| Support, risques, fraude | 🔴 |
| Staff, rôles, feature flags, monitoring | 🔴 |

### 3.8 Site public et acquisition

Tout le site marketing est 🔴 : accueil, fonctionnalités, tarifs, thèmes,
paiements, sécurité, aide, documentation, blog, statut.

### 3.9 Infrastructure et exploitation

| Élément | État |
|---|---|
| Supabase + RLS | ✅ |
| R2 images publiques | ✅ |
| R2 privé pour fichiers vendus | 🟡 utilisé pour KYC, pas pour produits |
| Brevo / e-mails transactionnels | 🔴 |
| SMS / OTP | 🔴 |
| Upstash / rate limiting | 🔴 |
| Turnstile | 🔴 |
| Sentry / monitoring | 🔴 |
| Sauvegardes testées | 🔴 (non vérifiable dans le dépôt) |
| Tests automatisés / CI | 🔴 |
| Déploiement Vercel / domaine | 🟡 code prêt, configuration à finaliser |
| PWA | 🔴 |

---

## 4. Audit technique et risques

### Points forts

- **Isolation en base** : toutes les tables marchandes portent `store_id` et des
  politiques RLS. Les RPC publiques ne reçoivent jamais un `store_id` client.
- **Ledger** : immuable, équilibré, corrections par écritures compensatoires.
- **Stock** : verrous `FOR UPDATE`, décrément atomique, blocage de survente,
  blocage paquet avec nom du produit manquant.
- **Idempotence** : commande, commission, remboursement, redemption de code.
- **Secrets** : service role non exposé, clés serveur uniquement.
- **KYC** : documents privés et file de revue.
- **Design** : mobile-first, 5 langues, RTL, tokens cohérents.

### Risques et dettes

1. **Aucun test automatisé** : chaque lot est vérifié manuellement. Risque élevé
   de régression sur les flux financiers.
2. **COD marqué payé à la création** : décision connue, à revoir avec les
   paiements en ligne.
3. **Un seul prestataire de paiement = zéro** : pas de revenus en ligne.
4. **Site public absent** : pas d'acquisition, PSP refuse le compte.
5. **Multi-boutiques non exploité** : le plan Free promet 2 boutiques.
6. **Aucune limite de plan appliquée** : `commission_bps` est par boutique, mais
   pas de plans/abonnements.
7. **Pas de rate limiting ni captcha** : inscription et checkout exposés au spam.
8. **Pas d'e-mails** : un client ne reçoit aucune confirmation.
9. **Pas de monitoring ni sauvegardes vérifiées** : incident = perte silencieuse.
10. **Placeholders visibles** : promesse produit supérieure à la réalité.

---

## 5. Paiements Orange Money / Wave : ce qu'il faut pour les activer

### Pourquoi ce n'est pas encore là

Un paiement mobile money ne s'improvise pas : il faut un **prestataire agréé**
qui encaisse, confirme par webhook signé, et reverse au marchand. Le blueprint a
choisi Flutterwave (socle), CinetPay et PayDunya. Aucun compte ni clé n'existe.

### Prérequis (à faire par toi, je ne peux pas les créer)

1. **Entité légale** (Sénégal ou Côte d'Ivoire) + compte bancaire professionnel.
2. **Site web vérifiable** : `pashove.com` déployé avec pages légales, tarifs,
   contact — c'est aussi pour cela que le site public est prioritaire.
3. **Compte Flutterwave** (priorité) : `FLW_PUBLIC_KEY`, `FLW_SECRET_KEY`,
   `FLW_ENCRYPTION_KEY`, `FLW_WEBHOOK_HASH`.
4. Optionnel : CinetPay (`CINETPAY_API_KEY`, `CINETPAY_SITE_ID`,
   `CINETPAY_SECRET_KEY`) et PayDunya (4 clés).
5. **Décision sur les fonds** : split-on-capture (recommandé, pas d'agrément) ou
   encaissement central (agrément EMI).

### Ce que je construirai dès les clés disponibles (lot PAY)

1. Table `payment_providers` + configuration admin par pays/devise.
2. Moteur d'éligibilité : `pays + devise + plan + type produit + montant → méthodes`.
3. Checkout : sélection de méthode (Orange Money, Wave, carte, COD).
4. Création d'intention de paiement + redirection prestataire.
5. Webhook signé, vérifié, **idempotent** ; machine à états
   `pending → processing → paid/failed/expired`.
6. Ledger : `online_capture`, frais PSP, commission, settlement.
7. Remboursements et chargebacks.
8. Tests sandbox Flutterwave → production.

**Effort indicatif** : 2 à 4 semaines après obtention des clés et validation du
compte (délai PSP externe : 2 à 7 jours, refus possible).

---

## 6. Plan directeur professionnel

### Principe d'ordonnancement

On construit d'abord ce qui **débloque le lancement commercial**, puis ce qui
augmente la valeur. Chaque phase se termine par un lot testable, déployé et
validé sur mobile.

### Phase 0 — Stabilisation et qualité (1 semaine)

- Tests E2E des parcours critiques (commande, remise, stock, ledger, retrait).
- Corrections des bugs signalés (fait le 25/10).
- Rate limiting + Turnstile sur inscription/connexion/checkout.
- Sentry + page de statut.
- Sauvegardes Supabase et test de restauration.
- Badge « Bientôt » sur les sections non livrées (fait).

**Sortie** : aucun parcours critique sans test ; erreurs monitorées.

### Phase 1 — Site public Pashove (2 semaines) — **P0**

- `/` accueil complet (hero, 3 types, paiements, retraits, cadeaux, partenaires,
  plans, FAQ, CTA).
- `/features/*` (12 pages), `/pricing`, `/themes`, `/payments/*`, `/security`.
- `/help` + catégories, `/status`, `/legal/*`.
- SEO, Open Graph, 5 langues, RTL, responsive.
- Formulaire de contact + inscription.

**Sortie** : pashove.com présente la plateforme ; dossier PSP crédible.

### Phase 2 — Paiements en ligne (3 semaines + délais PSP) — **P0**

Voir §5. Livrables : Flutterwave opérationnel, Orange Money/Wave/cartes selon
pays, webhooks idempotents, ledger et commissions corrects, remboursements.

**Sortie** : une commande peut être payée en ligne, confirmée par webhook, et
comptabilisée sans intervention manuelle.

### Phase 3 — Multi-boutiques, équipe, plans (2 semaines) — **P0**

- Sélecteur de boutique, création, limites par plan.
- Invitations, rôles (owner/admin/produits/commandes/finance/support).
- Page plan, changement de plan, application des limites.
- Abonnements : d'abord facturation manuelle/Flutterwave plans, puis automatique.

**Sortie** : un compte peut gérer plusieurs boutiques et une équipe.

### Phase 4 — Onboarding complet (2 semaines) — **P0**

- 15 étapes du blueprint, sauvegarde/reprise.
- Pays de vente, devises, paiements, livraison, thème, domaine, politiques,
  aperçu desktop/tablette/mobile, lancement.
- Checklist de première vente.

**Sortie** : un nouveau marchand publie sans aide.

### Phase 5 — Thèmes, éditeur, pages, domaines, SEO (4 semaines) — **P0/P1**

- Bibliothèque de thèmes gratuits (6+), previews, installation.
- Éditeur de sections/blocs, versions, restauration.
- Pages, navigation, blog, SEO, sitemap.
- Sous-domaines `*.pashove.com` et domaine personnalisé (DNS/SSL).

**Sortie** : les boutiques ne se ressemblent plus ; domaine propre possible.

### Phase 6 — Produits numériques protégés (3 semaines) — **P1**

- Upload privé R2, versions, taille, types.
- Entitlements, liens signés courts, limite de téléchargements, journalisation,
  révocation, filigrane PDF, streaming vidéo protégé (Stream).
- Espace client `/account/digital`.
- Blocage du COD pour les paniers/paquets non 100 % physiques (décision DIG1).

**Sortie** : vente d'un PDF/vidéo avec accès contrôlé et révocable.

### Phase 7 — Services et réservation (3 semaines) — **P1**

- Disponibilités, fuseaux, durée, capacité, lieu/visio.
- Réservation, confirmation, rappel, annulation.
- Lien de réservation sécurisé, QR/code.

### Phase 8 — Cadeaux (2 semaines) — **P1**

- Option cadeau au checkout, destinataire, message, date d'envoi.
- Cadeau physique, numérique (entitlement au destinataire), service (bon).
- Claim sécurisé atomique, statuts, e-mails.

### Phase 9 — Partenaires et affiliation (4 semaines) — **P1**

- Offres de partage par produit, commissions, pays, conditions.
- Catalogue de découverte, ajout à sa boutique, personnalisation contrôlée.
- Attribution, commissions pending/approved/available/reversed.
- Anti-fraude (auto-attribution, multi-comptes, remboursements).

### Phase 10 — Marketing, analyses, notifications, support (4 semaines) — **P1**

- Campagnes e-mail/SMS, segments, panier abandonné, consentements.
- Analyses ventes/commandes/clients/produits/partenaires.
- Centre de notifications.
- Support : tickets, pièces jointes, escalade, base de connaissances.
- E-mails transactionnels Brevo (commande, paiement, KYC, retrait, numérique).

### Phase 11 — Administration plateforme complète (3 semaines) — **P0/P1**

- Utilisateurs, marchands, boutiques, commandes, paiements, commissions.
- Plans, abonnements, fournisseurs de paiement, pays, devises.
- Staff, rôles, permissions, feature flags.
- Risque, fraude, incidents, monitoring, webhooks, jobs.
- Journal d'audit étendu.

### Phase 12 — Livraison avancée (2 semaines) — **P1**

- Zones, tarifs, transporteurs, tracking, retours, colis perdus.
- Règles par produit et par pays.

### Phase 13 — Écosystème (P2)

- API publique, webhooks marchands, POS, PWA avancée, marketplace
  d'applications, internationalisation complète (taxes, formats).

### Chemin critique recommandé

```
Comptes PSP (toi) ──► Phase 2 (paiements) ──► lancement commercial
        │
        └──► Phase 1 (site public) ──► validation PSP + acquisition
Phase 3 (multi-boutiques) ──► Phase 4 (onboarding) ──► Phase 5 (thèmes)
Phase 6 → 10 (v1.1)
Phase 11 en parallèle à partir de la Phase 2
```

### Estimation d'ensemble

| Périmètre | Effort indicatif |
|---|---|
| MVP commercial (phases 0–4 + admin minimum) | 10 à 14 semaines |
| Blueprint complet (phases 0–12) | 7 à 9 mois |
| Écosystème (phase 13) | +2 à 3 mois |

Hypothèse : un développeur à temps plein assisté par Claude, hors délais externes
(PSP, KYC, juriste). Les délais PSP peuvent ajouter 2 à 6 semaines.

---

## 7. Décisions à prendre (bloquantes)

1. **Entité légale et pays** : Sénégal ou Côte d'Ivoire ? (PSP et compte bancaire)
2. **PSP prioritaire** : Flutterwave d'abord, puis CinetPay/PayDunya ?
3. **Modèle de fonds** : split-on-capture (recommandé) ou encaissement central ?
4. **Plans et limites** : Standard/Pro = combien de boutiques, d'équipe, de stockage ?
5. **Périmètre du lancement** : MVP (phases 0–4) ou tout le blueprint ?
6. **Domaine et sous-domaines** : `*.pashove.com` dès la v1 ?
7. **E-mails / SMS** : Brevo + Termii, boîtes Zoho ?
8. **KYC** : Smile Identity ou revue manuelle prolongée ?

Tant que 1–3 ne sont pas tranchés, le lot paiements ne peut pas être finalisé.

---

## 8. Qualité et sécurité : ce qu'il faut ajouter

- **Tests automatisés** : RLS inter-boutiques, stock concurrent, webhook 2×,
  retrait 2×, remboursement, code promo épuisé, accès fichier.
- **CI** : lint + types + build + tests à chaque commit.
- **Rate limiting** (Upstash) sur auth, checkout, codes promo.
- **Turnstile** sur inscription et checkout.
- **Sentry** + alertes paiement/retrait/webhook.
- **Sauvegardes** Supabase et restauration testée.
- **Journal d'audit** pour toute action admin sensible.
- **Revue de sécurité** avant ouverture publique.

---

## 9. Prochaines actions concrètes

1. **Créer les comptes PSP** (Flutterwave en premier) et transmettre les clés.
2. **Déployer le site public** même minimal (accueil, tarifs, légal, contact).
3. **Construire le lot PAY** (moteur d'éligibilité + Flutterwave + webhooks).
4. **Multi-boutiques + plans** pour tenir la promesse Free = 2 boutiques.
5. **Onboarding complet** pour l'autonomie marchand.
6. **Thèmes/éditeur/domaines**.
7. **Numérique protégé**, puis services, cadeaux, partenaires.
8. **Admin complet + support + monitoring**.
9. **Tests automatisés et CI** dès la phase 0.
10. **Revue de sécurité et checklist de lancement** avant ouverture.

---

## 10. Ce qui est prêt pour une démonstration aujourd'hui

Un marchand peut : créer un compte, créer une boutique, ajouter des produits
physiques/numériques/services, créer des collections et des paquets, publier,
recevoir une commande COD, appliquer un code promo, suivre la commande, voir son
ledger, demander un retrait avec KYC/PIN. C'est une **démo fonctionnelle solide**,
pas encore un produit commercial : il manque les paiements en ligne, le site
public, le multi-boutiques, les thèmes et les fonctions P1.
