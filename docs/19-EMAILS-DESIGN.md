# PASHOVE — Design des e-mails transactionnels

> 5 novembre 2026 — refonte premium des gabarits Brevo.

## Direction

Les e-mails reprennent l’identité du site public :

- logo Pashove réel, centré, servi depuis R2 public ;
- fond extérieur bleu très clair, carte blanche ;
- titre en Playfair Display avec repli Georgia ;
- corps en Inter avec repli système ;
- accent bleu `#2F5CFF`, en-tête supérieur bleu ;
- bouton pilule avec ombre et transition ;
- footer avec CGU, confidentialité, mentions légales et copyright ;
- version texte conservée pour les clients sans HTML.

## Responsive

Le gabarit est un tableau email compatible :

- largeur maximale 600 px ;
- media query à 600 px pour les paddings, le titre et le bouton ;
- logo fluide, largeur maximale 70 % ;
- texte qui se replie, pas de largeur fixe sur le contenu.

## Gabarits concernés

Tous les gabarits passent par le même layout : bienvenue, commande,
expédition, livraison, annulation, remboursement, accès numérique, rendez-vous,
invitation, KYC, retraits, cadeaux, contact, campagne et panier abandonné.

## Tests réels

- Rendu local desktop et mobile vérifié.
- Envoi réel Brevo vers `ibrahime@pashove.com` :
  - API **201** ;
  - `messageId` `<202611052351.39800581437@smtp-relay.mailin.fr>` ;
  - entrée visible dans les logs Brevo avec le sujet « Bienvenue sur Pashove ».
- Captures : bienvenue, commande, accès numérique, retrait, KYC refusé,
  version mobile.

## Limites

- Les polices web restent optionnelles : Gmail/Outlook peuvent afficher les
  replis Georgia/Inter système.
- Les liens d’action utilisent `NEXT_PUBLIC_APP_URL` ; en local ils pointent
  vers `localhost`, en production vers `pashove.com`.
- Pas encore de désabonnement pour les campagnes marketing.
