# PASHOVE — Configuration des e-mails professionnels

> **À faire maintenant.** Indépendant de tous les autres comptes. ~25 minutes.
> Objectif : des e-mails `@pashove.com` qui **reçoivent ET envoient**, visibles depuis votre Gmail
> aujourd'hui, et branchables dans l'admin Pashove plus tard.

---

## ⚠️ À lire d'abord : la vérité sur Cloudflare Email Routing

Vous avez demandé à créer les e-mails « sur Cloudflare ». **Ce n'est pas possible tel quel.**

**Cloudflare Email Routing :**
- ✅ Redirige `contact@pashove.com` → une adresse vérifiée (votre Gmail)
- ❌ Ne crée **aucune boîte** — rien n'est stocké, aucun historique
- ❌ Ne peut **pas envoyer** d'e-mail
- ⚠️ **Entre en conflit** avec tout autre hébergeur mail (les deux veulent les enregistrements MX)

**Conséquence :** il faut **deux outils**, chacun son rôle :

| Besoin | Outil retenu |
|---|---|
| Boîtes humaines (`contact@`, `support@`…) — **envoi + réception** | **Zoho Mail** (gratuit, 5 boîtes, domaine perso) |
| E-mails automatiques de l'app (commandes, KYC, retraits…) | **Resend** (gratuit, 3 000/mois) |
| Redirections simples / alias secondaires | Cloudflare Email Routing *(optionnel, sur un sous-domaine)* |

> ⚠️ **MX : un seul propriétaire.** Si Zoho prend les MX, Cloudflare Email Routing ne peut pas
> prendre le domaine principal. On choisit donc **Zoho** pour `pashove.com`.

---

## ÉTAPE 1 — Choisir les adresses

| Adresse | Usage |
|---|---|
| `contact@pashove.com` | Contact général (affiché sur le site) |
| `support@pashove.com` | Support marchands & clients |
| `hello@pashove.com` | Accueil / démo |
| `billing@pashove.com` | Facturation / abonnements |
| `noreply@pashove.com` | Expéditeur automatique (Resend) |
| `legal@pashove.com` | Juridique / conformité |
| `admin@pashove.com` | Administration |

> Zoho gratuit = 5 boîtes. Les autres = **alias** (gratuits, illimités).

---

## ÉTAPE 2 — Zoho Mail (comptes réels)

1. Aller sur **zoho.com/mail** → *Sign up* → **Mail Hosting for a custom domain**.
2. Vérifier la propriété du domaine : Zoho vous donne un **TXT** à ajouter.
3. Dans **Cloudflare → DNS → Records**, ajouter ce TXT (`TXT`, nom `@`, valeur fournie, TTL Auto).
4. Revenir dans Zoho → *Verify*.
5. Zoho affiche les **MX** à configurer :

   | Type | Nom | Valeur | Priorité |
   |---|---|---|---|
   | MX | `@` | `mx.zoho.com` | 10 |
   | MX | `@` | `mx2.zoho.com` | 20 |
   | MX | `@` | `mx3.zoho.com` | 50 |

6. **Dans Cloudflare**, ajouter ces 3 MX. **Proxy : désactivé** (les MX ne se proxifient pas).
7. Ajouter les enregistrements d'authentification Zoho :
   - `TXT @` : `v=spf1 include:zoho.com ~all`
   - Le **DKIM** fourni par Zoho (`zmail._domainkey`)
8. Créer les **boîtes** `contact@`, `support@`, `hello@`, `billing@`, `admin@`
   → puis les **alias** `noreply@`, `legal@` vers l'une d'elles.

### Voir tout sur votre Gmail dès maintenant
Pour chaque boîte Zoho : *Settings → Mail forwarding* → ajouter **ibrahimes132@gmail.com**.
→ Tout arrive sur votre Gmail actuel pendant la construction.

### Répondre depuis `contact@pashove.com` dans Gmail
1. Gmail → *Paramètres → Comptes → Envoyer des e-mails en tant que* → *Ajouter*.
2. Nom : `Pashove`. Adresse : `contact@pashove.com`.
3. Serveur SMTP Zoho : `smtp.zoho.com`, port `465`, SSL, identifiants = la boîte Zoho.
4. Valider avec le code reçu.

> Vous recevez et répondez depuis Gmail, **en tant que** `@pashove.com`. Aucun changement visible pour vos interlocuteurs.

---

## ÉTAPE 3 — DMARC (à ne pas oublier)

Dans Cloudflare DNS, ajouter :

| Type | Nom | Valeur |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:admin@pashove.com; pct=100` |

Sans DMARC, vos e-mails risquent le **spam** et certains webhooks/notifications échouent silencieusement.

---

## ÉTAPE 4 — Resend (e-mails automatiques de l'app)

> KYC, confirmations de commande, liens d'accès numérique, alertes de retrait…

1. Créer le compte **resend.com** 🔴.
2. Ajouter le domaine **`mail.pashove.com`** (⚠️ **sous-domaine dédié**, pour ne pas polluer la
   réputation de `pashove.com` — bonne pratique professionnelle).
3. Resend fournit les enregistrements à ajouter dans Cloudflare DNS :
   - `TXT mail` → SPF Resend
   - `TXT resend._domainkey.mail` → DKIM
   - `MX mail` → `feedback-smtp.resend.com` (priorité 10) pour les bounces
4. Vérifier le domaine dans Resend.
5. Récupérer `RESEND_API_KEY` → `.env.local`.

> Emails transactionnels : **jamais** envoyés depuis `pashove.com` directement.
> Toujours depuis `mail.pashove.com`. Le domaine principal reste propre pour les boîtes humaines.

---

## ÉTAPE 5 — La boîte e-mail **dans l'admin Pashove** (plus tard)

Vous voulez « un espace dans l'admin pour envoyer et recevoir des e-mails ».
Le module `apps`/`/platform-admin/emails` s'appuiera sur :

| Option | Techno | Avantage |
|---|---|---|
| **A (recommandée)** | **Zoho Mail API** | Boîtes déjà créées, API REST, OAuth, threads, pièces jointes |
| B | IMAP/SMTP brut | Universel, mais gestion des threads/dossiers à la main |
| C | Resend Inbound + Postgres | Très contrôlé, mais il faut gérer nous-mêmes tout le dépôt/storage |

**Décision : option A.** Le module admin offrira : liste des boîtes, fil de conversation,
envoi, réponse, pièces jointes, assignation à un agent, modèles.

> À construire en **Phase 5**. Pour l'instant, Zoho reste l'outil de travail.

---

## Récapitulatif DNS final pour `pashove.com`

| Type | Nom | Valeur | Rôle |
|---|---|---|---|
| MX ×3 | `@` | `mx.zoho.com` / `mx2` / `mx3` | Réception Zoho |
| TXT | `@` | `v=spf1 include:zoho.com ~all` | SPF |
| TXT | `zmail._domainkey` | *(fourni Zoho)* | DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; …` | DMARC |
| TXT | `mail` | *(SPF Resend)* | Resend |
| TXT | `resend._domainkey.mail` | *(DKIM Resend)* | Resend |
| MX | `mail` | `feedback-smtp.resend.com` (10) | Bounces Resend |
| A / CNAME | `@` et `www` | *(fourni Vercel)* | Site |

---

## Ce que je fais de mon côté dès que c'est prêt

- Je code les **templates d'e-mails** (React Email) : vérification, commande, paiement, KYC, retrait…
- Je branche **Resend** sur les événements de l'application.
- Je prépare le **module boîte e-mail admin** (Phase 5).

**Transmettez-moi :** `RESEND_API_KEY` et la confirmation que les DNS Zoho sont verts.
