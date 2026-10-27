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

---

## Refonte premium PUB1 v2 — 26/10/2026

### Typographie et identité

- **Playfair Display** pour tous les grands titres, **Inter** pour le corps.
- Bleu Pashove conservé comme accent unique ; aucun rouge.
- Alternance de sections sombres `#05070D` / `#0A0E1A` et claires
  `#FAFAFA` / `#F4F6FB`.

### Accueil

- Hero sombre centré, titre serif avec le mot **croissance** sur un aplat bleu,
  boutons « Créer ma boutique » (bleu) et « Voir la démo » (ghost).
- Mini-stats : +10 pays, 0 FCFA, +64 méthodes (à venir), 2 boutiques.
- Section 6 grands chiffres avec icônes et **compteurs animés au scroll**.
- « Pourquoi Pashove ? » en quatre blocs alternés texte/mockup : Afrique,
  multi-boutiques, paiement à la livraison, partenaires.
- Témoignages de démonstration (3 cartes, initiales, boutique).
- Logo cloud structuré en huit emplacements vides, prêt pour les logos.
- CTA finale sombre, newsletter au-dessus du footer.

### Footer

Produit, Entreprise, Légal, Développeurs (API/Webhooks marqués « Bientôt »),
sélecteur FR/EN, contact, réseaux et copyright. Les liens sont réellement
localisés ; les pages non construites sont signalées au lieu de pointer dans le
vide.

### Animations

- Reveal fade + slide au scroll sur les sections (Framer Motion).
- Compteurs animés déclenchés à l’entrée dans le viewport, avec repli immédiat
  pour les onglets en arrière-plan.
- Parallaxe légère du mockup hero.
- Hover : élévation, ombre et bordure bleue sur les cartes ; boutons avec
  translation et ombre.
- `prefers-reduced-motion` respecté par CSS et par Framer Motion.

### Tarifs / fonctionnalités

Même langage visuel : hero serif sombre, cartes claires, CTA bleu, newsletter et
footer communs. Les plans restent alignés sur `plans` et les paiements en ligne
restent annoncés comme **en cours d’intégration**.

### Vérifications v2

- `/fr` et `/fr/pricing`, `/fr/features` répondent avec les bons titres.
- Compteurs à 2, +10, +64, +5 après passage dans le viewport ; valeurs finales
  affichées même dans un onglet non visible.
- Reveal : opacité 1 et transform none après scroll, testé dans un onglet
  visible simulé.
- Newsletter : soumission UI, message de confirmation, aucun envoi réseau.
- Sélecteur EN : `/fr` → `/en`, titre et contenu anglais.
- Aucun débordement à 390 px sur l’accueil, les tarifs et les fonctionnalités.
- Menu mobile plein écran avec liens, démo, langue et CTA.
- Build, types et lint verts.

---

## V2.1 — structure alignée sur les captures de référence

La structure de la page d’accueil reprend celle des captures fournies, avec
l’identité et les contenus Pashove :

- header clair, logo Pashove, navigation, connexion et CTA bleu ;
- hero dans une carte sombre arrondie, badge, grand titre serif, mot
  « croissance » sur un aplat bleu, deux CTA, quatre mini-stats avec icônes ;
- grand lecteur de démonstration sous le hero : vidéo réelle de 6 secondes
  générée à partir de captures Pashove, poster et modale avec contrôles ;
- quatre grands blocs produit alternés texte/image : boutique & catalogue,
  commandes & COD, thèmes, messagerie. Chaque bloc a son icône, son titre serif,
  son paragraphe, ses boutons et une carte de témoignage ;
- logo cloud avant la section sombre ;
- panneau sombre « Pourquoi choisir Pashove ? », titre avec mot « propulser »
  sur aplat bleu et six statistiques animées ;
- témoignages « Ils parlent de nous » ;
- CTA clair, newsletter sombre arrondie, footer sombre multi-colonnes.

### Actifs utilisés

Les médias sont des **captures réelles de l’application Pashove**, stockées dans
`public/marketing/` : vitrine, éditeur de thèmes, messagerie, commande, compte
et panier. La vidéo `demo.mp4` est une démonstration de 6 secondes générée à
partir de ces captures. Aucune image, vidéo, photo ou logo CinetPay n’est
utilisé : seule la composition des sections est reprise.

Les captures contiennent encore des données de démonstration (boutiques et
prénoms de test). Elles seront remplacées par des captures de production avant
le lancement public.

### Vérifications

- `demo.mp4` : `readyState = 4`, durée 5,49 s, lecture et modale de contrôle
  testées.
- Compteurs 0 FCFA / 2 / +10 / +64 / COD / +5 après scroll.
- Révélations au scroll et parallaxe testées dans un onglet visible simulé.
- Header et menu mobile clairs, CTA bleu, bascule FR/EN.
- Aucun débordement à 390 px.
- Build, TypeScript et lint verts.
