# PASHOVE — TH1 : thèmes de vitrine (V1)

> 26/10/2026 — première version de l’éditeur de thèmes.

## Périmètre livré

### Bibliothèque

`/app/online-store/themes` : quatre modèles installables en un clic.

- **Pashove** : bleu profond, sans empattement.
- **Ivoire** : fond chaud, terre cuite, serif.
- **Forêt** : vert dense, fond sombre.
- **Minuit** : violet nocturne.

Le modèle actif est marqué. Chaque carte montre un aperçu couleur et un lien
vers la vitrine.

### Éditeur

`/app/online-store/editor` :

- quatre couleurs (accent, fond, surfaces, texte) ;
- trois typographies (sans, serif, monospace) ;
- ordre et visibilité des sections **Produits**, **Collections**, **Paquets** ;
- aperçu vivant à droite ;
- enregistrement réel via `save_store_theme` ;
- lien vers Réglages → Boutique pour le titre et le sous-titre de la bannière ;
- réinitialisation au thème Pashove.

### Application à la vitrine

- `StorefrontShell` traduit le thème en jetons CSS hérités.
- `ThemeScope` pose temporairement les jetons sur `<html>` pour que les
  **portails** (panier, menu mobile) reçoivent aussi le thème, puis restaure
  l’état précédent à la sortie.
- La page d’accueil lit l’ordre et la visibilité des sections depuis
  `public_store_theme`.
- La bannière reprend le dégradé du thème (accent → fond).
- Les pages checkout restent contrôlées par la plateforme ; seuls les jetons
  visuels changent.

## Données

Table `store_themes` (une ligne par boutique) : preset, quatre couleurs, police,
sections JSON, `updated_at`.

RPC :

- `public_store_theme(slug)` — lecture publique, valeurs par défaut si aucune
  ligne ;
- `store_theme(store_id)` — lecture marchand ;
- `save_store_theme(...)` — écriture réservée aux membres, validation stricte
  des couleurs hexadécimales, de la police et des clés de section.

Aucune écriture directe sur la table ; RLS en lecture pour les membres.

## Vérifications

- Application du modèle **Ivoire** depuis l’éditeur puis depuis la bibliothèque.
- Vitrine : fond `rgb(250 247 242)`, texte `rgb(28 25 23)`, police Georgia,
  dégradé de bannière terre cuite.
- Panier mobile (portail) : fond ivoire et bouton terre cuite, donc les jetons
  atteignent bien les éléments hors de la coquille.
- Réorganisation des sections enregistrée en base, puis remise à l’ordre par
  défaut.
- `tsc`, eslint et `npm run build` verts.

## Limites V1

- Pas d’upload de police personnalisée.
- Pas d’éditeur de blocs libre, de sections personnalisées ni de versions.
- Pas de blog, pages, menus, domaines ou SEO.
- Les pages produit/collection/panier adoptent les couleurs et la typographie ;
  leur structure reste celle de la plateforme.
