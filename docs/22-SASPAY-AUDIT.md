# PASHOVE — Audit API SasPay (PAY2)

> 7 novembre 2026. Source de vérité : la spécification OpenAPI officielle
> `https://docs.saspay.me/api-reference/openapi.json` (version **1.0.0**,
> 37 routes), croisée avec les pages `docs.saspay.me/*.md` et des appels
> réels non authentifiés sur `https://api.saspay.me`.
>
> Aucune ligne de code PAY2 n'a été écrite avant cet audit.

---

## 0. Verdict en trois lignes

1. Les deux 404 sont **normaux** : `GET /wallets/` et `GET /payments/`
   n'existent pas. Les vrais chemins sont `GET /merchant-balances/` et
   `GET /transactions/`.
2. **Il n'existe aucun `MerchantCode` dans cette API.** Le marchand est
   identifié par la clé `sk_...` elle-même.
3. Tout le reste est documenté, y compris la signature des webhooks. Deux
   points bloquants restent à trancher avec SasPay avant de coder les
   décaissements (§10).

---

## 1. Pourquoi tes deux tests renvoient du HTML 404

Preuves obtenues en interrogeant l'API sans clé :

| Appel | Résultat | Interprétation |
|---|---|---|
| `GET /api/v1/wallets/` | **404 HTML** (Django) | route inexistante |
| `GET /api/v1/payments/` | **404 HTML** | route inexistante |
| `GET /api/v1/merchant-balances/` | **401 JSON** | route existante, clé manquante |
| `GET /api/v1/transactions/` | **401 JSON** | route existante |
| `POST /api/v1/payments/softpay/` | **401 JSON** | route existante |
| `GET /api/v1/payments/<uuid>/verify/` | **401 JSON** | route existante |
| `GET /api/v1/payments/<uuid>/` | **404 HTML** | n'existe pas |

**Règle de diagnostic** : sur cette API, un chemin inconnu renvoie du **HTML**
(Django), un chemin connu sans clé renvoie du **JSON `401`**. C'est le test le
plus rapide pour vérifier un endpoint sans consommer de clé.

La page `payments.md` parle de « poll `GET /payments/{id}/` » : c'est une
coquille de la doc. Le chemin réel est **`/payments/{payment_id}/verify/`**.

---

## 2. Base, authentification, conventions

```
Base URL   https://api.saspay.me/api/v1
Auth       Authorization: Bearer sk_live_...   (ou sk_test_...)
Scopes     PAYIN · PAYOUT · BOTH
```

- Clé **serveur uniquement**. Elle donne accès à tout le compte.
- `Idempotency-Key: <uuid ≤ 255 caractères>` — optionnel, mais obligatoire en
  pratique sur tout ce qui bouge de l'argent.
- Limite : **300 requêtes authentifiées / minute / compte**.
- Montants : **chaîne décimale** (`"2500.00"`), jamais un nombre. XOF aussi
  avec deux décimales.
- Devises : doivent correspondre au pays (`XOF` pour BJ/CI/SN/BF/TG/ML/NE,
  `XAF` pour CM/GA/CG…).

### Enveloppe de réponse — attention, la doc se contredit

- Erreur réelle observée : `{"success":false,"error":{"detail":"…"},"code":401}`
- Exemple de succès dans la spec softpay : objets **à plat**
  (`{"message":…,"id":…,"status":…}`)
- Le quickstart affirme : « tout est dans `data` ».

→ **Ne pas coder un parseur rigide.** Lire d'abord `data` s'il existe, sinon
l'objet racine ; lire `error.detail` ou `message`.

### Codes d'erreur

| HTTP | Sens |
|---|---|
| 400 | corps invalide |
| 401 | clé absente / invalide |
| 403 | scope insuffisant, compte suspendu, **IP non whitelistée** |
| 404 | ressource inconnue |
| 409 | Idempotency-Key réutilisée avec un autre corps, état terminal |
| 410 | lien / session expiré |
| 422 | valide mais non exécutable (fonds insuffisants, routage impossible) |
| 429 | débit dépassé |

Codes métier fréquents : `api_key_scope_forbidden`, `invalid_method`,
`invalid_country`, `invalid_customer`, `no_route_available`,
`prepayment_otp_missing`, `otp_not_applicable`, `otp_confirmation_failed`,
`not_retryable`, `currency_country_mismatch`, `ip_not_whitelisted`,
`not_found`.

---

## 3. Les 37 routes (liste exhaustive)

| Méthode | Path | Usage PAY2 |
|---|---|---|
| POST | `/checkout-sessions/` | option — page hébergée |
| GET | `/checkout-sessions/` | — |
| GET | `/checkout-sessions/{id}/` | — |
| GET | `/checkout-sessions/{id}/status/` | — |
| POST | `/checkout-sessions/{id}/cancel/` | — |
| GET | `/countries/` | public, sans clé |
| GET | `/countries/{id}/` | — |
| GET | `/exchange-rates/` | — |
| **GET** | **`/merchant-balances/`** | **solde** |
| GET | `/merchant-balances/{id}/` | solde d'un pays |
| GET | `/merchant-webhooks/` | lecture seule |
| GET | `/merchant-webhook-subscriptions/` | lecture seule |
| GET | `/webhook-logs/` | debug livraisons |
| GET | `/networks/` | codes réseau |
| GET | `/networks/{id}/` | — |
| POST | `/payment-links/` | — |
| GET/PATCH/PUT/DELETE | `/payment-links/{id}/` | — |
| GET | `/payment-links/{id}/transactions/` | — |
| **POST** | **`/payments/softpay/`** | **encaissement** |
| **POST** | **`/payments/{payment_id}/confirm-otp/`** | **OTP post-push** |
| POST | `/payments/{payment_id}/retry/` | relance |
| **GET** | **`/payments/{payment_id}/verify/`** | **statut** |
| **POST** | **`/payouts/initialize/`** | **décaissement** |
| **GET** | **`/payouts/{payout_id}/verify/`** | **statut payout** |
| GET | `/pricing/my-rates/` | tarifs + OTP |
| GET | `/transactions/` | historique |
| GET | `/transactions/{id}/` | détail |
| GET | `/transactions/export/` | CSV |
| GET | `/transactions/{id}/invoice/` | PDF |
| GET | `/transaction-attempts/` | routage |
| GET | `/transaction-status-logs/` | audit statuts |
| GET/POST | `/wallet-transfers/` | transfert inter-pays |
| GET | `/wallet-transfers/{id}/` | — |

> `POST /settlements/` est cité dans l'introduction (retraits vers ton propre
> compte) mais **absent de cette spec**. Ne pas l'utiliser : pour payer un
> tiers, c'est `/payouts/initialize/`.

---

## 4. Spécifications détaillées

### 4.1 Solde — `GET /merchant-balances/`

Query : `page` (défaut 1), `page_size` (défaut 20, max 100). Pas de filtre pays.

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "d3a2b1c0-1111-2222-3333-444455556666",
      "merchant": "8a1f5c3e-0000-1111-2222-333344445555",
      "country": "BJ",
      "currency": "XOF",
      "available_amount": "1450300.00",
      "pending_amount": "150000.00",
      "is_frozen": false,
      "created_at": "2026-06-01T08:00:00Z",
      "updated_at": "2026-08-12T09:45:00Z"
    }
  ]
}
```

Un wallet par couple **marchand × pays**, pas par devise. `is_frozen: true`
bloque tous les décaissements (les encaissements passent encore).

Détail : `GET /merchant-balances/{id}/` (même objet).

### 4.2 Réseaux — `GET /networks/`

Paginé (`page`, `page_size` ≤ 100), authentifié, pas de filtre pays.

```json
{
  "count": 1,
  "results": [
    {
      "id": "9b0c1d2e-…",
      "country": "6d1a3f2e-…",   // UUID, pas le code ISO
      "code": "mtn_bj",
      "name": "MTN Mobile Money",
      "is_active": true
    }
  ]
}
```

C'est **la** source des codes réseau (`mtn_bj`, `moov_bj`, `orange_ci`…).
`/countries/` renvoie 202 pays du monde, pas les réseaux disponibles.

### 4.3 Tarifs et OTP — `GET /pricing/my-rates/`

Query optionnelle `merchant` (ignorée avec une clé API).

```json
[
  {
    "country_code": "CI",
    "currency": "XOF",
    "network_code": "orange_ci",
    "network_name": "Orange Money",
    "payin": {
      "available": true,
      "otp_required": true,
      "otp_instructions": "Sur votre téléphone, composez #144*82# …",
      "tiers": [
        {
          "min_amount": "0.00", "max_amount": "500000.00",
          "percent": "2.500", "fixed": "0.00",
          "floor_amount": "50.00", "cap_amount": null,
          "fee_charge_mode": "ADD_ON"
        }
      ]
    },
    "payout": { "available": true, "otp_required": false, "tiers": [ … ] }
  }
]
```

**À appeler avant chaque softpay** : `otp_required` décide s'il faut demander
un code au client *avant* le paiement (Orange Money CI et BF).

### 4.4 Encaissement — `POST /payments/softpay/`

Scope `PAYIN` ou `BOTH`. `Idempotency-Key` fortement recommandé.

```json
{
  "amount": "2500.00",
  "currency": "XOF",
  "country": "BJ",
  "description": "Commande #1027",
  "network": "mtn_bj",
  "customer": {
    "email": "client@example.com",
    "first_name": "Awa",
    "last_name": "Sossou",
    "phone": "+22997505050"
  },
  "metadata": { "order_token": "…" },
  "fee_charge_mode": "ADD_ON",
  "otp": "482913"
}
```

Obligatoires : `amount`, `currency`, `country`, `customer` (les 4 champs),
`network`. Optionnels : `description`, `metadata`, `fee_charge_mode`,
`preferred_gateway`, `otp` (OTP **pré**-paiement), `merchant` (ignoré avec une
clé API), `return_url` (obligatoire pour `card` et `crypto` selon la doc de la
page, bien qu'absent du schéma OpenAPI).

Réponse `201` :

```json
{
  "message": "Payment pushed successfully",
  "id": "9c3f2a10-4b7e-4f1a-9d2e-9b6a7c1e4a02",
  "status": "PENDING",
  "checkout_url": ""
}
```

Selon la page `softpay.md`, la réponse peut aussi contenir `instructions`
(push USSD) et `bank_transfer` (uniquement `allbanks_ng`, Nigeria).

**Ordre de traitement côté Pashove :**

1. `checkout_url` non vide → **rediriger** le client (Wave, Orange Money,
   Djamo, cartes). Sinon le client ne reçoit rien sur son téléphone.
2. `bank_transfer` présent → afficher le compte virtuel et son `expires_at`.
3. Sinon push direct → afficher `instructions`, puis attendre webhook ou
   sondage.
4. Un réseau peut changer de mode sans préavis → tester `checkout_url`
   **toujours**, jamais par hypothèse.

Statuts : `PENDING` → `SUCCESS` | `FAILED` | `CANCELLED`.

### 4.5 OTP après push — `POST /payments/{payment_id}/confirm-otp/`

Uniquement pour les réseaux qui envoient un SMS après le push
(**Coris Bénin**, **Wizall Sénégal**). À ne pas confondre avec l'OTP
pré-paiement, qui se met dans le corps de `softpay`.

```json
{ "otp": "482913" }
```

`200` → `{"id":"…","status":"SUCCESS"}`.
Erreurs : `400 otp_not_applicable`, `409 no_attempt`,
`422 otp_confirmation_failed`, `404 not_found`.

### 4.6 Statut — `GET /payments/{payment_id}/verify/`

`payment_id` = l'`id` UUID renvoyé par softpay. Relit toujours l'état réel côté
gateway quand le statut local est `PENDING`.

```json
{
  "message": "Payment transaction fetched successfully",
  "id": "9c3f2a10-…",
  "reference": "TXN-20260812-000512",
  "transaction_type": "PAIEMENT",
  "flow_direction": "INBOUND",
  "requested_amount": "2500.00",
  "fee_charge_mode": "ADD_ON",
  "client_fee": "37.50",
  "gateway_fee": "20.00",
  "platform_fee": "17.50",
  "debited_amount": "2537.50",
  "net_amount": "2500.00",
  "currency": "XOF",
  "status": "SUCCESS",
  "external_reference": "PWP-8827311",
  "created_at": "2026-08-12T09:58:11Z",
  "updated_at": "2026-08-12T09:58:47Z"
}
```

Pour la comptabilité : utiliser `net_amount` (ce que Pashove reçoit) et
`debited_amount` (ce que le client paie), jamais `requested_amount` seul.

### 4.7 Relance — `POST /payments/{payment_id}/retry/`

Rejoue le routage sur la **même** transaction (même `id`). Corps facultatif :

```json
{ "methods": ["moov_bj"], "preferred_gateway": "…" }
```

`200` → `{"id":"…","checkout_url":""}`. `409 not_retryable` si déjà `SUCCESS`.

### 4.8 Décaissement — `POST /payouts/initialize/`

Scope `PAYOUT` ou `BOTH`. **IP du serveur whitelistée** (voir §10).

```json
{
  "amount": "10000.00",
  "currency": "XAF",
  "country": "CM",
  "description": "Remboursement commande #778",
  "method": "mtn_cm",
  "customer": { "phone": "+237677889900" },
  "recipient": { "msisdn": "677889900" },
  "metadata": { "payout_id": "…" },
  "fee_charge_mode": "DEDUCTED"
}
```

Obligatoires : `amount`, `currency`, `country`, `customer`, `method`,
`recipient.msisdn`. `Idempotency-Key` recommandé (sinon double décaissement).

Réponse `201` :

```json
{ "message": "Payout transaction initialized successfully",
  "id": "a4b5c6d7-e8f9-4a0b-8c1d-2e3f4a5b6c7d" }
```

Erreurs : `403 ip_not_whitelisted`, `422 currency_country_mismatch`,
`403 api_key_scope_forbidden`.

Statut : `GET /payouts/{payout_id}/verify/` (même forme que 4.6, avec
`transaction_type: "RETRAIT"`, `flow_direction: "OUTBOUND"`).

> **Payout ≠ settlement.** Le payout envoie des fonds à un bénéficiaire
> mobile money. Le settlement (retrait de ton solde SasPay vers ton propre
> compte) n'est pas dans cette version de l'API : il se fait depuis le
> dashboard.

### 4.9 Checkout hébergé — `POST /checkout-sessions/`

Alternative si on ne veut pas choisir le réseau côté Pashove. **Pas
d'`Idempotency-Key`** : un double appel crée deux sessions (sans conséquence
financière).

```json
{
  "amount": "5000.00",
  "currency": "XOF",
  "description": "Facture #1042",
  "country": "BJ",
  "customer_email": "client@example.com",
  "customer_name": "Awa Sossou",
  "customer_phone": "",
  "return_url": "https://pashove.com/fr/store/…/commande"
}
```

Réponse `201` : objet complet avec `checkout_url`
(`https://pay.saspay.me/checkout/<slug>`), `status: "PENDING"`, `expires_at`.

---

## 5. Le `MerchantCode` : il n'existe pas

Recherche dans la spec : **0 occurrence** de `merchant_code` / `MerchantCode`.

- L'identité du marchand vient de la **clé API**. Le champ `merchant` (UUID)
  est même explicitement « ignoré pour une clé API (toujours vous-même) ».
- `X-Merchant-Id` n'existe que pour les jetons **dashboard** gérant plusieurs
  marchands — inutile avec une clé `sk_…`.
- L'UUID du marchand est visible dans la réponse de `GET /merchant-balances/`
  (champ `merchant`) ou dans une réponse de création de clé.

**D'où vient la confusion ?** `MerchantCode` + `NetworkCode` (`63902` pour
M-PESA, `63903` Airtel…) sont les champs de **SasaPay Kenya**
(`docs.sasapay.app`, `sandbox.sasapay.app`), un service **différent** de
SasPay (`saspay.me`). Même quasi-nom, autre API, autre auth (OAuth
client_credentials), autres payloads. Ne pas mélanger les deux docs.

→ Rien à chercher sur `app.saspay.me` : il n'y a pas de MerchantCode à
configurer. Le dashboard sert à créer la clé, choisir les webhooks et le
secret de signature.

---

## 6. Flux encaissement mobile money, de A à Z

```
1. GET /pricing/my-rates/
   → choisir (country, network), lire payin.available et otp_required

2. si otp_required (Orange CI / BF)
   → demander le code USSD au client AVANT, le garder pour l'étape 3

3. POST /payments/softpay/   (Idempotency-Key = UUID de la commande Pashove)
   → 201 { id, status: "PENDING", checkout_url, instructions? }

4. selon la réponse :
   a. checkout_url non vide → rediriger le navigateur vers cette URL
   b. bank_transfer présent → afficher le compte virtuel (Nigeria)
   c. sinon push → le client reçoit une demande sur son téléphone
      - si réseau à OTP post-push (Coris BJ, Wizall SN) : saisir le SMS
        puis POST /payments/{id}/confirm-otp/ { otp }

5. confirmation :
   - webhook signé `transaction.success` / `transaction.failed`
   - et/ou sondage GET /payments/{id}/verify/ toutes les 3–5 s

6. enregistrer id SasPay dans payments.provider_reference
   → le webhook ne renvoie pas notre order_token de façon garantie
```

**Le client ne reçoit pas forcément d'OTP** : seulement sur les réseaux
post-push, et seulement après le push. Sur un push simple, il valide
directement sur son téléphone (USSD / notification).

**Où mettre l'id de commande Pashove ?** `metadata`, mais la spec ne garantit
pas qu'il soit renvoyé dans le webhook. La seule clé fiable est donc
`payments.id` SasPay, à stocker au moment du softpay.

---

## 7. Flux décaissement (retrait vers un marchand)

```
1. vérifier le solde : GET /merchant-balances/ → available_amount, is_frozen
2. POST /payouts/initialize/  (Idempotency-Key = UUID du payout Pashove)
   → 201 { id }
3. GET /payouts/{id}/verify/  jusqu'à SUCCESS / FAILED
4. webhook transaction.success / transaction.failed (même format)
```

Prérequis non négociables : scope `PAYOUT`/`BOTH`, **IP whitelistée**,
solde suffisant dans le wallet du pays, devise cohérente avec le pays.

---

## 8. Webhooks et signature

Création : **dashboard uniquement** (pas d'API). On peut seulement lire
`/merchant-webhooks/`, `/merchant-webhook-subscriptions/` et `/webhook-logs/`.

### En-têtes

| En-tête | Contenu |
|---|---|
| `X-Webhook-Signature` | HMAC-SHA256 hexadécimal minuscule |
| `X-Webhook-Timestamp` | Unix, en secondes |
| `X-Webhook-Event` | ex. `transaction.success` |

### Calcul

```text
message   = timestamp + "." + corps_brut
signature = hex( HMAC-SHA256( signing_secret, message ) )
```

Vérifications obligatoires :
1. `|now - timestamp| ≤ 300` s ;
2. HMAC sur le **corps brut** (jamais sur un JSON re-sérialisé) ;
3. comparaison à temps constant (`timingSafeEqual`).

Le `signing_secret` est propre à chaque webhook, **affiché une seule fois** à
la création ou à la rotation (dashboard → Webhooks → Changer le secret).

### Événements

`transaction.created`, `transaction.success`, `transaction.failed`,
`transaction.cancelled`, `settlement.requested|approved|success|failed|cancelled`,
`wallet_transfer.requested|completed|rejected`, `webhook.test`.

Les événements `settlement.*` sont annoncés comme **instables** par la doc.

### Charge utile

```json
{
  "event": "transaction.success",
  "data": {
    "id": "7c1a…",
    "reference": "TXN-2026-000456",
    "type": "PAIEMENT",
    "status": "SUCCESS",
    "amount": "25000.00",
    "fee": "625.00",
    "charged": "25625.00",
    "net_amount": "25000.00",
    "fee_charge_mode": "ADD_ON",
    "currency": "XOF",
    "country": "BJ",
    "network": "mtn_bj",
    "msisdn": "22990000000"
  }
}
```

Seuls `transaction.success` et `wallet_transfer.completed` sont documentés en
détail. Les autres n'ont **pas** de schéma publié.

### Livraison

- 5 tentatives : immédiat, +30 s, +5 min, +30 min, +2 h ; timeout 15 s ;
- ensuite `FAILED` définitif, renvoi manuel possible depuis le dashboard ;
- répondre **200 vite**, sans traitement long (le vrai travail se fait après).

### Idempotence

Un même événement peut arriver plusieurs fois. Clé d'unicité : `data.id`
(UUID de transaction SasPay). Le rejeu doit être sans effet.

---

## 9. Plan de test sans risquer d'argent

Tu n'as qu'une clé `sk_live_` : **chaque softpay déplace de l'argent réel**.
Deux options, dans l'ordre de préférence :

1. **Créer une clé `sk_test_`** (environnement SANDBOX) si le dashboard le
   permet, et faire tous les tests dessus.
2. Sinon, tester en live avec **100 XAF/XOF** sur ton propre numéro.

### Étape 0 — routes et auth (aucun argent)

```bash
# public, sans clé
curl -s https://api.saspay.me/api/v1/countries/ | head -c 200

# authentification
curl -s https://api.saspay.me/api/v1/merchant-balances/ \
  -H "Authorization: Bearer $SASPAY_API_KEY"

# réseaux disponibles
curl -s "https://api.saspay.me/api/v1/networks/?page_size=100" \
  -H "Authorization: Bearer $SASPAY_API_KEY"

# tarifs + OTP requis
curl -s https://api.saspay.me/api/v1/pricing/my-rates/ \
  -H "Authorization: Bearer $SASPAY_API_KEY"
```

### Étape 1 — softpay 100

```bash
curl -s -X POST https://api.saspay.me/api/v1/payments/softpay/ \
  -H "Authorization: Bearer $SASPAY_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "amount": "100.00",
    "currency": "XOF",
    "country": "BJ",
    "network": "mtn_bj",
    "description": "Test Pashove PAY2",
    "customer": {
      "email": "ibrahim@example.com",
      "first_name": "Ibrahim",
      "last_name": "Sidibe",
      "phone": "+229XXXXXXXX"
    }
  }'
```

Puis, avec l'`id` renvoyé :

```bash
curl -s https://api.saspay.me/api/v1/payments/<id>/verify/ \
  -H "Authorization: Bearer $SASPAY_API_KEY"
```

### Étape 2 — webhook

1. Dashboard → Webhooks → créer `https://<ton-domaine>/api/payments/webhook/saspay`
2. S'abonner à `transaction.success`, `transaction.failed`, `transaction.created`
3. Copier le `signing_secret` **immédiatement** (affiché une fois)
4. Déclencher un `webhook.test` depuis le dashboard, vérifier la signature
5. En cas d'échec : `GET /webhook-logs/` montre le payload et la réponse

### Étape 3 — payout 100

À ne faire **qu'après** avoir réglé la whitelist IP (§10). Même endpoint que
§4.8 avec `amount: "100.00"`, `recipient.msisdn` = ton numéro.

### Étape 4 — seulement ensuite

Brancher le checkout Pashove, puis les remboursements/payouts.

---

## 10. Deux points bloquants à trancher avant de coder

### 10.1 Whitelist IP des payouts vs Vercel

La spec l'exige pour un appel par clé API :

```json
{ "message": "IP non autorisée pour les payouts — ajoutez l'IP de votre
  serveur à la whitelist IP de votre marchand.", "code": "ip_not_whitelisted" }
```

Or les fonctions Vercel n'ont **pas d'IP de sortie fixe** en Hobby/Pro. Le
décaissement en production échouera en `403 ip_not_whitelisted` si la
whitelist est vide ou fermée.

Trois issues possibles, à confirmer avec SasPay :
1. la whitelist est **facultative** (vide = pas de restriction) → rien à faire ;
2. SasPay accepte une **plage CIDR** → impossible à garantir avec Vercel ;
3. il faut une **IP fixe** → petit proxy VPS, ou IP statique Vercel
   (offre Enterprise), ou déclencher les payouts depuis un serveur dédié.

→ **Question à poser au support SasPay avant d'écrire le code payout.**

### 10.2 Une clé `sk_test_` existe-t-elle pour ton compte ?

Tout le reste peut se tester en live avec 100, mais les scénarios d'échec
(réseau indisponible, OTP raté, timeout) ne se provoquent pas à volonté. Une
clé sandbox rendrait PAY2 testable sans argent réel.

---

## 11. Questions à envoyer au support SasPay

1. La whitelist IP des payouts est-elle obligatoire ? Peut-on la laisser vide ?
   Accepte-t-elle des CIDR, et quelle est la procédure pour un hébergement
   serverless (Vercel) sans IP fixe ?
2. Existe-t-il une clé `sk_test_` (SANDBOX) pour mon marchand ?
3. Le `metadata` envoyé au softpay est-il renvoyé dans le webhook ?
   (non documenté)
4. Quels sont les montants minimum et maximum par réseau au Bénin ?
5. `POST /settlements/` est cité dans l'introduction mais absent de l'OpenAPI
   1.0.0 : est-ce disponible, et sous quel chemin ?
6. Le corps de réponse du softpay est-il à plat ou sous `data` ?
   (la doc et la spec se contredisent)

---

## 12. Ce qu'il ne faut pas faire

- Ne pas appeler `/wallets/`, `/payments/`, `/payments/{id}/` (404 garantis).
- Ne pas chercher un `MerchantCode` : il n'existe pas.
- Ne pas confondre `docs.saspay.me` (West/Central Africa) et `docs.sasapay.app`
  (Kenya) : deux sociétés, deux API.
- Ne pas envoyer un montant numérique : toujours une chaîne `"100.00"`.
- Ne pas réutiliser une `Idempotency-Key` avec un corps différent → `409`.
- Ne pas se fier à un statut `PENDING` mémorisé : `verify/` avant de conclure.
- Ne pas créer le webhook avant que la route `saspay` existe (404 sur leurs
  tentatives, 5 échecs → `FAILED`, renvoi manuel obligatoire ensuite).

---

## 13. Découpage PAY2 proposé (après réponses 10.1 et 10.2)

1. **PAY2a** — `SasPayProvider` : `createIntent` (softpay), `verify`,
   `handleWebhook` signé. Aucun payout.
2. **PAY2b** — route `/api/payments/webhook/saspay` + stockage
   `provider_reference` + idempotence sur `data.id`.
3. **PAY2c** — branchement checkout : `checkout_url`, OTP pré/post, statuts.
4. **PAY2d** — payout admin, une fois la question IP réglée.
5. **PAY2e** — réconciliation : `GET /transactions/` + `webhook-logs`.
