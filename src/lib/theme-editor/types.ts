/**
 * Modèle du constructeur de thèmes.
 *
 * Le document JSON est la source de vérité : l'éditeur le modifie en mémoire,
 * le serveur le valide puis le recopie dans les tables normalisées. Le rendu
 * public ne lit que la version publiée.
 */

export type ThemeTemplateType =
  | "index"
  | "product"
  | "collection"
  | "list-collections"
  | "page"
  | "blog"
  | "article"
  | "search"
  | "cart"
  | "404"
  | "password";

export const TEMPLATE_TYPES: ThemeTemplateType[] = [
  "index",
  "product",
  "collection",
  "list-collections",
  "page",
  "blog",
  "article",
  "search",
  "cart",
  "404",
  "password",
];

export type ThemePaletteRole =
  | "background"
  | "text"
  | "muted"
  | "accent"
  | "buttonBg"
  | "buttonText"
  | "border"
  | "badgePromo"
  | "badgeSoldOut"
  | "badgeNew";

export type ThemePalette = {
  id: string;
  name: string;
} & Record<ThemePaletteRole, string>;

export type MetafieldRef = {
  $metafield: {
    owner: "product" | "collection" | "page" | "article" | "shop";
    namespace: string;
    key: string;
    fallback: string;
  };
};

export type SettingScalar = string | number | boolean | null;
export type SettingValue = SettingScalar | MetafieldRef;

export type ThemeBlockInstance = {
  id: string;
  type: string;
  /** Nom personnalisé affiché dans la structure (sinon le libellé du schéma). */
  name?: string;
  visible: boolean;
  settings: Record<string, SettingValue>;
};

export type ThemeSectionInstance = {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  settings: Record<string, SettingValue>;
  blocks: ThemeBlockInstance[];
};

export type ThemeTemplate = {
  id: string;
  type: ThemeTemplateType;
  name: string;
  sections: ThemeSectionInstance[];
};

export type ThemeProductCardSettings = {
  radius: number;
  border: boolean;
  shadow: boolean;
  imageRatio: "square" | "portrait" | "landscape" | "adapt";
  showPrice: boolean;
  showVendor: boolean;
  showBadge: boolean;
  badgeStyle: "pill" | "square" | "none";
};

export type ThemeSettings = {
  logoUrl: string;
  logoAlt: string;
  logoWidth: number;
  mobileLogoUrl: string;
  logoPosition: "left" | "center";
  faviconUrl: string;
  palettes: ThemePalette[];
  activePaletteId: string;
  headingFont: string;
  bodyFont: string;
  typeScale: number;
  baseFontSize: number;
  headingWeight: number;
  lineHeight: number;
  letterSpacing: number;
  pageWidth: "1200" | "1400" | "1600" | "full";
  contentWidth: "narrow" | "normal" | "wide";
  sectionSpacing: number;
  gridGapX: number;
  gridGapY: number;
  pageMargin: number;
  revealOnScroll: boolean;
  revealAnimation: "fade" | "slide" | "zoom";
  cardHover: "elevate" | "tilt" | "none";
  hoverLift: number;
  hoverPerspective: number;
  buttonHover: "scale" | "shadow" | "none";
  productCard: ThemeProductCardSettings;
  collectionCardRadius: number;
  collectionCardShadow: boolean;
  collectionCardShowCount: boolean;
  articleCardRadius: number;
  articleCardShowExcerpt: boolean;
  articleCardShowDate: boolean;
  mediaRadius: number;
  mediaBorder: boolean;
  mediaShadow: boolean;
  menuStyle: "dropdown" | "modal" | "drawer";
  badgePosition: "top-left" | "top-right";
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  socialYoutube: string;
  socialPinterest: string;
  socialX: string;
  socialLinkedin: string;
  socialWhatsapp: string;
  searchSuggestions: boolean;
  searchShowVendor: boolean;
  searchShowPrice: boolean;
  searchSuggestionCount: number;
  currencyShowCode: boolean;
  currencySymbolPosition: "before" | "after";
  currencyThousands: "space" | "comma" | "dot";
  cartType: "drawer" | "page" | "popup";
  cartShowVendor: boolean;
  cartNote: boolean;
  cartEmptyCollectionId: string;
  cartBgColor: string;
  cartTextColor: string;
  cartButtonColor: string;
  customCss: string;
  stylePreset: "modern" | "minimal" | "elegant" | "bold";
  translations: Record<string, string>;
};

export type ThemeDocument = {
  schemaVersion: 1;
  settings: ThemeSettings;
  header: ThemeSectionInstance[];
  footer: ThemeSectionInstance[];
  templates: ThemeTemplate[];
};

export type ThemeSummary = {
  id: string;
  name: string;
  status: "draft" | "published";
  isActive: boolean;
  draft: ThemeDocument;
  updatedAt?: string | null;
  publishedAt?: string | null;
};

export type ThemeAppEmbed = {
  id: string;
  appId: string;
  name: string;
  enabled: boolean;
  settings: Record<string, unknown>;
};

export type ThemeAppBlock = {
  id: string;
  appId: string;
  name: string;
  blockType: string;
  settings: Record<string, unknown>;
};

export type ThemeAssignment = {
  resourceType: "product" | "collection" | "page" | "article";
  resourceId: string;
  templateKey: string;
};

export type ThemeEditorData = {
  themes: ThemeSummary[];
  appEmbeds: ThemeAppEmbed[];
  appBlocks: ThemeAppBlock[];
  assignments: ThemeAssignment[];
};

export type ThemeVersion = {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string | null;
  authorName: string | null;
  snapshot: ThemeDocument;
};

/* ------------------------------------------------------------------ *
 *  Schémas de champs
 * ------------------------------------------------------------------ */

export type FieldTab =
  | "content"
  | "media"
  | "layout"
  | "typography"
  | "colors"
  | "spacing"
  | "borders"
  | "effects"
  | "visibility"
  | "advanced"
  | "logo"
  | "favicon"
  | "animations"
  | "visual"
  | "social"
  | "search"
  | "currency"
  | "cart"
  | "custom-css"
  | "style"
  | "translations";

export const FIELD_TABS: { id: FieldTab; label: string }[] = [
  { id: "content", label: "Contenu" },
  { id: "media", label: "Médias" },
  { id: "layout", label: "Disposition" },
  { id: "typography", label: "Typographie" },
  { id: "colors", label: "Couleurs" },
  { id: "spacing", label: "Espacements" },
  { id: "borders", label: "Bordures" },
  { id: "effects", label: "Effets" },
  { id: "visibility", label: "Visibilité" },
  { id: "advanced", label: "Avancé" },
];

export type FieldOption = { value: string; label: string };

export type FieldSchema = {
  key: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "range"
    | "toggle"
    | "select"
    | "color"
    | "image"
    | "video"
    | "url"
    | "icon"
    | "heading"
    | "info"
    | "css"
    | "metafield"
    | "palette";
  tab: FieldTab;
  placeholder?: string;
  help?: string;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Une valeur vide est autorisée (sinon le champ est obligatoire). */
  optional?: boolean;
  defaultValue?: SettingValue;
};

export type BlockSchema = {
  type: string;
  label: string;
  fields: FieldSchema[];
  limit?: number;
};

export type SectionSchema = {
  type: string;
  label: string;
  description?: string;
  category:
    | "header"
    | "banner"
    | "content"
    | "commerce"
    | "marketing"
    | "footer"
    | "advanced"
    | "dynamic";
  icon: string;
  fields: FieldSchema[];
  blocks?: {
    allowed: string[];
    limit: number;
    name: string;
    addLabel: string;
  };
  /** Section d'en-tête/pied de page : partagée par tous les modèles. */
  chrome?: "header" | "footer";
  /** Section réservée aux modèles produits. */
  dynamic?: "product" | "collection" | "page" | "article" | "blog" | "search" | "cart";
  maxSections?: number;
};
