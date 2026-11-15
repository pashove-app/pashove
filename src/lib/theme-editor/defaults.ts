import type {
  ThemeBlockInstance,
  ThemeDocument,
  ThemePalette,
  ThemeSectionInstance,
  ThemeSettings,
  ThemeTemplate,
  ThemeTemplateType,
} from "@/lib/theme-editor/types";
import {
  BLOCK_SCHEMAS,
  DEFAULT_PALETTES,
  SECTION_SCHEMAS,
  getBlockSchema,
  getSectionSchema,
} from "@/lib/theme-editor/schema";

let sequence = 0;

/** Identifiant lisible et unique, côté serveur comme côté navigateur. */
export function makeId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function defaultsFor(
  fields: { key: string; defaultValue?: unknown }[],
): Record<string, string | number | boolean | null> {
  const settings: Record<string, string | number | boolean | null> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      settings[field.key] = field.defaultValue as string | number | boolean | null;
    }
  }
  return settings;
}

export function newBlock(
  type: string,
  overrides: Partial<ThemeBlockInstance> = {},
): ThemeBlockInstance {
  const schema = getBlockSchema(type);
  return {
    id: overrides.id ?? makeId("block"),
    type,
    visible: overrides.visible ?? true,
    settings: {
      ...(schema ? defaultsFor(schema.fields) : {}),
      ...(overrides.settings ?? {}),
    },
  };
}

export function newSection(
  type: string,
  overrides: Partial<ThemeSectionInstance> = {},
): ThemeSectionInstance {
  const schema = getSectionSchema(type);
  return {
    id: makeId("section"),
    type,
    name: overrides.name ?? schema?.label ?? type,
    visible: overrides.visible ?? true,
    settings: {
      ...(schema ? defaultsFor(schema.fields) : {}),
      ...(overrides.settings ?? {}),
    },
    blocks: overrides.blocks ?? [],
  };
}

function section(
  type: string,
  settings: Record<string, string | number | boolean | null> = {},
  blocks: ThemeBlockInstance[] = [],
): ThemeSectionInstance {
  const created = newSection(type, { settings });
  created.blocks = blocks;
  return created;
}

const IMAGE = "/home/hero-theme.jpg";
const IMAGE_CATALOG = "/home/hero-catalog.jpg";
const IMAGE_CLIENT = "/home/hero-client.jpg";
const IMAGE_DELIVERY = "/home/hero-delivery.jpg";

function palette(
  id: string,
  name: string,
  values: Partial<ThemePalette>,
): ThemePalette {
  return {
    ...DEFAULT_PALETTES[0],
    id,
    name,
    ...values,
  };
}

export function defaultSettings(
  overrides: Partial<ThemeSettings> = {},
): ThemeSettings {
  return {
    logoUrl: "",
    logoAlt: "",
    logoWidth: 40,
    mobileLogoUrl: "",
    logoPosition: "left",
    faviconUrl: "",
    palettes: DEFAULT_PALETTES,
    activePaletteId: "palette-nuit",
    headingFont: "sans",
    bodyFont: "sans",
    typeScale: 1.15,
    baseFontSize: 16,
    headingWeight: 600,
    lineHeight: 1.55,
    letterSpacing: 0,
    pageWidth: "1400",
    contentWidth: "normal",
    sectionSpacing: 64,
    gridGapX: 20,
    gridGapY: 28,
    pageMargin: 20,
    revealOnScroll: true,
    revealAnimation: "fade",
    cardHover: "elevate",
    hoverLift: 4,
    hoverPerspective: 600,
    buttonHover: "scale",
    productCard: {
      radius: 16,
      border: true,
      shadow: false,
      imageRatio: "portrait",
      showPrice: true,
      showVendor: false,
      showBadge: true,
      badgeStyle: "pill",
    },
    collectionCardRadius: 16,
    collectionCardShadow: false,
    collectionCardShowCount: true,
    articleCardRadius: 16,
    articleCardShowExcerpt: true,
    articleCardShowDate: true,
    mediaRadius: 20,
    mediaBorder: true,
    mediaShadow: false,
    menuStyle: "dropdown",
    badgePosition: "top-left",
    socialInstagram: "",
    socialFacebook: "",
    socialTiktok: "",
    socialYoutube: "",
    socialPinterest: "",
    socialX: "",
    socialLinkedin: "",
    socialWhatsapp: "",
    searchSuggestions: true,
    searchShowVendor: false,
    searchShowPrice: true,
    searchSuggestionCount: 5,
    currencyShowCode: false,
    currencySymbolPosition: "after",
    currencyThousands: "space",
    cartType: "drawer",
    cartShowVendor: false,
    cartNote: true,
    cartEmptyCollectionId: "",
    cartBgColor: "",
    cartTextColor: "",
    cartButtonColor: "",
    customCss: "",
    stylePreset: "modern",
    translations: {},
    ...overrides,
  };
}

function headerSections(announcement: string): ThemeSectionInstance[] {
  return [
    section("announcement-bar", {
      text: announcement,
      backgroundColor: "#111827",
      textColor: "#FFFFFF",
      paddingTop: 8,
      paddingBottom: 8,
      bodySize: 12,
      showDesktop: true,
      showTablet: true,
      showMobile: true,
    }),
    section(
      "header",
      {
        logoPosition: "left",
        sticky: true,
        transparent: false,
        showSearch: true,
        showAccount: true,
        showCart: true,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: "",
        textColor: "",
        borderStyle: "solid",
        borderWidth: 1,
        sectionBorderColor: "",
      },
      [],
    ),
  ];
}

function footerSections(): ThemeSectionInstance[] {
  return [
    section("footer-newsletter", {
      heading: "Reste dans la boucle",
      subheading: "Nouveautés, offres et coulisses — une fois par mois, pas plus.",
      placeholder: "ton@email.com",
      buttonLabel: "S’inscrire",
    }),
    section("footer-brand", {
      heading: "",
      text: "",
      showLogo: true,
      showContact: true,
      paddingTop: 40,
      paddingBottom: 24,
    }),
    section(
      "footer-menus",
      { paddingTop: 24, paddingBottom: 24 },
      [
        newBlock("menuColumn", {
          settings: {
            heading: "Boutique",
            links: "Accueil | /\nNouveautés | /products\nCollections | /collections",
          },
        }),
        newBlock("menuColumn", {
          settings: {
            heading: "Aide",
            links: "Suivre ma commande | /order-status\nFAQ | /faq\nContact | /contact",
          },
        }),
      ],
    ),
    section("footer-social", {
      heading: "Suis-nous",
      style: "icons",
      paddingTop: 16,
      paddingBottom: 16,
    }),
    section("footer-payment", {
      heading: "",
      showCurrency: true,
      showCopyright: true,
      copyright: "",
      paddingTop: 16,
      paddingBottom: 32,
    }),
  ];
}

function defaultHomeSections(options?: {
  heading?: string;
  subheading?: string;
  buttonLabel?: string;
  image?: string;
  collectionHeading?: string;
  introHeading?: string;
  introText?: string;
}): ThemeSectionInstance[] {
  return [
    section(
      "image-banner",
      {
        imageUrl: options?.image ?? IMAGE,
        imageAlt: "Bannière de la boutique",
        heading: options?.heading ?? "Des objets choisis, livrés chez toi",
        subheading:
          options?.subheading ??
          "Une sélection courte, des prix justes et la livraison partout en Afrique de l’Ouest.",
        buttonLabel: options?.buttonLabel ?? "Découvrir la boutique",
        buttonLink: "/products",
        buttonLabel2: "Nous écrire",
        buttonLink2: "/contact",
        overlay: true,
        overlayOpacity: 52,
        sectionHeight: "large",
        sectionHeightCustom: 560,
        textAlign: "left",
        contentPosition: "left",
        paddingTop: 0,
        paddingBottom: 0,
        headingSize: 56,
        animateOnScroll: true,
      },
      [],
    ),
    section(
      "featured-collection",
      {
        eyebrow: "Nouveautés",
        heading: options?.collectionHeading ?? "Les dernières arrivées",
        subheading: "Les pièces disponibles tout de suite, prêtes à partir.",
        productLimit: 8,
        showViewAll: true,
        buttonLabel: "Voir la collection",
        buttonLink: "/collections",
      },
      [],
    ),
    section(
      "image-with-text",
      {
        imageUrl: IMAGE_CLIENT,
        imageAlt: "Client satisfait",
        mediaPosition: "left",
        heading: options?.introHeading ?? "Pensé pour la vraie vie",
        text:
          options?.introText ??
          "Chaque produit est testé avant d’entrer dans le catalogue. On privilégie les matières qui durent, les coupes qui se portent et les détails qui comptent.",
        buttonLabel: "Notre histoire",
        buttonLink: "/about",
        paddingTop: 72,
        paddingBottom: 72,
        cornerRadius: 24,
      },
      [],
    ),
    section(
      "multicolumn",
      { heading: "Pourquoi nous choisir", columnsDesktop: 3, columnsMobile: 1 },
      [
        newBlock("column", {
          settings: {
            icon: "route",
            heading: "Livraison suivie",
            text: "Une commande, un suivi. Tu sais toujours où en est ton colis.",
          },
        }),
        newBlock("column", {
          settings: {
            icon: "shield",
            heading: "Paiement sécurisé",
            text: "Mobile Money ou carte bancaire, protégé à chaque étape.",
          },
        }),
        newBlock("column", {
          settings: {
            icon: "heart",
            heading: "Service humain",
            text: "Une question ? On répond en quelques heures, pas en quelques jours.",
          },
        }),
      ],
    ),
    section(
      "testimonials",
      { heading: "Ils nous font confiance", columnsDesktop: 3, columnsMobile: 1 },
      [
        newBlock("testimonial", {
          settings: {
            name: "Aminata",
            role: "Bamako",
            text: "Commande reçue en 48 h, emballage impeccable. Je recommande sans hésiter.",
            rating: 5,
          },
        }),
        newBlock("testimonial", {
          settings: {
            name: "Kwame",
            role: "Accra",
            text: "Les produits sont exactement comme sur les photos. Le service client est très réactif.",
            rating: 5,
          },
        }),
        newBlock("testimonial", {
          settings: {
            name: "Fatou",
            role: "Dakar",
            text: "J’ai payé avec Wave, tout a fonctionné du premier coup. Très simple.",
            rating: 4,
          },
        }),
      ],
    ),
    section(
      "newsletter",
      {
        heading: "Une bonne raison de revenir",
        text: "Reçois les nouveautés et les offres avant tout le monde.",
        buttonLabel: "Je m’inscris",
        style: "card",
      },
      [],
    ),
  ];
}

function defaultTemplates(home: ThemeSectionInstance[]): ThemeTemplate[] {
  return [
    { id: "index", type: "index", name: "Page d’accueil", sections: home },
    {
      id: "product",
      type: "product",
      name: "Produit par défaut",
      sections: [
        section("product-gallery", { galleryLayout: "thumbnails-left" }),
        section("product-info", {}),
        section("product-tabs", {}),
        section("product-related", { heading: "Tu aimeras aussi" }),
      ],
    },
    {
      id: "collection",
      type: "collection",
      name: "Collection par défaut",
      sections: [section("collection-banner", {}), section("collection-grid", {})],
    },
    {
      id: "list-collections",
      type: "list-collections",
      name: "Liste des collections",
      sections: [section("collection-list", { heading: "Toutes les collections" })],
    },
    {
      id: "page",
      type: "page",
      name: "Page par défaut",
      sections: [section("page-content", {})],
    },
    {
      id: "blog",
      type: "blog",
      name: "Blog par défaut",
      sections: [section("blog-grid", { heading: "Le journal" })],
    },
    {
      id: "article",
      type: "article",
      name: "Article par défaut",
      sections: [section("article-content", {})],
    },
    {
      id: "search",
      type: "search",
      name: "Résultats de recherche",
      sections: [section("search-results", { heading: "Recherche" })],
    },
    {
      id: "cart",
      type: "cart",
      name: "Panier",
      sections: [section("cart-items", {})],
    },
    {
      id: "404",
      type: "404",
      name: "Page 404",
      sections: [
        section("not-found", {
          heading: "Cette page a disparu",
          text: "Le lien est peut-être ancien, ou la page a été déplacée.",
          buttonLabel: "Retour à la boutique",
          buttonLink: "/",
        }),
      ],
    },
    {
      id: "password",
      type: "password",
      name: "Page de mot de passe",
      sections: [
        section("password-form", {
          heading: "Bientôt en ligne",
          text: "Inscris ton e-mail pour être prévenu de l’ouverture.",
        }),
      ],
    },
  ];
}

export type ThemePresetId =
  | "dawn"
  | "mode"
  | "beaute"
  | "electronique"
  | "alimentation"
  | "createur"
  | "services";

export type ThemePresetMeta = {
  id: ThemePresetId;
  name: string;
  description: string;
  swatches: [string, string, string];
};

export const THEME_LIBRARY: ThemePresetMeta[] = [
  {
    id: "dawn",
    name: "Pashove Dawn",
    description: "Nuit profonde et bleu électrique. Le socle polyvalent de Pashove.",
    swatches: ["#04060D", "#2F5CFF", "#FFFFFF"],
  },
  {
    id: "mode",
    name: "Boutique mode",
    description: "Ivoire, noir et serif éditorial. Les vêtements passent devant.",
    swatches: ["#F6F1E8", "#111111", "#B08D57"],
  },
  {
    id: "beaute",
    name: "Boutique beauté",
    description: "Rose poudré, blanc cassé et courbes douces.",
    swatches: ["#FDF2F4", "#9D174D", "#FFFFFF"],
  },
  {
    id: "electronique",
    name: "Boutique électronique",
    description: "Bleu nuit, cyan et fiches produit très lisibles.",
    swatches: ["#07111F", "#22D3EE", "#F8FAFC"],
  },
  {
    id: "alimentation",
    name: "Boutique alimentation",
    description: "Vert profond et crème, pour les produits frais et locaux.",
    swatches: ["#F8F4E8", "#166534", "#EAB308"],
  },
  {
    id: "createur",
    name: "Créateur numérique",
    description: "Violet, noir et cartes nettes pour les fichiers et formations.",
    swatches: ["#0B0714", "#8B5CF6", "#F5F3FF"],
  },
  {
    id: "services",
    name: "Services",
    description: "Ardoise et orange, pensé pour les rendez-vous et prestations.",
    swatches: ["#0F172A", "#F97316", "#F8FAFC"],
  },
];

type PresetTheme = {
  palette: ThemePalette;
  headingFont: string;
  bodyFont: string;
  image: string;
  heading: string;
  subheading: string;
  collectionHeading: string;
  introHeading: string;
  introText: string;
  announce: string;
  stylePreset: ThemeSettings["stylePreset"];
};

const PRESET_THEMES: Record<ThemePresetId, PresetTheme> = {
  dawn: {
    palette: DEFAULT_PALETTES[0],
    headingFont: "sans",
    bodyFont: "sans",
    image: IMAGE,
    heading: "Des objets choisis, livrés chez toi",
    subheading:
      "Une sélection courte, des prix justes et la livraison partout en Afrique de l’Ouest.",
    collectionHeading: "Les dernières arrivées",
    introHeading: "Pensé pour la vraie vie",
    introText:
      "Chaque produit est testé avant d’entrer dans le catalogue. On privilégie les matières qui durent et les détails qui comptent.",
    announce: "Livraison offerte dès 50 000 FCFA",
    stylePreset: "modern",
  },
  mode: {
    palette: palette("palette-mode", "Ivoire mode", {
      background: "#F6F1E8",
      text: "#111111",
      muted: "#57534E",
      accent: "#B08D57",
      buttonBg: "#111111",
      buttonText: "#FFFFFF",
      border: "#E5DED2",
      badgePromo: "#B08D57",
      badgeSoldOut: "#78716C",
      badgeNew: "#111111",
    }),
    headingFont: "serif",
    bodyFont: "sans",
    image: IMAGE_CATALOG,
    heading: "La collection qui se porte tous les jours",
    subheading: "Coupes nettes, matières nobles, quantités limitées.",
    collectionHeading: "Pièces du moment",
    introHeading: "Le vestiaire essentiel",
    introText:
      "Des pièces dessinées pour durer, à porter ensemble ou séparément. Chaque référence est produite en petite série.",
    announce: "Livraison offerte dès 75 000 FCFA",
    stylePreset: "elegant",
  },
  beaute: {
    palette: palette("palette-beaute", "Rose poudré", {
      background: "#FDF2F4",
      text: "#3F1D2A",
      muted: "#8B5E6D",
      accent: "#9D174D",
      buttonBg: "#9D174D",
      buttonText: "#FFFFFF",
      border: "#F5DDE3",
      badgePromo: "#9D174D",
      badgeSoldOut: "#9CA3AF",
      badgeNew: "#DB2777",
    }),
    headingFont: "serif",
    bodyFont: "sans",
    image: IMAGE_CLIENT,
    heading: "Le rituel beauté, sans compromis",
    subheading: "Des formules douces, testées et pensées pour les peaux sensibles.",
    collectionHeading: "Nos essentiels",
    introHeading: "La beauté qui prend soin",
    introText:
      "Sélection de soins et accessoires choisis pour leur efficacité et leur tolérance. Sans promesses inutiles.",
    announce: "Échantillon offert dès 3 produits",
    stylePreset: "elegant",
  },
  electronique: {
    palette: palette("palette-electronique", "Nuit tech", {
      background: "#07111F",
      text: "#F8FAFC",
      muted: "#A9B7C9",
      accent: "#22D3EE",
      buttonBg: "#22D3EE",
      buttonText: "#07111F",
      border: "#1E293B",
      badgePromo: "#22D3EE",
      badgeSoldOut: "#64748B",
      badgeNew: "#34D399",
    }),
    headingFont: "sans",
    bodyFont: "sans",
    image: IMAGE_DELIVERY,
    heading: "La tech qui tient ses promesses",
    subheading: "Des appareils testés, garantis et livrés avec leurs accessoires.",
    collectionHeading: "Arrivages tech",
    introHeading: "Testé avant expédition",
    introText:
      "Chaque appareil est vérifié, chargé et emballé avec soin. La garantie et le SAV sont inclus.",
    announce: "Livraison en 24-48 h dans les grandes villes",
    stylePreset: "bold",
  },
  alimentation: {
    palette: palette("palette-alimentation", "Marché frais", {
      background: "#F8F4E8",
      text: "#1C2A1A",
      muted: "#5B6B56",
      accent: "#166534",
      buttonBg: "#166534",
      buttonText: "#FFFFFF",
      border: "#E4E0CE",
      badgePromo: "#EAB308",
      badgeSoldOut: "#78716C",
      badgeNew: "#16A34A",
    }),
    headingFont: "serif",
    bodyFont: "sans",
    image: IMAGE_CATALOG,
    heading: "Le goût du local, livré frais",
    subheading: "Des produits de saison, sourcés près de chez toi.",
    collectionHeading: "La sélection de la semaine",
    introHeading: "Du champ à ta cuisine",
    introText:
      "On travaille avec des producteurs locaux, on récolte à la demande et on livre vite pour garder le goût.",
    announce: "Livraison fraîche le mercredi et le samedi",
    stylePreset: "minimal",
  },
  createur: {
    palette: palette("palette-createur", "Violet créateur", {
      background: "#0B0714",
      text: "#F5F3FF",
      muted: "#B9AEE0",
      accent: "#8B5CF6",
      buttonBg: "#8B5CF6",
      buttonText: "#FFFFFF",
      border: "#241B3D",
      badgePromo: "#8B5CF6",
      badgeSoldOut: "#64748B",
      badgeNew: "#22D3EE",
    }),
    headingFont: "sans",
    bodyFont: "sans",
    image: IMAGE,
    heading: "Des fichiers qui font gagner du temps",
    subheading: "Templates, formations et ressources numériques téléchargeables immédiatement.",
    collectionHeading: "Les ressources populaires",
    introHeading: "Téléchargement immédiat",
    introText:
      "Paie, télécharge, utilise. Les fichiers sont mis à jour gratuitement et accessibles à vie.",
    announce: "Téléchargement immédiat après paiement",
    stylePreset: "modern",
  },
  services: {
    palette: palette("palette-services", "Ardoise", {
      background: "#0F172A",
      text: "#F8FAFC",
      muted: "#94A3B8",
      accent: "#F97316",
      buttonBg: "#F97316",
      buttonText: "#111827",
      border: "#1E293B",
      badgePromo: "#F97316",
      badgeSoldOut: "#64748B",
      badgeNew: "#22C55E",
    }),
    headingFont: "sans",
    bodyFont: "sans",
    image: IMAGE_DELIVERY,
    heading: "Réserve ton créneau en deux minutes",
    subheading: "Des prestations claires, des créneaux réels, une confirmation immédiate.",
    collectionHeading: "Nos prestations",
    introHeading: "Un accompagnement simple",
    introText:
      "Choisis la prestation, le créneau et paie en ligne. Tu reçois la confirmation et les détails par e-mail.",
    announce: "Réservation en ligne 24 h/24",
    stylePreset: "bold",
  },
};

export function createThemeDocument(presetId: ThemePresetId = "dawn"): ThemeDocument {
  const preset = PRESET_THEMES[presetId] ?? PRESET_THEMES.dawn;
  const settings = defaultSettings({
    palettes: [preset.palette, ...DEFAULT_PALETTES.slice(1)],
    activePaletteId: preset.palette.id,
    headingFont: preset.headingFont,
    bodyFont: preset.bodyFont,
    stylePreset: preset.stylePreset,
  });

  return {
    schemaVersion: 1,
    settings,
    header: headerSections(preset.announce),
    footer: footerSections(),
    templates: defaultTemplates(
      defaultHomeSections({
        heading: preset.heading,
        subheading: preset.subheading,
        collectionHeading: preset.collectionHeading,
        introHeading: preset.introHeading,
        introText: preset.introText,
        image: preset.image,
      }),
    ),
  };
}

export const DEFAULT_DOCUMENT = createThemeDocument("dawn");

export const TEMPLATE_TYPE_LABELS: Record<ThemeTemplateType, string> = {
  index: "Pages",
  product: "Produits",
  collection: "Collections",
  "list-collections": "Liste des collections",
  page: "Pages",
  blog: "Blog",
  article: "Articles de blog",
  search: "Recherche",
  cart: "Panier",
  "404": "Page 404",
  password: "Page de mot de passe",
};

export function templateLabel(type: ThemeTemplateType): string {
  const labels: Record<ThemeTemplateType, string> = {
    index: "Page d’accueil",
    product: "Produit",
    collection: "Collection",
    "list-collections": "Liste des collections",
    page: "Page",
    blog: "Blog",
    article: "Article de blog",
    search: "Résultats de recherche",
    cart: "Panier",
    "404": "Page 404",
    password: "Page de mot de passe",
  };
  return labels[type];
}

export function newTemplate(
  type: ThemeTemplateType,
  name: string,
  source?: ThemeTemplate,
): ThemeTemplate {
  const base = source
    ? source.sections.map(cloneSection)
    : defaultTemplateSections(type);

  return {
    id: makeId("template"),
    type,
    name: name.trim() || templateLabel(type),
    sections: base,
  };
}

function cloneSection(entry: ThemeSectionInstance): ThemeSectionInstance {
  return {
    ...entry,
    id: makeId("section"),
    settings: { ...entry.settings },
    blocks: entry.blocks.map((block) => ({
      ...block,
      id: makeId("block"),
      settings: { ...block.settings },
    })),
  };
}

export function cloneTemplate(template: ThemeTemplate, name: string): ThemeTemplate {
  return {
    id: makeId("template"),
    type: template.type,
    name,
    sections: template.sections.map(cloneSection),
  };
}

export function defaultTemplateSections(
  type: ThemeTemplateType,
): ThemeSectionInstance[] {
  const found = defaultTemplates(createThemeDocument("dawn").templates[0].sections).find(
    (template) => template.type === type,
  );
  return found ? found.sections.map(cloneSection) : [];
}

/** Copie profonde d'un document, utilisée par les opérations de l'éditeur. */
export function cloneDocument(document: ThemeDocument): ThemeDocument {
  return structuredClone(document);
}

export const STYLE_PRESETS: Record<
  ThemeSettings["stylePreset"],
  { label: string; description: string; settings: Partial<ThemeSettings> }
> = {
  modern: {
    label: "Moderne",
    description: "Grands titres, cartes arrondies, contrastes nets.",
    settings: {
      headingFont: "sans",
      bodyFont: "sans",
      headingWeight: 600,
      typeScale: 1.15,
      sectionSpacing: 64,
      productCard: {
        radius: 16,
        border: true,
        shadow: false,
        imageRatio: "portrait",
        showPrice: true,
        showVendor: false,
        showBadge: true,
        badgeStyle: "pill",
      },
      revealOnScroll: true,
    },
  },
  minimal: {
    label: "Minimaliste",
    description: "Peu de décoration, beaucoup d’espace, typographie discrète.",
    settings: {
      headingFont: "sans",
      bodyFont: "sans",
      headingWeight: 500,
      typeScale: 1.05,
      sectionSpacing: 80,
      productCard: {
        radius: 4,
        border: false,
        shadow: false,
        imageRatio: "square",
        showPrice: true,
        showVendor: false,
        showBadge: false,
        badgeStyle: "none",
      },
      revealOnScroll: false,
    },
  },
  elegant: {
    label: "Élégant",
    description: "Serif éditorial, images hautes, ombres légères.",
    settings: {
      headingFont: "serif",
      bodyFont: "sans",
      headingWeight: 500,
      typeScale: 1.25,
      sectionSpacing: 72,
      letterSpacing: 0.2,
      productCard: {
        radius: 12,
        border: false,
        shadow: true,
        imageRatio: "portrait",
        showPrice: true,
        showVendor: false,
        showBadge: true,
        badgeStyle: "square",
      },
      revealOnScroll: true,
    },
  },
  bold: {
    label: "Audacieux",
    description: "Contrastes forts, titres massifs, badges visibles.",
    settings: {
      headingFont: "sans",
      bodyFont: "sans",
      headingWeight: 800,
      typeScale: 1.35,
      sectionSpacing: 56,
      letterSpacing: -0.4,
      productCard: {
        radius: 20,
        border: true,
        shadow: true,
        imageRatio: "landscape",
        showPrice: true,
        showVendor: true,
        showBadge: true,
        badgeStyle: "pill",
      },
      revealOnScroll: true,
    },
  },
};

/* ------------------------------------------------------------------ *
 *  Commerce : sections autorisées par modèle
 * ------------------------------------------------------------------ */

export function sectionsForTemplateType(type: ThemeTemplateType): string[] {
  const dynamic =
    type === "product"
      ? "product"
      : type === "collection"
        ? "collection"
        : type === "page"
          ? "page"
          : type === "blog"
            ? "blog"
            : type === "article"
              ? "article"
              : type === "search"
                ? "search"
                : type === "cart"
                  ? "cart"
                  : null;

  return SECTION_SCHEMAS.filter((schema) => {
    if (schema.chrome) return false;
    if (schema.dynamic && schema.dynamic !== dynamic) return false;
    if (type === "404") return schema.type === "not-found" || schema.category === "content";
    if (type === "password") return schema.type === "password-form" || schema.category === "content";
    return true;
  }).map((schema) => schema.type);
}

export function isBlockAllowed(sectionType: string, blockType: string): boolean {
  const schema = getSectionSchema(sectionType);
  if (!schema) return false;
  return schema.blocks?.allowed.includes(blockType) ?? false;
}

export function blockTypesForSection(sectionType: string): string[] {
  const schema = getSectionSchema(sectionType);
  const allowed = schema?.blocks?.allowed ?? [];
  return allowed.filter((type) => Boolean(BLOCK_SCHEMAS[type]));
}

export function sectionDefaultName(type: string): string {
  return getSectionSchema(type)?.label ?? type;
}

export function sectionCategoryLabel(
  category: NonNullable<ReturnType<typeof getSectionSchema>>["category"],
): string {
  const labels: Record<string, string> = {
    header: "En-tête et navigation",
    banner: "Bannières et médias",
    content: "Contenu éditorial",
    commerce: "Commerce",
    marketing: "Conversion et marketing",
    footer: "Pied de page",
    advanced: "Avancé",
    dynamic: "Sections dynamiques",
  };
  return labels[category] ?? category;
}
