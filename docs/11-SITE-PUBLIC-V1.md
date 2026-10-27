# PASHOVE — PUB1 : site public (V1)

> 26/10/2026 — première version du site public Pashove.

## Pages livrées

- `/{locale}` : accueil.
- `/{locale}/pricing` : tarifs.
- `/{locale}/features` : fonctionnalités.

Le proxy redirige `/` vers la langue négociée (`/fr` par défaut). Le site
partage les polices et les jetons Pashove, mais fixe volontairement un fond
nuit et un dégradé bleu pour rester indépendant du thème clair/sombre de la
vitrine.

## Contenu

### Accueil

- Hero avec badge « Le Commerce OS africain », titre, sous-titre, deux CTA
  (« Créer ma boutique », « Se connecter ») et trois preuves.
- Maquette de vitrine et de dashboard en CSS (aucune image externe) avec
  notifications commande et messagerie.
- Bande de chiffres : 2 boutiques, 5 langues, 0 FCFA, COD.
- « Pourquoi Pashove ? » : 4 arguments (Afrique, sans stock obligatoire,
  paiement à la livraison, messagerie).
- « Comment ça marche » : 3 étapes.
- « La plateforme » : 6 fonctionnalités avec lien vers `/features`.
- Aperçu tarifs et CTA final.
- Footer complet.

### Tarifs

- Free 0 FCFA, commission 10 %, 2 boutiques, 5 membres.
- Standard 25 000 FCFA/mois, commission 2 %, 5 boutiques, 15 membres.
- Pro 45 000 FCFA/mois, commission 0 %, 10 boutiques, 50 membres.
- Boutons « Commencer gratuitement » vers l’inscription.
- Encart honnête : le paiement à la livraison est disponible ; les paiements
  mobile money et carte sont **en cours d’intégration**. Aucune promesse de
  paiement en ligne actif.

### Fonctionnalités

- Quatre familles : boutique & catalogue, vendre & encaisser, grandir, piloter.
- 16 cartes avec icônes, dont les fonctions livrées (multi-boutiques, numérique,
  services, COD, comptes clients, thèmes, messagerie, partenaires, finance,
  rôles, cinq langues).
- Les paiements en ligne portent le badge **Bientôt**.
- Feuille de route explicite, sans dates inventées.

## Navigation

- Header sticky : logo, Fonctionnalités, Tarifs, Connexion, « Créer ma
  boutique », menu mobile en portail.
- Footer : produit, entreprise, légal (Mentions, CGU, Confidentialité), contact.
- Locale : contenu français et anglais ; bambara, lingala et arabe retombent
  sur le français pour cette V1.

## Vérifications

- `/` redirige en 307 vers `/fr`.
- `/fr`, `/fr/pricing`, `/fr/features` répondent 200 avec les bons titres.
- Tous les CTA « Créer ma boutique » et « Commencer gratuitement » pointent vers
  `/{locale}/auth/register`.
- Les liens légaux pointent vers `/legal/mentions`, `/legal/cgu`,
  `/legal/confidentialite`.
- Header sticky vérifié après défilement ; menu mobile ouvert/fermé, en portail.
- Aucun débordement horizontal à 390 px sur les trois pages.
- `tsc`, eslint et `npm run build` verts.

## Limites V1

- Sous-pages marketing (`/themes`, `/payments`, `/help`, `/docs`, `/status`,
  `/blog`) non construites.
- Pas de formulaire de contact ni de capture d’e-mail.
- Contenu éditorial dans un module TypeScript, pas encore en MDX/CMS.
- Bambara, lingala et arabe utilisent le contenu français.
- Les montants et promesses commerciales restent à valider avant lancement
  public ; le blueprint et la table `plans` font foi pour les limites.
