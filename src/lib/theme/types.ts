export type ThemePresetId = "pashove" | "ivoire" | "foret" | "minuit" | "dwell";
export type ThemeFont = "sans" | "serif" | "mono";
export type ThemeSectionKey = "products" | "collections" | "bundles";

export type ThemeSection = {
  key: ThemeSectionKey;
  enabled: boolean;
};

export type ThemeBlockType =
  | "text"
  | "image"
  | "video"
  | "newsletter"
  | "faq"
  | "testimonials";

export type ThemeBlockItem = {
  title: string;
  text: string;
  author?: string;
};

export type ThemeBlock = {
  id: string;
  type: ThemeBlockType;
  enabled: boolean;
  title: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  ctaLabel: string;
  ctaHref: string;
  items: ThemeBlockItem[];
};

export type StoreTheme = {
  preset: ThemePresetId;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  foregroundColor: string;
  font: ThemeFont;
  sections: ThemeSection[];
  blocks: ThemeBlock[];
  updatedAt?: string | null;
};
