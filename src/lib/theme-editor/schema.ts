import type {
  BlockSchema,
  FieldSchema,
  SectionSchema,
  ThemePalette,
} from "@/lib/theme-editor/types";

export const FONT_OPTIONS = [
  { value: "sans", label: "Sans empattement (Geist)" },
  { value: "inter", label: "Inter" },
  { value: "serif", label: "Playfair Display" },
  { value: "georgia", label: "Georgia" },
  { value: "mono", label: "Monospace" },
  { value: "system", label: "Police du système" },
];

const ALIGN_OPTIONS = [
  { value: "left", label: "Gauche" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Droite" },
];

const HEIGHT_OPTIONS = [
  { value: "auto", label: "Automatique" },
  { value: "small", label: "Petite" },
  { value: "medium", label: "Moyenne" },
  { value: "large", label: "Grande" },
  { value: "custom", label: "Personnalisée" },
];

export const DEFAULT_PALETTES: ThemePalette[] = [
  {
    id: "palette-nuit",
    name: "Nuit",
    background: "#04060D",
    text: "#FFFFFF",
    muted: "#A7B0C0",
    accent: "#2F5CFF",
    buttonBg: "#2F5CFF",
    buttonText: "#FFFFFF",
    border: "#1A2131",
    badgePromo: "#2F5CFF",
    badgeSoldOut: "#6B7280",
    badgeNew: "#10B981",
  },
  {
    id: "palette-orange",
    name: "Orange",
    background: "#FFF8F1",
    text: "#1C1917",
    muted: "#57534E",
    accent: "#EA580C",
    buttonBg: "#EA580C",
    buttonText: "#FFFFFF",
    border: "#F1E3D3",
    badgePromo: "#EA580C",
    badgeSoldOut: "#78716C",
    badgeNew: "#16A34A",
  },
  {
    id: "palette-clair",
    name: "Clair",
    background: "#F9FAFB",
    text: "#111827",
    muted: "#6B7280",
    accent: "#111827",
    buttonBg: "#111827",
    buttonText: "#FFFFFF",
    border: "#E5E7EB",
    badgePromo: "#111827",
    badgeSoldOut: "#9CA3AF",
    badgeNew: "#059669",
  },
  {
    id: "palette-sombre",
    name: "Sombre",
    background: "#000000",
    text: "#F9FAFB",
    muted: "#9CA3AF",
    accent: "#F97316",
    buttonBg: "#F97316",
    buttonText: "#000000",
    border: "#27272A",
    badgePromo: "#F97316",
    badgeSoldOut: "#52525B",
    badgeNew: "#22C55E",
  },
];

const text = (
  key: string,
  label: string,
  tab: FieldSchema["tab"] = "content",
  extra: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  type: "text",
  tab,
  optional: true,
  defaultValue: "",
  ...extra,
});

const area = (
  key: string,
  label: string,
  tab: FieldSchema["tab"] = "content",
  extra: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  type: "textarea",
  tab,
  optional: true,
  defaultValue: "",
  ...extra,
});

const toggle = (
  key: string,
  label: string,
  tab: FieldSchema["tab"],
  defaultValue = false,
): FieldSchema => ({
  key,
  label,
  type: "toggle",
  tab,
  defaultValue,
});

const range = (
  key: string,
  label: string,
  tab: FieldSchema["tab"],
  min: number,
  max: number,
  defaultValue: number,
  extra: Partial<FieldSchema> = {},
): FieldSchema => ({
  key,
  label,
  type: "range",
  tab,
  min,
  max,
  step: 1,
  defaultValue,
  ...extra,
});

const select = (
  key: string,
  label: string,
  tab: FieldSchema["tab"],
  options: { value: string; label: string }[],
  defaultValue: string,
): FieldSchema => ({
  key,
  label,
  type: "select",
  tab,
  options,
  defaultValue,
});

const color = (
  key: string,
  label: string,
  tab: FieldSchema["tab"],
  defaultValue: string,
): FieldSchema => ({
  key,
  label,
  type: "color",
  tab,
  defaultValue,
});

export const COMMON_FIELDS: FieldSchema[] = [
  // Disposition
  select("sectionHeight", "Hauteur de la section", "layout", HEIGHT_OPTIONS, "auto"),
  range("sectionHeightCustom", "Hauteur personnalisée", "layout", 120, 1000, 520, {
    unit: "px",
  }),
  select(
    "contentWidth",
    "Largeur du contenu",
    "layout",
    [
      { value: "full", label: "Pleine largeur" },
      { value: "container", label: "Conteneur" },
      { value: "narrow", label: "Étroit" },
    ],
    "container",
  ),
  select("textAlign", "Position du texte", "layout", ALIGN_OPTIONS, "left"),
  select(
    "verticalAlign",
    "Alignement vertical",
    "layout",
    [
      { value: "top", label: "Haut" },
      { value: "center", label: "Centre" },
      { value: "bottom", label: "Bas" },
    ],
    "center",
  ),
  range("columnsDesktop", "Colonnes (ordinateur)", "layout", 1, 6, 3),
  range("columnsMobile", "Colonnes (mobile)", "layout", 1, 3, 1),
  range("columnGap", "Espacement entre colonnes", "layout", 0, 64, 20, {
    unit: "px",
  }),
  select(
    "mediaPosition",
    "Position du média",
    "layout",
    [
      { value: "left", label: "À gauche" },
      { value: "right", label: "À droite" },
      { value: "top", label: "Au-dessus" },
      { value: "bottom", label: "En dessous" },
    ],
    "left",
  ),
  toggle("showArrows", "Flèches de navigation", "layout", true),
  toggle("showDots", "Points de navigation", "layout", true),

  // Typographie
  select("headingFont", "Police du titre", "typography", FONT_OPTIONS, "sans"),
  range("headingSize", "Taille du titre", "typography", 14, 96, 40, { unit: "px" }),
  select(
    "headingWeight",
    "Graisse du titre",
    "typography",
    [
      { value: "400", label: "400 — Normal" },
      { value: "500", label: "500 — Moyen" },
      { value: "600", label: "600 — Semi-gras" },
      { value: "700", label: "700 — Gras" },
      { value: "800", label: "800 — Très gras" },
      { value: "900", label: "900 — Noir" },
    ],
    "600",
  ),
  range("headingLineHeight", "Hauteur de ligne du titre", "typography", 90, 200, 110, {
    step: 5,
    unit: "%",
  }),
  range("headingLetterSpacing", "Espacement des lettres", "typography", -2, 8, 0, {
    step: 0.5,
    unit: "px",
  }),
  select(
    "headingCase",
    "Casse du titre",
    "typography",
    [
      { value: "none", label: "Normale" },
      { value: "upper", label: "Majuscules" },
      { value: "lower", label: "Minuscules" },
    ],
    "none",
  ),
  select("bodyFont", "Police du corps", "typography", FONT_OPTIONS, "sans"),
  range("bodySize", "Taille du corps", "typography", 12, 24, 16, { unit: "px" }),
  select(
    "bodyAlign",
    "Alignement du texte",
    "typography",
    ALIGN_OPTIONS,
    "left",
  ),

  // Couleurs
  {
    key: "paletteId",
    label: "Palette",
    type: "palette",
    tab: "colors",
    optional: true,
    defaultValue: "",
    help: "Une palette remplace les couleurs ci-dessous.",
  },
  color("backgroundColor", "Couleur de fond", "colors", ""),
  color("textColor", "Couleur du texte", "colors", ""),
  color("buttonBg", "Fond des boutons", "colors", ""),
  color("buttonText", "Texte des boutons", "colors", ""),
  color("borderColor", "Couleur des bordures", "colors", ""),
  color("linkColor", "Couleur des liens", "colors", ""),
  toggle("overlay", "Superposition sombre sur l’image", "colors", false),
  range("overlayOpacity", "Opacité de la superposition", "colors", 0, 100, 45, {
    unit: "%",
  }),
  toggle("gradient", "Dégradé de fond", "colors", false),
  color("gradientFrom", "Dégradé — départ", "colors", ""),
  color("gradientTo", "Dégradé — arrivée", "colors", ""),
  select(
    "gradientDirection",
    "Direction du dégradé",
    "colors",
    [
      { value: "to right", label: "Vers la droite" },
      { value: "to bottom", label: "Vers le bas" },
      { value: "135deg", label: "Diagonale" },
    ],
    "135deg",
  ),

  // Espacements
  range("marginTop", "Marge supérieure", "spacing", 0, 160, 0, { unit: "px" }),
  range("marginBottom", "Marge inférieure", "spacing", 0, 160, 0, { unit: "px" }),
  range("paddingTop", "Padding haut", "spacing", 0, 160, 64, { unit: "px" }),
  range("paddingBottom", "Padding bas", "spacing", 0, 160, 64, { unit: "px" }),
  range("paddingLeft", "Padding gauche", "spacing", 0, 120, 0, { unit: "px" }),
  range("paddingRight", "Padding droite", "spacing", 0, 120, 0, { unit: "px" }),
  range("blockGap", "Espacement entre les blocs", "spacing", 0, 64, 16, {
    unit: "px",
  }),
  range("elementGap", "Espacement entre les éléments", "spacing", 0, 64, 12, {
    unit: "px",
  }),

  // Bordures
  range("cornerRadius", "Rayon des coins", "borders", 0, 64, 16, { unit: "px" }),
  range("borderWidth", "Épaisseur de la bordure", "borders", 0, 8, 0, {
    unit: "px",
  }),
  color("sectionBorderColor", "Couleur de la bordure", "borders", ""),
  select(
    "borderStyle",
    "Style de la bordure",
    "borders",
    [
      { value: "none", label: "Aucune" },
      { value: "solid", label: "Solide" },
      { value: "dashed", label: "Pointillée" },
      { value: "dotted", label: "Pointillée fine" },
    ],
    "none",
  ),
  toggle("shadow", "Ombre", "borders", false),
  range("shadowIntensity", "Intensité de l’ombre", "borders", 0, 40, 16),
  color("shadowColor", "Couleur de l’ombre", "borders", "#000000"),

  // Effets
  toggle("animateOnScroll", "Révéler à l’apparition", "effects", false),
  select(
    "animationType",
    "Animation d’apparition",
    "effects",
    [
      { value: "fade", label: "Fondu" },
      { value: "slide", label: "Glissement" },
      { value: "zoom", label: "Zoom" },
    ],
    "fade",
  ),
  range("animationDelay", "Délai d’animation", "effects", 0, 1000, 0, {
    unit: "ms",
  }),
  range("animationDuration", "Vitesse d’animation", "effects", 100, 2000, 500, {
    unit: "ms",
  }),
  select(
    "hoverEffect",
    "Effet au survol",
    "effects",
    [
      { value: "none", label: "Aucun" },
      { value: "elevate", label: "Élévation" },
      { value: "tilt", label: "3D" },
      { value: "zoom", label: "Zoom" },
    ],
    "none",
  ),
  toggle("zoomOnHover", "Zoom au survol du média", "effects", false),
  toggle("parallax", "Parallaxe", "effects", false),
  toggle("autoplay", "Lecture automatique", "effects", false),
  toggle("loop", "Boucle", "effects", true),
  select(
    "transition",
    "Transition",
    "effects",
    [
      { value: "fade", label: "Fondu" },
      { value: "slide", label: "Glissement" },
      { value: "push", label: "Poussée" },
    ],
    "fade",
  ),

  // Visibilité
  toggle("showDesktop", "Afficher sur ordinateur", "visibility", true),
  toggle("showTablet", "Afficher sur tablette", "visibility", true),
  toggle("showMobile", "Afficher sur mobile", "visibility", true),
  toggle("showLoggedIn", "Visiteurs connectés", "visibility", true),
  toggle("showGuest", "Visiteurs non connectés", "visibility", true),
  select(
    "market",
    "Marché",
    "visibility",
    [
      { value: "all", label: "Tous les marchés" },
      { value: "ML", label: "Mali" },
      { value: "SN", label: "Sénégal" },
      { value: "CI", label: "Côte d’Ivoire" },
      { value: "GH", label: "Ghana" },
      { value: "FR", label: "France" },
      { value: "INT", label: "International" },
    ],
    "all",
  ),

  // Avancé
  text("cssId", "Identifiant CSS", "advanced"),
  text("cssClass", "Classe(s) CSS", "advanced"),
  select(
    "htmlTag",
    "Balise HTML",
    "advanced",
    [
      { value: "section", label: "section" },
      { value: "div", label: "div" },
      { value: "article", label: "article" },
      { value: "aside", label: "aside" },
    ],
    "section",
  ),
  area("attributes", "Attributs personnalisés", "advanced", {
    help: "Un attribut par ligne, au format clé=valeur.",
  }),
  { key: "customCss", label: "CSS personnalisé", type: "css", tab: "advanced", optional: true, defaultValue: "" },
];

const headingFields = (tab: FieldSchema["tab"] = "content"): FieldSchema[] => [
  text("eyebrow", "Sur-titre", tab),
  text("heading", "Titre", tab),
  area("subheading", "Sous-titre", tab),
];

const buttonFields: FieldSchema[] = [
  text("buttonLabel", "Bouton principal — texte"),
  text("buttonLink", "Bouton principal — lien", "content", {
    placeholder: "/store/… ou https://…",
  }),
  text("buttonLabel2", "Bouton secondaire — texte"),
  text("buttonLink2", "Bouton secondaire — lien"),
];

const imageFields: FieldSchema[] = [
  { key: "imageUrl", label: "Image (ordinateur)", type: "image", tab: "media", optional: true, defaultValue: "" },
  { key: "mobileImageUrl", label: "Image (mobile)", type: "image", tab: "media", optional: true, defaultValue: "" },
  text("imageAlt", "Texte alternatif", "media"),
  select(
    "imageFit",
    "Recadrage",
    "media",
    [
      { value: "cover", label: "Remplir (cover)" },
      { value: "contain", label: "Contenir (contain)" },
      { value: "fill", label: "Étirer (fill)" },
    ],
    "cover",
  ),
  select(
    "imageRatio",
    "Ratio",
    "media",
    [
      { value: "auto", label: "Automatique" },
      { value: "16:9", label: "16:9" },
      { value: "4:3", label: "4:3" },
      { value: "1:1", label: "1:1" },
      { value: "4:5", label: "4:5" },
    ],
    "4:3",
  ),
  text("imageLink", "Lien sur l’image", "media"),
];

const withCommon = (fields: FieldSchema[]): FieldSchema[] => [
  ...fields,
  ...COMMON_FIELDS,
];

/* ------------------------------------------------------------------ *
 *  Blocs
 * ------------------------------------------------------------------ */

const linkLines = (key: string, label: string): FieldSchema =>
  area(key, label, "content", {
    help: "Une ligne par lien, au format « Libellé | /adresse ».",
  });

export const BLOCK_SCHEMAS: Record<string, BlockSchema> = {
  slide: {
    type: "slide",
    label: "Diapositive",
    fields: [
      ...imageFields,
      text("heading", "Titre"),
      area("text", "Texte"),
      ...buttonFields,
      select("textAlign", "Position du texte", "layout", ALIGN_OPTIONS, "left"),
    ],
  },
  column: {
    type: "column",
    label: "Colonne",
    fields: [
      text("icon", "Icône", "content", { placeholder: "shield, bolt, heart…" }),
      text("heading", "Titre"),
      area("text", "Texte"),
      text("linkLabel", "Libellé du lien"),
      text("link", "Lien"),
      { key: "imageUrl", label: "Image", type: "image", tab: "media", optional: true, defaultValue: "" },
    ],
  },
  testimonial: {
    type: "testimonial",
    label: "Témoignage",
    fields: [
      text("name", "Nom"),
      text("role", "Rôle ou ville"),
      area("text", "Témoignage"),
      range("rating", "Note (sur 5)", "content", 1, 5, 5),
      { key: "imageUrl", label: "Photo", type: "image", tab: "media", optional: true, defaultValue: "" },
    ],
  },
  faq: {
    type: "faq",
    label: "Question",
    fields: [text("question", "Question"), area("answer", "Réponse")],
  },
  accordion: {
    type: "accordion",
    label: "Élément déroulant",
    fields: [text("heading", "Titre"), area("text", "Contenu")],
  },
  member: {
    type: "member",
    label: "Membre",
    fields: [
      { key: "imageUrl", label: "Photo", type: "image", tab: "media", optional: true, defaultValue: "" },
      text("name", "Nom"),
      text("role", "Rôle"),
      text("link", "Lien (Instagram, LinkedIn…)"),
    ],
  },
  step: {
    type: "step",
    label: "Étape",
    fields: [text("date", "Date ou période"), text("heading", "Titre"), area("text", "Description")],
  },
  badge: {
    type: "badge",
    label: "Badge",
    fields: [
      text("icon", "Icône"),
      text("heading", "Titre"),
      area("text", "Texte"),
    ],
  },
  image: {
    type: "image",
    label: "Image",
    fields: [
      { key: "imageUrl", label: "Image", type: "image", tab: "media", optional: true, defaultValue: "" },
      text("alt", "Texte alternatif", "media"),
      text("link", "Lien", "media"),
      text("caption", "Légende"),
    ],
  },
  product: {
    type: "product",
    label: "Produit",
    fields: [
      { key: "productId", label: "Produit", type: "text", tab: "content", optional: true, defaultValue: "", help: "Sélectionne un produit dans l’aperçu." },
      text("heading", "Titre personnalisé"),
      toggle("showPrice", "Afficher le prix", "content", true),
      toggle("showVendor", "Afficher le fournisseur", "content", false),
    ],
  },
  collection: {
    type: "collection",
    label: "Collection",
    fields: [
      { key: "collectionId", label: "Collection", type: "text", tab: "content", optional: true, defaultValue: "", help: "Sélectionne une collection dans l’aperçu." },
      { key: "imageUrl", label: "Image", type: "image", tab: "media", optional: true, defaultValue: "" },
      text("heading", "Titre personnalisé"),
      area("text", "Description"),
    ],
  },
  menuColumn: {
    type: "menuColumn",
    label: "Colonne de liens",
    fields: [text("heading", "Titre de la colonne"), linkLines("links", "Liens")],
  },
  link: {
    type: "link",
    label: "Lien",
    fields: [text("label", "Libellé"), text("href", "Adresse")],
  },
};

/* ------------------------------------------------------------------ *
 *  Sections
 * ------------------------------------------------------------------ */

const section = (schema: Omit<SectionSchema, "fields"> & { fields: FieldSchema[] }): SectionSchema => ({
  ...schema,
  fields: withCommon(schema.fields),
});

const chrome = (
  type: string,
  label: string,
  icon: string,
  chromeType: "header" | "footer",
  fields: FieldSchema[],
  blocks?: SectionSchema["blocks"],
): SectionSchema =>
  section({ type, label, icon, category: chromeType, chrome: chromeType, fields, blocks });

export const SECTION_SCHEMAS: SectionSchema[] = [
  /* ---------- En-tête ---------- */
  chrome("announcement-bar", "Barre d’annonce", "megaphone", "header", [
    text("text", "Texte", "content", { defaultValue: "Livraison offerte dès 50 000 FCFA" }),
    text("linkLabel", "Libellé du lien"),
    text("link", "Lien du lien"),
    toggle("rotate", "Faire tourner plusieurs messages", "content", false),
    area("rotationTexts", "Messages supplémentaires", "content", {
      help: "Un message par ligne.",
    }),
    range("rotationSpeed", "Vitesse de rotation", "content", 1000, 10000, 4000, { unit: "ms" }),
  ]),
  chrome("header", "En-tête principal", "menu", "header", [
    text("menuId", "Menu à afficher", "content", { help: "Nom du menu créé dans Navigation. Vide = menu de la boutique." }),
    select("logoPosition", "Position du logo", "layout", ALIGN_OPTIONS, "left"),
    toggle("sticky", "En-tête fixe au défilement", "layout", true),
    toggle("transparent", "Transparent au-dessus de la bannière", "layout", false),
    toggle("showSearch", "Afficher la recherche", "content", true),
    toggle("showAccount", "Afficher le compte", "content", true),
    toggle("showCart", "Afficher le panier", "content", true),
  ]),
  chrome("navigation-menu", "Menu de navigation", "menu", "header", [
    text("menuId", "Menu à afficher"),
    select("align", "Alignement", "layout", ALIGN_OPTIONS, "center"),
    select(
      "submenuStyle",
      "Sous-menus",
      "layout",
      [
        { value: "dropdown", label: "Déroulant" },
        { value: "mega", label: "Méga-menu" },
      ],
      "dropdown",
    ),
  ]),
  chrome("mega-menu", "Méga-menu", "layers", "header", [
    text("menuId", "Menu à afficher"),
    range("columns", "Colonnes", "layout", 2, 6, 4),
    { key: "imageUrl", label: "Image en vedette", type: "image", tab: "media", optional: true, defaultValue: "" },
    text("featuredCollectionId", "Collection en vedette"),
    text("featuredHeading", "Titre de la vedette"),
  ]),
  chrome("mobile-nav", "Barre de navigation mobile", "menu", "header", [
    select(
      "style",
      "Style",
      "layout",
      [
        { value: "drawer", label: "Tiroir" },
        { value: "bar", label: "Barre fixe" },
      ],
      "drawer",
    ),
    toggle("showIcons", "Afficher les icônes", "content", true),
    toggle("showLabels", "Afficher les libellés", "content", true),
  ]),

  /* ---------- Bannières et médias ---------- */
  section({
    type: "image-banner",
    label: "Bannière d’image",
    icon: "image",
    category: "banner",
    fields: [
      ...imageFields,
      ...headingFields(),
      ...buttonFields,
      select(
        "contentPosition",
        "Position du contenu",
        "layout",
        [
          { value: "left", label: "Gauche" },
          { value: "center", label: "Centre" },
          { value: "right", label: "Droite" },
        ],
        "left",
      ),
    ],
  }),
  section({
    type: "slideshow",
    label: "Diaporama",
    icon: "play",
    category: "banner",
    fields: [
      ...headingFields(),
      toggle("autoplay", "Lecture automatique", "effects", true),
      range("autoplaySpeed", "Vitesse", "effects", 2000, 12000, 5000, { unit: "ms" }),
    ],
    blocks: { allowed: ["slide"], limit: 10, name: "Diapositives", addLabel: "Ajouter une diapositive" },
  }),
  section({
    type: "video",
    label: "Vidéo",
    icon: "play",
    category: "banner",
    fields: [
      ...headingFields(),
      { key: "videoUrl", label: "Vidéo (URL ou fichier)", type: "video", tab: "media", optional: true, defaultValue: "" },
      { key: "posterUrl", label: "Image d’aperçu", type: "image", tab: "media", optional: true, defaultValue: "" },
      toggle("autoplay", "Lecture automatique", "effects", false),
      toggle("loop", "Boucle", "effects", true),
      toggle("controls", "Contrôles", "effects", true),
      select(
        "videoWidth",
        "Largeur",
        "layout",
        [
          { value: "container", label: "Conteneur" },
          { value: "full", label: "Pleine largeur" },
          { value: "narrow", label: "Étroit" },
        ],
        "container",
      ),
    ],
  }),
  section({
    type: "image-with-text",
    label: "Image avec texte",
    icon: "layers",
    category: "banner",
    fields: [
      ...imageFields,
      ...headingFields(),
      area("text", "Description"),
      ...buttonFields,
    ],
  }),
  section({
    type: "collage",
    label: "Collage",
    icon: "grid",
    category: "banner",
    fields: [
      ...headingFields(),
      select(
        "collageLayout",
        "Disposition",
        "layout",
        [
          { value: "2", label: "Deux images" },
          { value: "3", label: "Trois images" },
          { value: "4", label: "Quatre images" },
          { value: "mosaic", label: "Mosaïque" },
        ],
        "3",
      ),
    ],
    blocks: { allowed: ["image"], limit: 4, name: "Images", addLabel: "Ajouter une image" },
  }),
  section({
    type: "before-after",
    label: "Avant / après",
    icon: "route",
    category: "banner",
    fields: [
      ...headingFields(),
      { key: "imageBefore", label: "Image « avant »", type: "image", tab: "media", optional: true, defaultValue: "" },
      { key: "imageAfter", label: "Image « après »", type: "image", tab: "media", optional: true, defaultValue: "" },
      text("labelBefore", "Libellé « avant »"),
      text("labelAfter", "Libellé « après »"),
    ],
  }),
  section({
    type: "gallery",
    label: "Galerie",
    icon: "grid",
    category: "banner",
    fields: [
      ...headingFields(),
      toggle("lightbox", "Agrandir au clic", "effects", true),
    ],
    blocks: { allowed: ["image"], limit: 24, name: "Images", addLabel: "Ajouter une image" },
  }),

  /* ---------- Contenu éditorial ---------- */
  section({
    type: "rich-text",
    label: "Texte enrichi",
    icon: "pencil",
    category: "content",
    fields: [
      ...headingFields(),
      area("text", "Texte", "content", { placeholder: "Écris ton contenu…" }),
      ...buttonFields,
    ],
  }),
  section({
    type: "multicolumn",
    label: "Multicolonnes",
    icon: "grid",
    category: "content",
    fields: [...headingFields()],
    blocks: { allowed: ["column"], limit: 6, name: "Colonnes", addLabel: "Ajouter une colonne" },
  }),
  section({
    type: "testimonials",
    label: "Témoignages",
    icon: "heart",
    category: "content",
    fields: [
      ...headingFields(),
      select(
        "style",
        "Style",
        "layout",
        [
          { value: "cards", label: "Cartes" },
          { value: "quotes", label: "Citations" },
        ],
        "cards",
      ),
    ],
    blocks: { allowed: ["testimonial"], limit: 12, name: "Témoignages", addLabel: "Ajouter un témoignage" },
  }),
  section({
    type: "faq",
    label: "FAQ",
    icon: "help",
    category: "content",
    fields: [...headingFields(), area("text", "Introduction")],
    blocks: { allowed: ["faq"], limit: 30, name: "Questions", addLabel: "Ajouter une question" },
  }),
  section({
    type: "collapsible-content",
    label: "Contenu déroulant",
    icon: "layers",
    category: "content",
    fields: [...headingFields()],
    blocks: { allowed: ["accordion"], limit: 20, name: "Éléments", addLabel: "Ajouter un élément" },
  }),
  section({
    type: "team",
    label: "Équipe",
    icon: "user",
    category: "content",
    fields: [...headingFields()],
    blocks: { allowed: ["member"], limit: 12, name: "Membres", addLabel: "Ajouter un membre" },
  }),
  section({
    type: "timeline",
    label: "Chronologie",
    icon: "route",
    category: "content",
    fields: [...headingFields()],
    blocks: { allowed: ["step"], limit: 12, name: "Étapes", addLabel: "Ajouter une étape" },
  }),
  section({
    type: "quote",
    label: "Citation",
    icon: "heart",
    category: "content",
    fields: [
      area("text", "Citation"),
      text("author", "Auteur"),
      text("role", "Rôle"),
      { key: "imageUrl", label: "Photo", type: "image", tab: "media", optional: true, defaultValue: "" },
      select(
        "style",
        "Style",
        "layout",
        [
          { value: "centered", label: "Centrée" },
          { value: "card", label: "Carte" },
        ],
        "centered",
      ),
    ],
  }),

  /* ---------- Commerce ---------- */
  section({
    type: "featured-collection",
    label: "Collection en vedette",
    icon: "bag",
    category: "commerce",
    fields: [
      ...headingFields(),
      { key: "collectionId", label: "Collection", type: "text", tab: "content", optional: true, defaultValue: "" },
      range("productLimit", "Nombre de produits", "content", 2, 24, 8),
      text("buttonLabel", "Libellé du bouton"),
      text("buttonLink", "Lien du bouton"),
      toggle("showViewAll", "Afficher « Voir tout »", "content", true),
    ],
  }),
  section({
    type: "featured-product",
    label: "Produit en vedette",
    icon: "tag",
    category: "commerce",
    fields: [
      ...headingFields(),
      { key: "productId", label: "Produit", type: "text", tab: "content", optional: true, defaultValue: "" },
      toggle("showPrice", "Afficher le prix", "content", true),
      toggle("showDescription", "Afficher la description", "content", true),
      toggle("showVariants", "Afficher les variantes", "content", true),
      toggle("showQuantity", "Afficher la quantité", "content", true),
      toggle("showPaymentIcons", "Afficher les moyens de paiement", "content", true),
      text("buttonLabel", "Libellé du bouton"),
    ],
  }),
  section({
    type: "collection-list",
    label: "Liste de collections",
    icon: "layers",
    category: "commerce",
    fields: [...headingFields(), range("columnsDesktop", "Colonnes", "layout", 1, 4, 3)],
    blocks: { allowed: ["collection"], limit: 20, name: "Collections", addLabel: "Ajouter une collection" },
  }),
  section({
    type: "product-grid",
    label: "Grille de produits",
    icon: "grid",
    category: "commerce",
    fields: [
      ...headingFields(),
      toggle("showFilters", "Afficher les filtres", "layout", false),
      toggle("showSort", "Afficher le tri", "layout", false),
    ],
    blocks: { allowed: ["product"], limit: 30, name: "Produits", addLabel: "Ajouter un produit" },
  }),
  section({
    type: "complementary-products",
    label: "Produits complémentaires",
    icon: "bag",
    category: "commerce",
    fields: [...headingFields(), range("productLimit", "Nombre de produits", "content", 2, 12, 4)],
  }),
  section({
    type: "best-sellers",
    label: "Meilleures ventes",
    icon: "bolt",
    category: "commerce",
    fields: [
      ...headingFields(),
      range("productLimit", "Nombre de produits", "content", 2, 24, 8),
      select(
        "period",
        "Période",
        "content",
        [
          { value: "7", label: "7 derniers jours" },
          { value: "30", label: "30 derniers jours" },
          { value: "90", label: "90 derniers jours" },
          { value: "all", label: "Depuis toujours" },
        ],
        "30",
      ),
    ],
  }),
  section({
    type: "new-arrivals",
    label: "Nouveautés",
    icon: "sparkle",
    category: "commerce",
    fields: [...headingFields(), range("productLimit", "Nombre de produits", "content", 2, 24, 8)],
  }),
  section({
    type: "promotions",
    label: "Promotions",
    icon: "tag",
    category: "commerce",
    fields: [
      ...headingFields(),
      text("badgeText", "Texte du badge", "content", { defaultValue: "En solde" }),
      range("productLimit", "Nombre de produits", "content", 2, 24, 8),
    ],
  }),

  /* ---------- Conversion et marketing ---------- */
  section({
    type: "newsletter",
    label: "Newsletter",
    icon: "mail",
    category: "marketing",
    fields: [
      ...headingFields(),
      area("text", "Texte"),
      text("placeholder", "Placeholder de l’e-mail", "content", { defaultValue: "ton@email.com" }),
      text("buttonLabel", "Libellé du bouton", "content", { defaultValue: "S’inscrire" }),
      text("privacyText", "Mention de confidentialité"),
      select(
        "style",
        "Style",
        "layout",
        [
          { value: "card", label: "Carte" },
          { value: "plain", label: "Sobre" },
          { value: "split", label: "Deux colonnes" },
        ],
        "card",
      ),
    ],
  }),
  section({
    type: "countdown",
    label: "Compte à rebours",
    icon: "clock",
    category: "marketing",
    fields: [
      ...headingFields(),
      area("text", "Texte"),
      text("targetDate", "Date cible (AAAA-MM-JJ HH:MM)"),
      toggle("showDays", "Afficher les jours", "content", true),
      toggle("showHours", "Afficher les heures", "content", true),
      toggle("showMinutes", "Afficher les minutes", "content", true),
      toggle("showSeconds", "Afficher les secondes", "content", true),
    ],
  }),
  section({
    type: "progress-bar",
    label: "Barre de progression",
    icon: "bolt",
    category: "marketing",
    fields: [
      ...headingFields(),
      area("text", "Texte"),
      { key: "goalAmount", label: "Objectif", type: "number", tab: "content", min: 0, defaultValue: 100000 },
      { key: "currentAmount", label: "Montant actuel", type: "number", tab: "content", min: 0, defaultValue: 42000 },
      text("currency", "Devise", "content", { defaultValue: "FCFA" }),
    ],
  }),
  section({
    type: "trust-badges",
    label: "Badges de confiance",
    icon: "shield",
    category: "marketing",
    fields: [...headingFields()],
    blocks: { allowed: ["badge"], limit: 6, name: "Badges", addLabel: "Ajouter un badge" },
  }),
  section({
    type: "popup",
    label: "Pop-up",
    icon: "sparkle",
    category: "marketing",
    fields: [
      ...headingFields(),
      area("text", "Texte"),
      { key: "imageUrl", label: "Image", type: "image", tab: "media", optional: true, defaultValue: "" },
      text("buttonLabel", "Libellé du bouton"),
      text("buttonLink", "Lien du bouton"),
      select(
        "trigger",
        "Déclencheur",
        "content",
        [
          { value: "delay", label: "Après un délai" },
          { value: "scroll", label: "Au défilement" },
          { value: "exit", label: "À la sortie" },
        ],
        "delay",
      ),
      range("delay", "Délai", "content", 500, 30000, 4000, { unit: "ms" }),
    ],
  }),
  section({
    type: "promo-banner",
    label: "Bandeau promo",
    icon: "tag",
    category: "marketing",
    fields: [
      text("text", "Texte"),
      text("code", "Code promo"),
      text("buttonLabel", "Libellé du bouton"),
      text("buttonLink", "Lien du bouton"),
    ],
  }),

  /* ---------- Pied de page ---------- */
  chrome("footer-newsletter", "Newsletter (pied de page)", "mail", "footer", [
    ...headingFields(),
    text("placeholder", "Placeholder de l’e-mail", "content", { defaultValue: "ton@email.com" }),
    text("buttonLabel", "Libellé du bouton", "content", { defaultValue: "S’inscrire" }),
  ]),
  chrome("footer-brand", "Informations sur la marque", "home", "footer", [
    text("heading", "Nom de la boutique"),
    area("text", "Description"),
    toggle("showLogo", "Afficher le logo", "content", true),
    toggle("showContact", "Afficher e-mail et téléphone", "content", true),
  ]),
  chrome("footer-menus", "Menus du pied de page", "menu", "footer", [], {
    allowed: ["menuColumn"],
    limit: 4,
    name: "Colonnes",
    addLabel: "Ajouter une colonne",
  }),
  chrome("footer-social", "Réseaux sociaux", "heart", "footer", [
    text("heading", "Titre"),
    select(
      "style",
      "Style",
      "layout",
      [
        { value: "icons", label: "Icônes" },
        { value: "labels", label: "Libellés" },
      ],
      "icons",
    ),
  ]),
  chrome("footer-payment", "Paiements et mentions", "card", "footer", [
    text("heading", "Titre"),
    toggle("showCurrency", "Afficher le pays et la devise", "content", true),
    toggle("showCopyright", "Afficher le copyright", "content", true),
    text("copyright", "Texte du copyright"),
  ]),

  /* ---------- Avancé ---------- */
  section({
    type: "custom-liquid",
    label: "Liquid personnalisé",
    icon: "code",
    category: "advanced",
    fields: [
      text("heading", "Titre"),
      { key: "code", label: "Code Liquid", type: "css", tab: "content", optional: true, defaultValue: "" },
      { key: "customCss", label: "CSS du bloc", type: "css", tab: "advanced", optional: true, defaultValue: "" },
    ],
  }),
  section({
    type: "custom-html",
    label: "HTML personnalisé",
    icon: "code",
    category: "advanced",
    fields: [
      text("heading", "Titre"),
      { key: "code", label: "Code HTML", type: "css", tab: "content", optional: true, defaultValue: "" },
    ],
  }),
  section({
    type: "app-block",
    label: "Application block",
    icon: "grid",
    category: "advanced",
    fields: [
      text("heading", "Titre"),
      text("appId", "Identifiant de l’application"),
      text("blockType", "Type de bloc"),
    ],
  }),
  section({
    type: "custom-section",
    label: "Section personnalisée",
    icon: "layers",
    category: "advanced",
    fields: [...headingFields(), area("text", "Contenu")],
  }),

  /* ---------- Sections dynamiques ---------- */
  section({
    type: "product-gallery",
    label: "Galerie produit",
    icon: "image",
    category: "dynamic",
    dynamic: "product",
    fields: [
      select(
        "galleryLayout",
        "Disposition",
        "layout",
        [
          { value: "thumbnails-left", label: "Miniatures à gauche" },
          { value: "thumbnails-bottom", label: "Miniatures en bas" },
          { value: "grid", label: "Grille" },
        ],
        "thumbnails-left",
      ),
      toggle("zoomOnHover", "Zoom au survol", "effects", true),
    ],
  }),
  section({
    type: "product-info",
    label: "Informations produit",
    icon: "tag",
    category: "dynamic",
    dynamic: "product",
    fields: [
      toggle("showPrice", "Afficher le prix", "content", true),
      toggle("showDescription", "Afficher la description", "content", true),
      toggle("showVariants", "Afficher les variantes", "content", true),
      toggle("showQuantity", "Afficher la quantité", "content", true),
      toggle("showPaymentIcons", "Afficher les moyens de paiement", "content", true),
      toggle("showWishlist", "Afficher le favori", "content", true),
      text("buttonLabel", "Libellé du bouton", "content", { defaultValue: "Ajouter au panier" }),
    ],
  }),
  section({
    type: "product-tabs",
    label: "Onglets produit",
    icon: "layers",
    category: "dynamic",
    dynamic: "product",
    fields: [
      text("detailsLabel", "Onglet description", "content", { defaultValue: "Détails" }),
      text("shippingLabel", "Onglet livraison", "content", { defaultValue: "Livraison" }),
      text("specsLabel", "Onglet caractéristiques", "content", { defaultValue: "Caractéristiques" }),
      toggle("showShipping", "Afficher la livraison", "content", true),
      toggle("showSpecs", "Afficher les caractéristiques", "content", true),
    ],
  }),
  section({
    type: "product-related",
    label: "Produits associés",
    icon: "bag",
    category: "dynamic",
    dynamic: "product",
    fields: [...headingFields(), range("productLimit", "Nombre de produits", "content", 2, 12, 4)],
  }),
  section({
    type: "collection-banner",
    label: "Bannière de collection",
    icon: "image",
    category: "dynamic",
    dynamic: "collection",
    fields: [...headingFields(), area("text", "Description"), { key: "imageUrl", label: "Image", type: "image", tab: "media", optional: true, defaultValue: "" }],
  }),
  section({
    type: "collection-grid",
    label: "Grille de collection",
    icon: "grid",
    category: "dynamic",
    dynamic: "collection",
    fields: [
      range("productsPerPage", "Produits par page", "content", 4, 48, 12),
      toggle("showFilters", "Filtres", "layout", true),
      toggle("showSort", "Tri", "layout", true),
    ],
  }),
  section({
    type: "page-content",
    label: "Contenu de la page",
    icon: "pencil",
    category: "dynamic",
    dynamic: "page",
    fields: [toggle("showTitle", "Afficher le titre", "content", true), toggle("showDate", "Afficher la date", "content", false)],
  }),
  section({
    type: "blog-grid",
    label: "Grille d’articles",
    icon: "grid",
    category: "dynamic",
    dynamic: "blog",
    fields: [
      ...headingFields(),
      range("postsPerPage", "Articles par page", "content", 3, 24, 9),
    ],
  }),
  section({
    type: "article-content",
    label: "Contenu d’article",
    icon: "pencil",
    category: "dynamic",
    dynamic: "article",
    fields: [
      toggle("showAuthor", "Afficher l’auteur", "content", true),
      toggle("showDate", "Afficher la date", "content", true),
      toggle("showShare", "Afficher le partage", "content", true),
      toggle("showRelated", "Afficher les articles associés", "content", true),
    ],
  }),
  section({
    type: "search-results",
    label: "Résultats de recherche",
    icon: "search",
    category: "dynamic",
    dynamic: "search",
    fields: [
      ...headingFields(),
      toggle("showFilters", "Filtres", "layout", false),
      toggle("showSort", "Tri", "layout", false),
      text("emptyText", "Texte si aucun résultat", "content"),
    ],
  }),
  section({
    type: "cart-items",
    label: "Articles du panier",
    icon: "bag",
    category: "dynamic",
    dynamic: "cart",
    fields: [
      text("heading", "Titre", "content", { defaultValue: "Ton panier" }),
      toggle("showNote", "Note de commande", "content", true),
      text("buttonLabel", "Libellé du bouton", "content", { defaultValue: "Passer à la caisse" }),
    ],
  }),
  section({
    type: "not-found",
    label: "Page 404",
    icon: "help",
    category: "dynamic",
    dynamic: "page",
    fields: [...headingFields(), area("text", "Texte"), ...buttonFields],
  }),
  section({
    type: "password-form",
    label: "Page de mot de passe",
    icon: "shield",
    category: "dynamic",
    dynamic: "page",
    fields: [...headingFields(), area("text", "Texte"), text("buttonLabel", "Libellé du bouton", "content", { defaultValue: "Entrer" })],
  }),
];

export function getSectionSchema(type: string): SectionSchema | undefined {
  return SECTION_SCHEMAS.find((schema) => schema.type === type);
}

export function getBlockSchema(type: string): BlockSchema | undefined {
  return BLOCK_SCHEMAS[type];
}

/** Champs communs réellement utiles pour un bloc. */
export const BLOCK_COMMON_FIELDS: FieldSchema[] = [
  text("cssClass", "Classe CSS", "advanced"),
  toggle("visible", "Visible", "visibility", true),
];

export function sectionFieldsForTab(schema: SectionSchema, tab: string): FieldSchema[] {
  return schema.fields.filter((field) => field.tab === tab);
}
