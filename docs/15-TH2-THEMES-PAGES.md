# PASHOVE — TH2 : blocs, pages, navigation, blog et contact

> 5 novembre 2026 — la vitrine devient éditoriale, sans code arbitraire.

## Refonte visuelle (5/11/2026)

L’éditeur a été reconstruit en trois zones professionnelles : barre supérieure,
panneau de sections et aperçu desktop/mobile. Voir
`docs/16-EDITEUR-V2-DESIGN.md`.

## Ce qui est livré

### Editeur de blocs

`/app/online-store/editor` accepte désormais des blocs en plus des sections :
texte, image, vidéo, newsletter, FAQ et témoignages.

- ajout, suppression, activation/désactivation ;
- réorganisation par glisser-déposer et par flèches ;
- champs par type : titre, texte, URL d’image/vidéo, bouton, liens, éléments
  FAQ ou témoignages ;
- stockage déclaratif dans `store_themes.blocks` (20 blocs maximum) ;
- rendu public dans `ThemeBlocks`, après les sections produits/collections/
  paquets.

### Pages de boutique

- table `store_custom_pages` : slug, titre, contenu Markdown, brouillon/publiée ;
- éditeur `/app/online-store/pages` avec création et modification ;
- route publique `/store/[slug]/pages/[slug]` ;
- les pages légales existantes restent servies par la même route ;
- rendu Markdown sûr : HTML échappé, liens limités à http(s), `/` et `#`.

### Navigation

- table `store_nav_items` : libellé, lien, position, visibilité ;
- éditeur `/app/online-store/navigation` ;
- l’en-tête et le menu mobile utilisent les liens personnalisés dès qu’il en
  existe au moins un, sinon la navigation par défaut reste active.

### Blog

- table `store_blog_posts` : slug, titre, résumé, Markdown, couverture,
  brouillon/publié, date de publication ;
- éditeur `/app/online-store/blog` ;
- routes publiques `/store/[slug]/blog` et `/blog/[postSlug]` ;
- rendu Markdown partagé avec les pages.

### Contact

- page publique `/store/[slug]/contact` ;
- formulaire nom, e-mail, message ;
- enregistrement dans `store_contact_messages` via `store_contact_submit` ;
- e-mail au marchand avec le gabarit `contact_message` ;
- aucun e-mail du visiteur n’est exposé publiquement.

## Sécurité et isolation

- Toutes les tables portent `store_id`.
- Les écritures vérifient l’appartenance à la boutique par RLS et par action.
- Les lectures publiques ne renvoient que les contenus publiés de boutiques
  actives.
- `store_contact_submit` valide les longueurs et n’accepte que les boutiques
  actives.
- Le Markdown est échappé avant transformation : aucun HTML arbitraire.

## Vérifications réelles

- Bloc « Notre histoire » ajouté et enregistré depuis l’éditeur ; sauvegarde
  confirmée en base.
- Page `about` créée puis publiée ; `/fr/store/maboutie/pages/about` répond 200
  et affiche le Markdown.
- Article `trois-pieces-saison` publié ; la liste et la fiche blog répondent.
- Lien « À propos » ajouté à la navigation ; l’en-tête de la vitrine l’affiche.
- Message de contact envoyé : ligne créée en base et e-mail `contact_message`
  tracé en mode console.
- Build, TypeScript et lint verts.
- Données de test supprimées.

## Limites

- Textes d’administration FR/EN ; BM, LN et AR retombent sur le français.
- Pas encore de versions de thème ni de restauration.
- Pas de SEO avancé, sitemap, domaines personnalisés ni blog multi-auteurs.
- Les images de blocs et de blog sont des URL ; l’upload direct dans l’éditeur
  viendra avec le prochain lot.
- La newsletter est un bloc de présentation avec CTA ; la collecte d’abonnés
  n’est pas encore branchée.
- Le contact n’a pas encore de limite de débit ni de captcha.
