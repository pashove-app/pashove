# PASHOVE — G1 : cadeaux

> 4 novembre 2026 — achat cadeau, réclamation atomique, accès protégé.

## Objectif

Un client peut acheter un produit pour quelqu’un d’autre. Le destinataire
reçoit un lien privé, choisit un compte ou continue en invité, puis reçoit
l’accès numérique, l’adresse de livraison ou son créneau de service.

## Parcours

```
Checkout → case « C’est un cadeau »
        → destinataire, e-mail, message, date
        → commande payée
        → create_gift_claim()
        → droits numériques verrouillés + réadressés
        → e-mail au destinataire (immédiat ou programmé)
        → /gift/claim/[token]
        → réclamation atomique
        → /gift/claimed/[token]
        → téléchargement, adresse ou rendez-vous
```

## Base de données

### Colonnes

- `stores.gift_enabled` : active l’option au checkout.
- `orders.is_gift`, `orders.gift_scheduled_at`.
- `digital_entitlements.status` accepte `locked` : le fichier existe mais n’est
  visible ni par l’acheteur ni par le destinataire avant réclamation.

### `gift_claims`

| Colonne | Rôle |
|---|---|
| `token` | 32 caractères hexadécimaux, unique |
| `recipient_name`, `recipient_email` | destinataire |
| `message` | 500 caractères maximum |
| `status` | `pending`, `claimed`, `expired`, `cancelled` |
| `scheduled_at` | date d’envoi |
| `claimed_at`, `claimed_by` | traçabilité de la réclamation |

### Fonctions

- `create_gift_claim(order_token, …)` : vérifie que la commande est payée, que
  la boutique autorise les cadeaux, crée le jeton, verrouille les droits
  numériques, libère le créneau de service choisi par l’acheteur.
- `gift_claim_info(token)` : lecture publique limitée (boutique, articles,
  message, statut, date, droits numériques). Aucun e-mail de l’acheteur.
- `gift_claim(token, adresse…, créneau…)` : transaction `for update`, une seule
  réclamation possible, expiration à 90 jours, adresse physique ou créneau.
- `gift_download(token, entitlement_id)` : téléchargement invité, quota de
  3 téléchargements, lié au jeton et à la commande.
- `store_gift_claims(store_id)` / `received_gift_claims()` : listes marchand.
- `fulfill_paid_order()` : un remboursement révoque aussi les droits `locked`
  et annule le cadeau.

## Checkout

- Case « C’est un cadeau », quatre champs : nom, e-mail, message, date.
- La date vide signifie « immédiat ».
- Le serveur revérifie `gift_enabled`, la validité des champs et interdit un
  cadeau contenant plusieurs services.
- Les e-mails clients destinés au numérique et au rendez-vous ne partent pas
  pour l’acheteur quand c’est un cadeau.
- L’e-mail de nouvelle commande au marchand porte la mention du cadeau.

## E-mails

- `gift_received` : design premium, boutique, produit, message, bouton
  « Découvrir mon cadeau ».
- Envoyé immédiatement ou placé en file à `scheduled_at` (nécessite le service
  role pour la file ; sans lui, envoi immédiat).
- `gift_claimed` : l’acheteur apprend la réclamation, sans fichier joint.

## Interface

- `/gift/claim/[token]` : bandeau dégradé, boutique, articles, message, date,
  bouton « Créer un compte » recommandé et « Continuer en invité ».
- Produit physique : formulaire pays, ville, adresse, téléphone.
- Service : créneaux réels, retirés dès qu’ils sont réservés.
- `/gift/claimed/[token]` : succès, téléchargement invité, lien boutique.
- `/app/gifts` : onglets Envoyés, Reçus, Configuration.

## Vérifications réelles

- Commande checkout #1027 : cadeau créé, droit `locked`, e-mail du destinataire
  en base, acheteur sans accès.
- Réclamation invitée depuis `/gift/claim/[token]` : statut `claimed`, droit
  `available`, page de succès et téléchargement visibles.
- Commande synthétique #1026 : même cycle vérifié en SQL, jeton de 32 caractères.
- Cadeau physique #1028 : adresse remplacée par celle du destinataire.
- Cadeau service #1029 : ancien créneau libéré, nouveau créneau confirmé.
- `gift_download` : quota décrémenté.
- Build, TypeScript et lint verts.
- Toutes les données de test supprimées.

## Limites

- Textes FR/EN ; BM, LN, AR retombent sur le français.
- Un cadeau ne peut contenir qu’un seul service.
- Le lien de cadeau reste secret mais peut être partagé : le quota de
  téléchargement et l’expiration à 90 jours limitent l’abus.
- Sans `SUPABASE_SERVICE_ROLE_KEY`, l’e-mail programmé part immédiatement et
  l’avis « cadeau réclamé » à l’acheteur est omis.
- Pas encore de date d’envoi avec heure, ni de message éditable par le marchand.
