# PASHOVE — Programme de création des comptes et des API

> Ordre d'exécution **obligatoire** : chaque bloc dépend du précédent.
> Les comptes marqués 🔴 **ne peuvent pas être créés par moi** : ils exigent votre identité,
> votre téléphone, votre pièce d'identité et/ou une vérification interactive. Je vous donne la
> procédure exacte, vous les créez, puis vous me transmettez les clés.

---

## Légende

- 🔴 = création manuelle par vous (identité / vérification requise)
- 🟢 = je peux configurer dès que le compte existe
- 💳 = coût
- 📄 = documents à préparer

---

## BLOC 0 — À faire MAINTENANT (indépendant de tout le reste)

### 0.1 Cloudflare (déjà créé — le domaine y est)
**Ce qu'on y active :**

| Produit | Rôle pour Pashove |
|---|---|
| DNS | Pointer pashove.com → Vercel |
| Email Routing | Redirection (secours / alias secondaires) |
| R2 | Stockage des fichiers (images, PDF produits) |
| Stream | Hébergement + protection des vidéos vendues |
| Turnstile | Anti-bot sur inscription / checkout |
| Workers | Tâches planifiées, redirections avancées |
| Registrar | Gestion du domaine (déjà là) |

**API à générer** (Cloudflare Dashboard → My Profile → API Tokens) :
- 🟢 Token `DNS:Edit` sur zone pashove.com
- 🟢 Token `R2:Edit` (via S3 API : Access Key + Secret)
- 🟢 Token `Stream:Edit`
- 🟢 Token `Email Routing:Edit`
- 🟢 Turnstile : Site Key + Secret Key

💳 Cloudflare gratuit (R2/Stream facturés à l'usage).

### 0.2 E-mails professionnels — VOIR `docs/05-SETUP-CLOUDFLARE-EMAIL.md`
Décision : **Zoho Mail** (boîtes réelles, envoi + réception) + **Brevo** (transactionnel app).
Procédure détaillée dans le fichier dédié.

Boîtes à créer : `contact@`, `support@`, `hello@`, `billing@`, `noreply@`, `legal@`, `admin@`.

---

## BLOC 1 — Développement et hébergement

### 1.1 GitHub 🔴
- **Rôle** : dépôt privé `pashove`.
- **API** : Personal Access Token (repo, workflow).
- 💳 Gratuit.
- 🟢 Je peux : pousser le code, configurer les workflows CI.

### 1.2 Vercel 🔴
- **Rôle** : héberger l'app Next.js + les API + les webhooks.
- **API** : Vercel Token (`VERCEL_TOKEN`) + Project ID.
- **Connexion** : « Continue with GitHub » → import du repo.
- 💳 Gratuit → 20 $/mois (Pro) quand nécessaire.
- 🟢 Je peux : `vercel.json`, domaines, variables d'environnement.
- **Important** : c'est Vercel qui pointera `pashove.com` et `*.pashove.com` (boutiques).

### 1.3 Supabase 🔴
- **Rôle** : base Postgres, Auth, RLS, métadonnées de fichiers, fonctions serveur.
- **Région à choisir** : **eu-west / Paris** (meilleure latence vers l'Afrique de l'Ouest).
- **API** : `Project URL`, `anon key`, `service_role key`.
- 💳 Gratuit (2 projets) → 25 $/mois (Pro) obligatoire en production
  (le gratuit **met en pause après 7 jours d'inactivité** et n'a **pas de sauvegarde longue**).
- 📄 Rien.
- 🟢 Je peux : schéma SQL, migrations, politiques RLS, buckets.

### 1.4 Upstash (Redis) 🔴
- **Rôle** : rate limiting, idempotence des webhooks, files légères.
- **API** : `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
- 💳 Gratuit → à l'usage.
- 🟢 Je peux : tout configurer.

---

## BLOC 2 — Paiements (le cœur)

> ⚠️ **Avant de créer ces comptes**, décidez si vous créez l'entité légale au Sénégal/CI
> (recommandé, obligatoire pour les PSP) ou une LLC US (pour Stripe plus tard).
> Flutterwave a un **compte « Starter »** utilisable avant immatriculation, avec limites réduites.

### 2.1 Flutterwave 🔴 — **PRIORITÉ ABSOLUE**
- **Rôle** : socle paiement. Cartes + mobile money + **sous-comptes + split payments** (les marchands Pashove deviennent des sous-comptes).
- **Ouvre** : l'encaissement ET les payouts (retraits marchands).
- **API** : `FLW_PUBLIC_KEY`, `FLW_SECRET_KEY`, `FLW_ENCRYPTION_KEY`, `FLW_WEBHOOK_HASH`.
- **Onboarding** : 2–7 jours, ~12–20 % de refus (documents illisibles, nom du compte bancaire ≠ nom de l'entreprise).
- 📄 À préparer :
  - Immatriculation entreprise (RCCM au Sénégal / CI) ou pièce d'identité (compte Starter)
  - Pièce d'identité **du ou des dirigeants** (originale, en couleur, non plastifiée)
  - **Compte bancaire professionnel** au même nom que l'entreprise
  - Justificatif d'adresse de moins de 90 jours
  - **Site web vérifiable** (👉 c'est pourquoi on déploie pashove.com tôt)
- 💳 ~1,4 % carte locale · ~3,8 % carte internationale · ~1,5 % mobile money.
- 🟢 Je peux : intégration, sous-comptes, splits, webhooks, statuts.

### 2.2 CinetPay 🔴
- **Rôle** : mobile money UEMOA/CEMAC (carte + Orange/Wave/Moov).
- **Couverture** : 12–14 pays (CI, SN, ML, BF, BJ, GN, TG, NE, CM, GA…).
- **API** : `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY`.
- 💳 ~2,5–3,5 % + 100 FCFA · setup 0 à 150 000 FCFA (souvent offert).
- 📄 RCCM + ID dirigeant + compte bancaire + site web.
- 🟢 Je peux : intégration + webhooks.

### 2.3 PayDunya 🔴
- **Rôle** : mobile money Sénégal surtout (Wave / OM), très bon taux négociable au volume.
- **Couverture** : SN, CI, BJ, BF, ML, TG.
- **API** : `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PUBLIC_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN`.
- 💳 ~2,9 % · **0 frais de setup** · sandbox immédiat · support WhatsApp FR.
- 📄 RC + NINEA (SN) + ID + compte bancaire.
- 🟢 Je peux : intégration + webhooks.

### 2.4 Stripe 🔴 — **PHASE 2 UNIQUEMENT**
- À créer **seulement si** vous ouvrez une LLC US (Stripe Atlas / Doola).
- **Débloque** : cartes internationales à meilleur taux, abonnements récurrents natifs, facturation USD.
- 💳 Atlas ~500 $ + ~300 $/an (Delaware) + agent ~100 $/an.
- ⚠️ Si pas d'entité US : **on saute ce bloc** et on gère les abonnements via Flutterwave payment plans.

### 2.5 (Optionnel) Paystack 🔴
- Seulement si vous ciblez Nigeria / Ghana / Kenya. Stripe en est propriétaire.

---

## BLOC 3 — Communications et identité

### 3.1 Brevo 🔴
- **Rôle** : e-mails transactionnels de l'app (confirmation commande, accès numérique, KYC, retraits…)
  **et** e-mails d'authentification de Supabase (confirmation d'inscription, réinitialisation de mot de passe).
- **API** : `BREVO_API_KEY`.
- **Relais SMTP** — ce que Supabase Auth utilise pour envoyer ses propres e-mails :
  `smtp-relay.brevo.com`, port `587`, identifiant = login SMTP (`…@smtp-brevo.com`),
  mot de passe = **clé SMTP** (⚠️ pas la clé API, pas le mot de passe du compte).
  Réglage dans *Supabase → Project Settings → Authentication → SMTP Settings*.
- **Domaine d'envoi** : `mail.pashove.com` (sous-domaine dédié, pour ne pas engager la
  réputation de `pashove.com`). L'expéditeur doit être `noreply@mail.pashove.com` :
  une adresse sur le domaine racine ne bénéficie pas de l'alignement SPF/DKIM.
- **DNS** : enregistrements SPF / DKIM fournis par Brevo, plus le DMARC déjà prévu.
- 💳 Gratuit : 300 e-mails/jour.
- 🟢 Je peux : templates d'e-mails + intégration.

### 3.2 Zoho Mail 🔴
- **Rôle** : boîtes humaines `contact@`, `support@`… (envoi **et** réception).
- 💳 Gratuit : 5 utilisateurs, domaine personnalisé.
- ⚠️ Zoho prend les **MX** de pashove.com → ne pas activer Email Routing en parallèle sur le domaine principal.

### 3.3 SMS — Termii 🔴 (ou Africa's Talking)
- **Rôle** : OTP, notifications commande/livraison, alertes sécurité.
- **API** : `TERMII_API_KEY`, sender ID.
- 💳 à l'usage.
- 🟢 Je peux : intégration OTP + notifications.

### 3.4 KYC / vérification d'identité — Smile Identity 🔴
- **Rôle** : vérification au premier retrait — capture **en direct**, liveness, documents africains.
- **API** : `SMILE_PARTNER_ID`, `SMILE_API_KEY`.
- 💳 à l'usage.
- Alternative : Veriff / Onfido (international) / Youverify.
- 🟢 Je peux : intégration + file de revue admin.

### 3.5 (Optionnel) WhatsApp Business Cloud API 🔴 (Meta)
- **Rôle** : support + notifications (canal massivement utilisé en Afrique de l'Ouest).
- 💳 à l'usage.

---

## BLOC 4 — Médias

### 4.1 Cloudflare R2 🟢 (inclus dans Cloudflare)
- **Rôle** : stockage privé des fichiers produits (PDF, EPUB, ZIP…), images.
- **API** : S3-compatible (Access Key + Secret + Endpoint).
- 💳 ~0,015 $/Go/mois, egress gratuit.

### 4.2 Cloudflare Stream 🟢
- **Rôle** : vidéos vendues (streaming protégé, URL signées, filigrane dynamique).
- **API** : Account ID + API Token.
- 💳 à l'usage.

### 4.3 (Optionnel) Meilisearch / Algolia 🔴
- **Rôle** : recherche produit rapide. Peut être remplacé par `pg_trgm`/`tsvector` de Postgres en v1.

---

## BLOC 5 — Structure légale et finance

### 5.1 Immatriculation de l'entreprise 🔴
- **Rôle** : **indispensable** pour ouvrir les comptes Flutterwave / CinetPay / PayDunya au nom de la société.
- 📄 RCCM (Sénégal/CI), NINEA (SN), ID dirigeants, statuts.
- 💳 variable selon pays.

### 5.2 Compte bancaire professionnel 🔴
- **Rôle** : réception des règlements PSP.
- ⚠️ Le nom du compte **doit** correspondre au nom de l'entreprise.

### 5.3 Documents légaux 🔴 (je peux rédiger la structure, un juriste doit valider)
- CGU / CGV, Politique de confidentialité, Mentions légales,
  Politique de remboursement, Politique de retrait.

---

## BLOC 6 — Opérations et support

| Compte | Rôle | Coût |
|---|---|---|
| Sentry 🔴 | Monitoring des erreurs | Gratuit |
| PostHog (optionnel) 🔴 | Analytics produit + feature flags | Gratuit |
| Crisp / Tawk (optionnel) 🔴 | Chat support (ou support interne dans l'admin) | Gratuit |

---

## Récapitulatif : ordre d'exécution

```
MAINTENANT
  └─ 0.1 Cloudflare (R2, Stream, Turnstile, tokens)   🟢
  └─ 0.2 E-mails pro (Zoho + Brevo)                   🔴 → docs/05

SEMAINE 1
  └─ 1.1 GitHub      🔴
  └─ 1.2 Vercel      🔴   ← déployer pashove.com (nécessaire pour le KYC PSP)
  └─ 1.3 Supabase    🔴
  └─ 1.4 Upstash     🔴

SEMAINE 1–2 (en parallèle, délais PSP 2–7 j)
  └─ 5.1 Immatriculation entreprise   🔴
  └─ 5.2 Compte bancaire pro          🔴
  └─ 2.1 Flutterwave                  🔴  ← PRIORITÉ
  └─ 2.2 CinetPay                     🔴
  └─ 2.3 PayDunya                     🔴

SEMAINE 2
  └─ 3.1 Brevo    🔴
  └─ 3.3 Termii   🔴
  └─ 3.4 Smile Identity  🔴
  └─ 4.x R2 + Stream     🟢

PHASE 2 (plus tard)
  └─ 2.4 Stripe (si LLC US)   🔴
  └─ 3.5 WhatsApp API         🔴
```

---

## Ce dont j'ai besoin de vous à chaque étape

Pour chaque compte créé, transmettez-moi **uniquement les clés**, jamais vos mots de passe.
Elles iront dans `.env.local` (jamais commité). Voir `.env.example` pour la liste complète.
