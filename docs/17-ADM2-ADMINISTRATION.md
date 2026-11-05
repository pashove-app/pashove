# PASHOVE — ADM2 : administration complète

> 5 novembre 2026 — marchands, boutiques, utilisateurs, réglages et tableau de bord.

## Objectif

Donner à l’équipe Pashove une vue opérationnelle de la plateforme sans lui ouvrir
les données marchandes inutiles. Toutes les lectures et écritures passent par des
RPC `security definer` qui vérifient `is_platform_admin()` ; chaque action
sensible écrit dans `platform_audit_log`.

## Dashboard

`/platform-admin` affiche :

- GMV 30 jours, commandes payées, commissions en créance ;
- marchands actifs, boutiques actives, comptes ;
- graphique des ventes sur 30 jours ;
- alertes KYC, retraits, paiements échoués ;
- top 5 marchands par GMV.

RPC : `platform_dashboard()`.

## Marchands

`/platform-admin/merchants` : liste, recherche, filtres plan/statut, GMV,
boutiques, KYC, suspension/réactivation. Fiche détaillée : identité, boutiques,
commandes, retraits, KYC.

RPC : `platform_merchants()`, `platform_merchant_detail()`,
`platform_set_merchant_status()`.

## Boutiques

`/platform-admin/stores` : liste, recherche, statut, propriétaire, plan,
commandes, GMV. Fiche détaillée avec les dernières commandes.

RPC : `platform_stores()`, `platform_store_detail()`,
`platform_set_store_status()`.

## Utilisateurs

`/platform-admin/users` : tous les comptes, rôles, boutiques, commandes, statut.
Actions : suspension/réactivation et révocation des sessions. Les comptes
plateforme sont protégés.

RPC : `platform_users()`, `platform_user_detail()`,
`platform_set_user_status()`, `platform_reset_user_security()`.

## Réglages

`/platform-admin/settings` :

- édition des plans Free / Standard / Pro (commission bps, limites, prix) ;
- interrupteurs globaux (ouverture boutiques, paiements, cadeaux) ;
- gestion des rôles plateforme (super admin, admin, auditeur).

RPC : `platform_settings()`, `platform_save_plan()`,
`platform_save_setting()`, `platform_add_admin()`, `platform_remove_admin()`.

## Sécurité

- `is_platform_admin()` vérifié dans chaque RPC.
- Les comptes plateforme ne peuvent pas être suspendus.
- Le dernier super administrateur ne peut pas être retiré.
- Les sessions utilisateur peuvent être révoquées.
- Chaque action sensible est journalisée : acteur, action, cible, métadonnées,
  date.
- Les pages sont en `noindex`.

## Vérifications

- RPC dashboard, marchands, boutiques, utilisateurs et réglages testés.
- Suspension puis réactivation d’un marchand testé : boutiques suspendues,
  compte banni, deux entrées d’audit créées, puis état restauré.
- Build, TypeScript et lint verts.
- Données de test supprimées.

## Limites

- Les interrupteurs globaux sont enregistrés et auditables ; leur branchement
  complet aux parcours de création de boutique et de paiement reste à finaliser.
- Pas encore d’export CSV, de gestion des litiges, ni de double approbation.
- Les détails sont limités aux 30 dernières commandes et 20 derniers retraits.
