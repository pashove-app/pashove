export type ThemePresetId = "pashove" | "ivoire" | "foret" | "minuit";
export type ThemeFont = "sans" | "serif" | "mono";
export type ThemeSectionKey = "products" | "collections" | "bundles";

export type ThemeSection = {
  key: ThemeSectionKey;
  enabled: boolean;
};

export type StoreTheme = {
  preset: ThemePresetId;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  foregroundColor: string;
  font: ThemeFont;
  sections: ThemeSection[];
  updatedAt?: string | null;
};
