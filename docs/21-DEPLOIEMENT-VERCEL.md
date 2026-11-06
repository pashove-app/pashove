# PASHOVE — Déploiement Vercel et DNS Cloudflare

> 5 novembre 2026 — procédure de mise en production de `pashove.com`.

## 0. Avant de cliquer sur Deploy

1. **Pousser les commits** : le dépôt local est actuellement **82 commits
   devant `origin/main`**.
   ```bash
   git push origin main
   ```
2. Vercel doit pouvoir lire le dépôt GitHub `pashove-app/pashove`.
3. Le domaine `pashove.com` est déjà délégué à Cloudflare.
4. Le projet Supabase est actif et toutes les migrations sont appliquées.

## 1. Variables d’environnement Vercel

À ajouter dans **Project → Settings → Environment Variables**, pour
**Production** et **Preview**.

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://pashove.com` |
| `NEXT_PUBLIC_APP_NAME` | `Pashove` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `fr` |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | `XOF` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gewibhqxizbzohbgnorh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | copier depuis `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | **absent du `.env.local` actuel** : copier depuis Supabase → Settings → API → `service_role` |
| `BREVO_API_KEY` | copier depuis `.env.local` |
| `EMAIL_DRIVER` | `brevo` |
| `EMAIL_FROM` | `Pashove <noreply@pashove.com>` |
| `EMAIL_REPLY_TO` | `support@pashove.com` |
| `ENCRYPTION_KEY` | **exactement la même valeur que `.env.local`** |
| `CRON_SECRET` | copier depuis `.env.local` ou générer une nouvelle valeur |
| `R2_ENDPOINT` | `https://ce026d4ffb380492a8e9fea9ff91c79d.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | copier depuis `.env.local` |
| `R2_SECRET_ACCESS_KEY` | copier depuis `.env.local` |
| `R2_BUCKET` | `pashove-files` |
| `R2_PRIVATE_BUCKET` | `pashove-files-private` |
| `R2_PUBLIC_URL` | `https://pub-4ef71a4ff50848b881fc86503a8fb29f.r2.dev` |
| `SASPAY_API_KEY` | copier depuis `.env.local` (clé `sk_test_`) |
| `SASPAY_WEBHOOK_SECRET` | copier depuis `.env.local` |
| `SASPAY_MODE` | `sandbox` |

### Pourquoi `ENCRYPTION_KEY` doit être identique

Les numéros de retrait et les numéros de document KYC déjà en base sont
chiffrés avec cette clé. Une clé différente en production rend ces données
illisibles. La changer plus tard nécessite une migration de re-chiffrement.

### `SUPABASE_SERVICE_ROLE_KEY`

Elle manque dans le `.env.local` actuel. Elle est indispensable pour :

- la boîte d’envoi `email_messages` ;
- le repli sur l’e-mail du propriétaire ;
- le cron de panier abandonné ;
- certaines opérations d’administration.

Elle ne doit **jamais** être préfixée `NEXT_PUBLIC_`.

## 2. Supabase

Le projet actif est `gewibhqxizbzohbgnorh` (région `eu-west-1`).

Les migrations récentes sont appliquées, notamment :

- `messages`, `store_themes`, `pay1_mock`, `emails_e1`, `gifts_g1` ;
- `store_v2_tables`, `store_v2_functions` ;
- `dwell_preset`, `adm2_core_dashboard`, `adm2_merchants_stores`,
  `adm2_users_settings` ;
- `m1_marketing_core`.

Avant le lancement public :

- passer le projet en **Supabase Pro** (le plan gratuit met le projet en pause
  après 7 jours d’inactivité) ;
- vérifier que les sauvegardes sont activées ;
- vérifier les policies RLS et les buckets R2.

Si vous préférez une base de production vierge, créez un second projet
Supabase et appliquez les fichiers `supabase/migrations/*.sql` dans l’ordre.

## 3. Nettoyage avant déploiement

À examiner, sans supprimer les écritures du ledger :

- `pay1.admin2@pashove.test` : compte banni, sans rôle plateforme ; il reste
  car des transactions du ledger le référencent (`created_by`). Le laisser
  banni ou l’anonymiser.
- `Boutique Partenaire` est active et contient des commandes de test.
  La passer en `draft` si elle ne doit pas être publique.
- `ODI SHOP` est déjà en brouillon.
- `maboutie` (« Pashove ») est la boutique de démonstration utilisée par le
  site public ; la garder, mais remplacer les produits de test par une vraie
  sélection avant une démonstration commerciale.
- Les 26 commandes et 62 écritures de ledger sont des données de test. Le
  ledger est immuable : elles ne doivent pas être supprimées. Pour des
  statistiques propres, utiliser un projet Supabase de production séparé.
- Les paniers de test ouverts peuvent être supprimés sans toucher au ledger.

## 4. Créer le projet Vercel

1. **vercel.com → Add New → Project**.
2. Importer `pashove-app/pashove`.
3. Framework preset : **Next.js**.
4. Root directory : `./`.
5. Build command : `npm run build`.
6. Install command : `npm install`.
7. Ajouter les variables de la section 1 pour **Production** et **Preview**.
8. Cliquer sur **Deploy**.
9. Vérifier l’URL `*.vercel.app` avant de brancher le domaine.

## 5. Brancher `pashove.com`

Dans **Vercel → Project → Settings → Domains** :

1. Ajouter `pashove.com`.
2. Ajouter `www.pashove.com`.
3. Vercel affiche les enregistrements DNS exacts à créer.

Dans **Cloudflare → pashove.com → DNS** :

- supprimer tout A/AAAA/CNAME existant sur `@` ou `www` qui pointe ailleurs ;
- créer l’enregistrement indiqué par Vercel pour `@` (généralement un A
  `76.76.21.21`) ;
- créer un CNAME `www` vers `cname.vercel-dns.com` ;
- laisser les enregistrements en **DNS only** (nuage gris) pendant
  l’émission du certificat SSL Vercel ;
- ne pas toucher aux MX, SPF, DKIM ou DMARC utilisés par Brevo/Zoho.

Attendre la validation Vercel, puis vérifier :

```bash
curl -I https://pashove.com
curl -I https://www.pashove.com
```

Configurer `www` en redirection vers `pashove.com` (ou l’inverse) dans Vercel.

## 6. Sous-domaine `*.pashove.com` — plus tard

Le code actuel ne route pas encore les boutiques par sous-domaine. Ajouter un
CNAME wildcard maintenant ferait répondre la même application sur tous les
sous-domaines.

À faire avec le lot B3 (domaines personnalisés) :

1. ajouter `*.pashove.com` dans Vercel ;
2. créer dans Cloudflare un CNAME `*` vers `cname.vercel-dns.com`, DNS only ;
3. implémenter la résolution du `host` vers le `store.slug` dans le proxy ;
4. ajouter la vérification des domaines personnalisés et les certificats.

## 7. SasPay après déploiement

Le webhook SasPay **ne peut pas encore être créé** : le projet n’a pas
d’adaptateur SasPay ni de route `/api/payments/webhook/saspay`. La seule route
existante est `/api/payments/webhook/mock`.

Ordre correct :

1. déployer `pashove.com` ;
2. construire **PAY2** : adaptateur SasPay, intention, webhook signé,
   encaissement et décaissement ;
3. créer le webhook SasPay vers
   `https://pashove.com/api/payments/webhook/saspay` ;
4. tester en sandbox avec la clé `sk_test_` ;
5. passer en live seulement avec des clés live et après validation.

## 8. Vérifications post-déploiement

- `/fr` et `/en` répondent.
- `/fr/auth/register` fonctionne.
- `/fr/store/maboutie` répond.
- Un e-mail de test Brevo part et apparaît dans les logs.
- `/platform-admin` est accessible uniquement aux admins.
- Les cron Vercel s’exécutent (nécessite un plan compatible ; le cron toutes
  les 15 minutes peut nécessiter Vercel Pro).
- Les uploads R2 fonctionnent : configurer le CORS du bucket public pour
  `https://pashove.com` et `http://localhost:3000`.
- Les cookies Supabase sont bien en `Secure` en production.
