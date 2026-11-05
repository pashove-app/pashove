# PASHOVE — E1 : e-mails transactionnels

> 30/10/2026 — premier lot de la feuille de route « finir la plateforme ».
> Brevo en production, console en développement.

## Objectif

Aucun e-mail ne partait avant ce lot, sauf ceux d’authentification gérés par
Supabase. Un client pouvait commander sans recevoir de confirmation, et un
marchand ignorer qu’une vente venait d’arriver.

## Architecture

```
Server Action / Route
        │
        ▼
  src/lib/email/events.ts      ← événements métier, URL absolues
        │
        ▼
  src/lib/email/service.ts     ← préférences, destinataire, journalisation
        │
        ├── templates.ts       ← HTML + texte, FR/EN
        └── transport.ts       ← Brevo ou console
        │
        ▼
  email_messages (outbox)      ← service role uniquement
```

- `after()` de Next exécute l’envoi **après** la réponse : le client voit sa
  page de succès sans attendre Brevo, et un échec d’envoi ne casse jamais une
  commande.
- Un envoi ne lève jamais : toute erreur est journalisée.

## Événements branchés

| Événement | Déclencheur | Destinataire |
|---|---|---|
| Bienvenue | inscription | nouveau compte |
| Commande confirmée | checkout COD ou Mock | client |
| Nouvelle commande | checkout | marchand |
| Commande expédiée | `advance_order_status` → `shipped` | client |
| Commande livrée | `advance_order_status` → `delivered` | client |
| Commande annulée | `cancel_order` | client + marchand |
| Commande remboursée | `refund_cod_order`, `refund_payment` | client + marchand |
| Accès numérique | checkout avec produit numérique | client |
| Rendez-vous confirmé | checkout avec service | client |
| Invitation d’équipe | `inviteMemberAction` | invité |
| KYC approuvé / refusé | `review_kyc` | marchand |
| Retrait demandé | `request_payout` | marchand |
| Retrait traité | `admin_transition_payout` | marchand |

## Préférences marchand

`/app/settings/notifications` — quatre catégories : nouvelle commande,
annulations/remboursements, KYC, retraits. Table
`store_email_preferences`, une ligne par catégorie, **absence = activé**.

Les e-mails destinés aux clients ne sont pas désactivables : ce sont des
messages transactionnels liés à leur commande.

## Boîte d’envoi et reprise

`email_messages` conserve chaque envoi : gabarit, destinataire, objet, HTML,
statut, tentatives, erreur, identifiant fournisseur.

- statut `sent` : accepté par Brevo ;
- statut `failed` : programmé à +15 min ;
- `GET /api/cron/emails` reprend les échecs, **3 tentatives maximum**,
  25 messages par passage ;
- protégé par `Authorization: Bearer $CRON_SECRET` ;
- `vercel.json` planifie un passage toutes les 15 minutes.

La trace n’est écrite que si `SUPABASE_SERVICE_ROLE_KEY` existe. Sans elle, les
e-mails partent quand même — seuls l’historique et la reprise sont perdus.

## Console d’administration

`/platform-admin/emails` : liste filtrable (tous, envoyés, échecs, en file),
compteurs, détail avec aperçu HTML dans une iframe isolée et version texte.

## Variables d’environnement

| Variable | Rôle |
|---|---|
| `BREVO_API_KEY` | clé API Brevo (serveur) |
| `EMAIL_FROM` | `Pashove <noreply@pashove.com>` |
| `EMAIL_REPLY_TO` | adresse de réponse |
| `EMAIL_DRIVER` | `brevo`, `log`, ou vide (auto) |
| `CRON_SECRET` | protège la reprise |
| `SUPABASE_SERVICE_ROLE_KEY` | outbox + repli sur l’e-mail du propriétaire |

## Vérifications réelles

- Build de production vert, TypeScript vert, lint sans erreur.
- Migration `20261030100000_emails.sql` appliquée.
- Préférences : enregistrement et relecture sur la boutique active.
- E-mail de commande : rendu FR et EN contrôlé dans la console admin.
- Reprise : route cron refusée sans `CRON_SECRET`, acceptée avec.
- Envoi console vérifié sans clé Brevo ; Brevo réel à tester avec la clé.

## Limites

- Traductions d’e-mail **FR et EN** seulement ; BM, LN et AR retombent sur le
  français.
- Les e-mails marchand partent en français (la langue du profil n’est pas
  encore lue).
- Pas de désabonnement : les messages sont transactionnels.
- Pas de pièces jointes ni de modèles éditables par le marchand.
- Le rendu HTML n’est pas testé sur les clients de messagerie réels ; il est
  volontairement tabulaire et sans ressource externe.
- Le remboursement déclenché depuis l’administration exige le service role
  pour retrouver le contexte de commande.


## Refonte design du 5/11/2026

Le layout a été refait : logo réel, fond premium, Playfair/Inter, footer légal,
bouton ombré et responsive. Voir `docs/19-EMAILS-DESIGN.md`.
