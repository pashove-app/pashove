# PASHOVE — Déploiement Vercel + DNS Cloudflare

> 6 novembre 2026 — procédure exacte de mise en production de `pashove.com`.
> Lot **B0**. À suivre dans l'ordre.

---

## 0. Ce qui est prêt, ce qui doit être fait à la main

| Point | État |
|---|---|
| Build de production | ✅ vert (`npm run build`) |
| Migrations dans le dépôt | ✅ 65 fichiers, jusqu'à `20261106100000` |
| Variables de production | ✅ fichier `.env.vercel` prêt à coller (voir §1) |
| Faille paiement mock | ✅ corrigée (migration + code) — **à appliquer** |
| Projet Supabase | ✅ existant, même base qu'en local |
| Domaine | ⏳ à brancher |
| Plan Vercel | ⚠️ **Pro requis** (voir §4) |

---

## 1. Variables d'environnement Vercel

Un fichier **`.env.vercel`** a été généré à la racine du dépôt. Il contient
toutes les valeurs réelles, déjà formatées pour Vercel, et il est ignoré par
git (`.gitignore`).

### 1.1 Avant de coller

Une seule valeur est à compléter :

```
SUPABASE_SERVICE_ROLE_KEY="COLLER_ICI_LA_CLE_SERVICE_ROLE"
```

Remplacer par : **Supabase → Project Settings → API → `service_role`**.
C'est la clé `service_role` (pas l'`anon`, pas la `publishable`).

> Cette clé contourne RLS. Elle ne doit **jamais** être préfixée
> `NEXT_PUBLIC_`, ni apparaître dans un composant client.

### 1.2 Coller dans Vercel

Vercel accepte un fichier `.env` entier :

1. **Project → Settings → Environment Variables**
2. Bouton **Import / Paste** (ou coller directement dans la zone d'ajout)
3. Coller le contenu de `.env.vercel`
4. Cocher **Production** (et **Preview** si vous voulez tester les branches)
5. **Save**

### 1.3 Liste complète et valeur attendue

| Variable | Valeur | Nature |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://pashove.com` | public |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gewibhqxizbzohbgnorh.supabase.co` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | voir `.env.vercel` | public |
| `SUPABASE_SERVICE_ROLE_KEY` | **à récupérer dans Supabase** | 🔒 secret |
| `R2_ENDPOINT` | `https://ce026d4ffb380492a8e9fea9ff91c79d.r2.cloudflarestorage.com` | secret |
| `R2_ACCESS_KEY_ID` | voir `.env.vercel` | 🔒 secret |
| `R2_SECRET_ACCESS_KEY` | voir `.env.vercel` | 🔒 secret |
| `R2_BUCKET` | `pashove-files` | public |
| `R2_PRIVATE_BUCKET` | `pashove-files-private` | public |
| `R2_PUBLIC_URL` | `https://pub-4ef71a4ff50848b881fc86503a8fb29f.r2.dev` | public |
| `ENCRYPTION_KEY` | **exactement la valeur locale** | 🔒 secret |
| `BREVO_API_KEY` | voir `.env.vercel` | 🔒 secret |
| `EMAIL_DRIVER` | `brevo` | public |
| `EMAIL_FROM` | `Pashove <noreply@pashove.com>` | public |
| `EMAIL_REPLY_TO` | `support@pashove.com` | public |
| `CRON_SECRET` | voir `.env.vercel` | 🔒 secret |
| `MOCK_WEBHOOK_SECRET` | voir `.env.vercel` (généré le 6/11) | 🔒 secret |
| `SASPAY_API_KEY` | clé `sk_test_…` | 🔒 secret |
| `SASPAY_WEBHOOK_SECRET` | voir `.env.vercel` | 🔒 secret |
| `SASPAY_MODE` | `sandbox` | public |

### 1.4 Trois pièges à connaître

1. **`ENCRYPTION_KEY` doit être identique au local.** Les numéros de retrait et
   les pièces KYC déjà en base sont chiffrés avec elle. Une autre valeur rend
   ces données illisibles. La changer plus tard impose une migration de
   re-chiffrement.
2. **`NEXT_PUBLIC_*` est figé au build.** Si vous modifiez
   `NEXT_PUBLIC_APP_URL` ou la clé anon, il faut **redéployer**, pas seulement
   redémarrer.
3. **`SASPAY_MODE=sandbox`.** Il n'existe encore aucun adaptateur SasPay dans
   le code (`SASPAY_*` n'est lu nulle part). Ces variables sont réservées à
   **PAY2** ; `live` n'aurait aucun effet aujourd'hui et serait trompeur.

### 1.5 État de `.env.local` (local)

| Constat | Action |
|---|---|
| `NEXT_PUBLIC_APP_URL=http://localhost:3000` | normal en local, **ne pas** copier tel quel |
| `SUPABASE_SERVICE_ROLE_KEY` commentée | **à ajouter aussi en local** pour que le checkout mock fonctionne après la migration §3 |
| `MOCK_WEBHOOK_SECRET` absente | ajoutée le 6/11 (valeur aléatoire de 64 caractères) |
| `SASPAY_MODE=sandbox`, clé `sk_test_` | cohérent |
| Brevo, R2, chiffrement, cron | complets |

---

## 2. Supabase

### 2.1 Même projet qu'en local

Projet `gewibhqxizbzohbgnorh`, région `eu-west-1`. La production utilise donc
**la base déjà remplie** : c'est volontaire, cela évite de rejouer 65 migrations.

### 2.2 Vérifier que le schéma est complet

Le dépôt contient 55 tables et 133 fonctions. Impossible de vérifier l'état
distant sans mot de passe base ou jeton CLI (le CLI n'est pas connecté sur ce
poste). La vérification fiable tient en une requête :

1. Supabase → **SQL Editor**
2. Coller le contenu de **`docs/sql/verifier-production.sql`**
3. Attendre **0 ligne** sur les trois blocs

Le premier bloc liste les tables absentes, le deuxième les fonctions absentes,
le troisième les RPC encore ouvertes à `anon`.

### 2.3 Appliquer la nouvelle migration de sécurité — OBLIGATOIRE

Fichier : `supabase/migrations/20261106100000_mock_payment_service_only.sql`.

Il révoque l'exécution de `confirm_mock_payment` et `record_payment_intent`
pour les rôles `anon` et `authenticated`, et la réserve à `service_role`.

**Pourquoi c'est bloquant :** la clé anon est publique (elle est dans le
bundle navigateur). Avec la clé anon, n'importe qui pouvait appeler
`confirm_mock_payment` sur sa propre commande en attente et la marquer payée,
donc obtenir des articles sans paiement, avec écriture au ledger.

**Ordre recommandé :** déployer le code (§4), puis immédiatement exécuter la
migration dans le SQL Editor. Dans cet ordre, il n'y a aucune fenêtre de
rupture du checkout.

> Le code utilise désormais `createServiceClient()` pour ces deux appels. Sans
> la clé `service_role`, le checkout mock échoue proprement
> (`checkoutPaymentFailed`) au lieu de contourner le contrôle.

### 2.4 URL d'authentification — OBLIGATOIRE

Supabase → **Authentication → URL Configuration** :

- **Site URL** : `https://pashove.com`
- **Redirect URLs** :
  - `https://pashove.com/**`
  - `https://www.pashove.com/**`
  - `https://*.vercel.app/**` (previews)
  - `http://localhost:3000/**` (développement)

Sans cela, les liens de confirmation d'inscription et de réinitialisation
renvoient vers `localhost` ou sont refusés (`redirect_to not allowed`).

### 2.5 SMTP Supabase

Les e-mails **d'authentification** ne passent pas par Brevo API : ils passent
par le SMTP de Supabase. Vérifier **Authentication → SMTP Settings** :
`smtp-relay.brevo.com`, port `587`, login SMTP Brevo, clé SMTP Brevo (pas la
clé API). Sans cela, Supabase limite à quelques e-mails par heure.

### 2.6 Plan

Le plan gratuit met le projet en pause après 7 jours d'inactivité et ne prend
pas de sauvegardes. **Supabase Pro (~25 $/mois) est requis avant l'ouverture
commerciale.**

---

## 3. Nettoyage avant déploiement

### 3.1 Fait dans ce lot

- Correction de la faille `confirm_mock_payment` (§2.3).
- `MOCK_WEBHOOK_SECRET` généré : le webhook mock ne retombe plus sur la valeur
  par défaut `mock_dev_secret`, qui est publique dans le dépôt.

### 3.2 À décider par vous (données)

| Élément | Recommandation |
|---|---|
| `pay1.admin2@pashove.test` | compte de test banni. Le **garder** : des écritures du ledger le référencent en `created_by`. Le ledger est immuable. |
| `th2.test@…`, autres comptes `*.pashove.test` | bannir ou supprimer **si aucun ledger ne les référence**. Vérifier avant : `select count(*) from ledger_entries where created_by = '<id>';` |
| `Boutique Partenaire` | passer en `draft` (elle contient des commandes de test). |
| `ODI SHOP` | déjà en brouillon, rien à faire. |
| `maboutie` | **garder** : c'est la boutique de démonstration du site public. Remplacer les produits de test par une vraie sélection avant une démo commerciale. |
| 26 commandes / 62 écritures de ledger | **ne pas supprimer** (ledger immuable). Pour des statistiques propres, créer un projet Supabase de production séparé plus tard. |
| Paniers ouverts de test | supprimables : `delete from carts where status = 'open' and created_at < now() - interval '7 days';` |

### 3.3 Ce qu'il ne faut pas faire

- Ne pas consolider les migrations : elles sont la seule trace du schéma.
- Ne pas réinitialiser la base : elle contient les données de chiffrement
  (`ENCRYPTION_KEY` liée), la boutique de démo et l'historique.

---

## 4. Créer le projet Vercel

### 4.1 Prérequis

- Pousser le dépôt : `git push origin main` (**84 commits en attente** au 6/11).
- Le dépôt GitHub `pashove-app/pashove` doit être accessible à Vercel.

### 4.2 Plan — point important

| Besoin | Hobby | Pro (20 $/mois) |
|---|---|---|
| Cron `*/15 * * * *` | ❌ refusé (1 exécution/jour max, 2 crons) | ✅ |
| Usage commercial | ❌ interdit par les CGU | ✅ |
| Sauvegardes / logs | limités | ✅ |

`vercel.json` déclare deux crons, dont un toutes les 15 minutes. **Prendre
Pro**, sinon le déploiement échoue ou les e-mails restent bloqués en file.

### 4.3 Création

1. **vercel.com → Add New → Project**
2. Importer `pashove-app/pashove`
3. **Framework Preset** : Next.js (détection automatique)
4. **Root Directory** : `./`
5. **Build Command** : `npm run build`
6. **Install Command** : laisser par défaut (`npm ci`, lockfile présent)
7. **Node.js Version** : `22.x` (Next 16 exige ≥ 20.9)
8. **Environment Variables** → coller `.env.vercel` (§1)
9. **Deploy**

### 4.4 Réglages après le premier déploiement

- **Settings → Functions → Region** : `dub1` (Dublin), pour rester au plus près
  de Supabase `eu-west-1`. La région par défaut (`iad1`, États-Unis) ajoute
  ~100 ms à chaque requête base.
- **Settings → Deployment Protection** : vérifier que la **Production** n'est
  pas protégée par « Vercel Authentication », sinon `pashove.com` demandera un
  login Vercel.
- **Settings → Domains** : §5.

### 4.5 Vérifier avant le domaine

Sur l'URL `*.vercel.app` :

- `/fr` et `/en` répondent ;
- `/fr/auth/register` s'affiche ;
- `/fr/store/maboutie` s'affiche ;
- `/platform-admin` redirige vers la connexion.

---

## 5. Brancher `pashove.com` (Cloudflare DNS)

### 5.1 Dans Vercel

1. **Project → Settings → Domains → Add**
2. Ajouter `pashove.com`
3. Ajouter `www.pashove.com`
4. Vercel affiche **les enregistrements exacts à créer** — ce sont ceux-là
   qu'il faut recopier, ils peuvent varier selon le projet.

### 5.2 Dans Cloudflare

**DNS → Records** :

- Supprimer tout `A`/`AAAA`/`CNAME` existant sur `@` ou `www` qui pointe
  ailleurs (souvent l'ancien hébergeur ou une page parking).
- Créer l'enregistrement indiqué par Vercel pour `@`. Le plus courant :
  `A @ 76.76.21.21`, **Proxy désactivé** (nuage gris).
- Créer `CNAME www cname.vercel-dns.com`, **Proxy désactivé**.

### 5.3 Ce qu'il ne faut pas toucher

Les enregistrements **MX**, **TXT SPF**, **DKIM** (`brevo1._domainkey`,
`brevo2._domainkey`, `zmail._domainkey`) et **DMARC** portent les e-mails
Pashove. Y toucher casse `noreply@pashove.com` et les e-mails
d'authentification.

### 5.4 Pourquoi « DNS only » (nuage gris)

Avec le proxy Cloudflare activé, Vercel voit l'IP de Cloudflare et l'émission
du certificat peut échouer ou boucler. Le plus simple est de laisser Vercel
gérer le TLS. Si vous voulez garder le proxy plus tard : Cloudflare
**SSL/TLS → Full (strict)** et conserver le mode « DNS only » sur les
enregistrements de validation.

### 5.5 Redirection `www`

Une fois les deux domaines validés : **Vercel → Domains**, choisir le domaine
principal `pashove.com` et vérifier que `www.pashove.com` redirige vers lui
(bouton « Redirect »).

### 5.6 Vérification

```bash
dig +short pashove.com
dig +short www.pashove.com
curl -I https://pashove.com
curl -I https://www.pashove.com
```

Attendre la propagation (quelques minutes à quelques heures) et le certificat
Vercel (`Ready`).

---

## 6. Sous-domaine `*.pashove.com` — plus tard (B3)

Ne **pas** l'ajouter maintenant : le code ne résout pas encore le `host` vers
une boutique, donc tous les sous-domaines afficheraient la même chose.

À faire avec **B3 — domaines personnalisés** :

1. ajouter `*.pashove.com` dans Vercel ;
2. `CNAME * cname.vercel-dns.com`, DNS only, dans Cloudflare ;
3. résoudre le `host` vers `stores.slug` dans `src/proxy.ts` ;
4. vérifier les domaines personnalisés et leurs certificats.

---

## 7. Après le déploiement — vérifications

### 7.1 Fonctionnel

- [ ] `https://pashove.com` → redirige vers `/fr`
- [ ] `https://pashove.com/en` répond
- [ ] Inscription : l'e-mail de confirmation arrive et le lien pointe vers
      `https://pashove.com/...`
- [ ] Connexion / déconnexion
- [ ] `/fr/store/maboutie` et une fiche produit
- [ ] Ajout au panier et checkout mock (après la migration §2.3)
- [ ] `/platform-admin` accessible seulement aux admins
- [ ] Upload d'image depuis l'admin marchand (R2)

### 7.2 E-mails

- [ ] Un e-mail Brevo part (commande test)
- [ ] `email_messages` se remplit et le cron la vide
- [ ] Vérifier les en-têtes : SPF `pass`, DKIM `pass`

### 7.3 Crons

- [ ] `GET https://pashove.com/api/cron/emails` sans en-tête → `401`
- [ ] Avec `Authorization: Bearer <CRON_SECRET>` → `200`
- [ ] **Vercel → Logs → Cron Jobs** : les deux tâches s'exécutent

### 7.4 R2

Configurer le **CORS** du bucket public pour autoriser les envois depuis :

```
https://pashove.com
https://www.pashove.com
http://localhost:3000
```

### 7.5 Base

- [ ] `docs/sql/verifier-production.sql` → 0 ligne
- [ ] `ENCRYPTION_KEY` identique au local : un numéro de retrait existant se
      déchiffre encore
- [ ] Sauvegardes Supabase activées

---

## 8. SasPay — ordre correct

Le code n'a **aucun** adaptateur SasPay aujourd'hui : `SASPAY_*` n'est lu
nulle part et la seule route de webhook est
`/api/payments/webhook/mock`. Créer le webhook chez SasPay maintenant
pointerait vers une URL inexistante (404).

Ordre :

1. ✅ déployer `pashove.com` (ce lot) ;
2. **PAY2** : adaptateur SasPay, création d'intention, webhook signé,
   encaissement et décaissement ;
3. créer le webhook SasPay vers
   `https://pashove.com/api/payments/webhook/saspay` ;
4. tester en `sandbox` avec la clé `sk_test_` ;
5. passer en `live` seulement avec des clés live et après validation.

Tant que PAY2 n'est pas livré, **ne pas prendre de commandes réelles** : le
seul moyen de paiement est le mock.

---

## 9. Récapitulatif de la séquence

```
1. git push origin main
2. Remplir SUPABASE_SERVICE_ROLE_KEY dans .env.vercel
3. Ajouter la clé service_role à .env.local (local)
4. Supabase : URL d'authentification + SMTP (§2.4, §2.5)
5. Vercel : projet + variables + Deploy (plan Pro, région dub1)
6. Vercel : domaines pashove.com + www.pashove.com
7. Cloudflare : A @ + CNAME www, DNS only, sans toucher MX/SPF/DKIM
8. Attendre le certificat, tester sur mobile
9. Supabase SQL Editor : appliquer 20261106100000_mock_payment_service_only.sql
10. docs/sql/verifier-production.sql → 0 ligne
11. CORS R2 + vérifications §7
```
