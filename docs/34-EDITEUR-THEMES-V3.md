# PASHOVE — Éditeur de thèmes V3 (constructeur visuel)

> 15 novembre 2026 — constructeur complet inspiré des éditeurs e-commerce
> professionnels, adapté au mobile-first, au français et aux moyens de paiement
> Pashove.

## Principe

Le marchand construit sa boutique sans coder :

```
THÈME → MODÈLES → SECTIONS → BLOCS → PARAMÈTRES
```

- **Thème** : design complet (`Pashove Dawn`, presets Mode / Beauté / etc.).
- **Modèle** : accueil, produit, collection, liste de collections, page, blog,
  article, recherche, panier, 404, mot de passe. Des modèles personnalisés
  peuvent être créés et affectés à un produit ou une collection précis.
- **Section** : 46 types (bannière, diaporama, collection en vedette,
  multicolonnes, témoignages, FAQ, newsletter, en-tête, pied de page, etc.).
- **Bloc** : titre, texte, image, bouton, diapositive, colonne, témoignage,
  question, produit, collection, lien, etc.
- **Paramètres** : dix onglets (Contenu, Médias, Disposition, Typographie,
  Couleurs, Espacements, Bordures, Effets, Visibilité, Avancé).

Le **document JSON** est la source de vérité de l’éditeur. Les tables
normalisées en sont le miroir pour les API et les intégrations. La vitrine ne
lit que le document **publié**.

## Écran

- **Zone A** — barre supérieure : Sections / Paramètres du thème / Intégrations,
  nom + statut, menu du thème (renommer, code, traductions, dupliquer,
  télécharger, versions, aperçu partageable, réinitialiser), sélecteur de
  marché, sélecteur de modèle, annuler/rétablir, inspecteur, ordinateur /
  tablette / mobile, aperçu, enregistrer, publier.
- **Zone B** — structure : en-tête, modèle, pied de page ; sections et blocs
  avec œil (masquer), menu (renommer, monter, descendre, dupliquer, supprimer),
  glisser-déposer souris **et tactile**, déplacement de bloc entre sections
  compatibles.
- **Zone C** — aperçu réel de la boutique, mis à jour en direct (debounce
  100 ms). Clic dans l’aperçu = sélection ; l’inspecteur surligne les sections.
- **Zone B2** — paramètres de l’élément sélectionné ou paramètres généraux du
  thème (logo, favicon, palettes, typographie, mise en page, animations,
  éléments visuels, réseaux sociaux, recherche, devise, panier, CSS, style,
  traductions).

Sur téléphone, les trois zones s’empilent (barre inférieure
Structure / Aperçu / Paramètres) et les boutons font au moins 44 px.

## Fonctionnalités

- **Brouillon / publié** : publier demande une confirmation et copie le
  brouillon vers le document public.
- **Sauvegarde automatique** toutes les 30 secondes + copie locale de secours.
- **Annuler / rétablir** (Ctrl+Z / Ctrl+Y), raccourcis Ctrl+S, Ctrl+/,
  Shift+flèches.
- **Historique de versions** : une version à chaque enregistrement explicite,
  50 conservées, restauration en un clic.
- **Aperçu partageable** : jeton opaque, expiration 7 jours, sans publication.
- **Méta-champs** : connecter un texte à une donnée produit / collection /
  page / article / boutique, avec valeur de repli.
- **Applications** : app embeds activables ; app blocks ajoutables au modèle en
  un clic depuis le panneau Intégrations.
- **Paiements réels** : les moyens affichés viennent de l’éligibilité calculée
  en base (`checkout_payment_methods`) — un moyen non configuré n’apparaît pas.
- **Mobile** : sur téléphone, l’éditeur s’ouvre directement en aperçu 390 px,
  panneaux empilés et commandes tactiles.
- **Marchés** : Mali, Sénégal, Côte d’Ivoire, Ghana, France, International.
- **Visibilité** : par appareil, par audience (connecté / invité), par marché.

## Base de données

Migration `20261114100000_theme_editor.sql` :

- `themes`, `theme_templates`, `theme_sections`, `theme_blocks`,
  `theme_settings`, `theme_versions`, `theme_assets` ;
- `metafields`, `app_embeds`, `app_blocks` ;
- `theme_template_assignments`, `theme_preview_links`.

Toutes les tables sont sous RLS (`is_store_member`). Les écritures passent par
des RPC `security definer` qui vérifient l’appartenance à la boutique : un
`store_id` forgé par le client ne peut jamais viser une autre boutique.

Fonctions principales : `theme_editor_load`, `theme_create`, `theme_duplicate`,
`theme_save_draft`, `theme_publish`, `theme_restore_version`,
`theme_assign_template`, `theme_create_preview`, `public_store_theme_document`,
`public_theme_preview`, `public_theme_assignment`, `public_metafields`.

## Routes

- `/app/themes` — liste des thèmes.
- `/app/themes/[id]/editor` — éditeur complet.
- `/app/themes/[id]/versions` — historique.
- `/api/themes` et `/api/themes/[id]/*` — CRUD, sections, blocs, aperçu,
  publication, duplication, affectations.
- `/api/metafields` — méta-champs.
- `/store/[slug]/preview/[token]` — aperçu public d’un brouillon.
- La vitrine (`/store/[slug]` et toutes ses pages) rend le thème publié et
  retombe sur l’ancien thème si aucun thème n’est publié.

## Vérifications

- `npm run build` : ✅
- `npx tsc --noEmit` : ✅
- `npx jest` : 19 tests ✅ (document de thème et moyens de paiement)
- `npm run lint` : 0 erreur (avertissements existants uniquement)
- Migration appliquée sur le projet Supabase `pashove`.
- Test E2E `e2e/theme-editor.spec.ts` : parcours connexion → thème → section →
  titre → enregistrement → publication (activé par `E2E_EMAIL`,
  `E2E_PASSWORD`, `E2E_STORE_SLUG`, `E2E_PUBLISH=1`).

## Limites connues

- Les captures authentifiées de l’éditeur restent à produire : le test E2E
  génère `editor-desktop.png`, `editor-section.png`, `editor-mobile.png` et
  `storefront-publie.png` dès qu’un compte de test est fourni.
- L’aperçu est un rendu local du document ; le lien « Aperçu » ouvre la vraie
  vitrine avec le brouillon.
- Les sections avancées (Liquid, HTML, CSS) sont optionnelles et destinées aux
  marchands avancés.
- L’éditeur n’édite pas encore les fichiers de thème bruts (pas de `.liquid`).
