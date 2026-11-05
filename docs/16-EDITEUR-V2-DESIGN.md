# PASHOVE — Editeur de thème V2 (design)

> 5 novembre 2026 — refonte de l’expérience d’édition, inspirée de la structure
> des éditeurs e-commerce professionnels (Shopify), avec l’identité Pashove.

## Pourquoi

L’éditeur V1 ressemblait à un long formulaire. La V2 sépare clairement :

1. une **barre supérieure** : retour, boutique, page, aperçu desktop/mobile,
   lien vitrine, enregistrement ;
2. un **panneau latéral** : sections, blocs, thème, couleurs, typographie ;
3. une **zone d’aperçu** : navigateur simulé, vraie vitrine, vrais produits.

## Structure

- Plein écran (`fixed inset-0`) pour ne pas être mélangé au dashboard.
- Barre supérieure blanche, bouton Enregistrer noir, statut Actif.
- Panneau blanc de 304 px, scrollable, avec groupes :
  - En-tête ;
  - Modèle (bannière, produits, collections, paquets) ;
  - Pied de page ;
  - Sections personnalisées.
- Ajout de bloc : palette texte, image, vidéo, newsletter, FAQ, témoignages.
- Détail d’un bloc : panneau dédié avec retour, visibilité, suppression et
  champs adaptés au type.
- Thème : modèles, couleurs, typographie, réinitialisation.
- Aperçu : cadre navigateur, produits réels de la boutique, blocs rendus,
  bascule desktop/mobile.
- Mobile : panneau en feuille latérale, aperçu plein écran, bouton Sections.

## Vérifications

- Build, TypeScript et lint verts.
- Captures desktop, mobile, panneau thème, panneau bloc et bibliothèque.
- Aucun changement de schéma nécessaire : mêmes actions `save_store_theme` et
  `save_store_blocks`.

## Limites

- L’aperçu est un rendu local : il ne reflète pas encore les modifications
  non enregistrées dans la vraie vitrine.
- Pas encore d’undo/redo, de versions ni de glisser-déposer dans le panneau
  latéral (les flèches restent disponibles).
- Les couleurs du panneau sont volontairement claires ; la vitrine garde le
  thème du marchand.


## Preset Dwell

Ajouté le 5/11/2026 : fond ivoire `#F4F1EA`, surfaces blanches, texte
`#1A1A1A`, accent terre cuite `#8B6F47`, titres en serif. Le preset est
disponible dans la bibliothèque aux côtés de Pashove, Ivoire, Forêt et Minuit.
