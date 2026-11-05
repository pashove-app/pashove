import type { StoreTheme, ThemePresetId } from "@/lib/theme/types";

export const DEFAULT_THEME: StoreTheme = {
  preset: "pashove",
  accentColor: "#2F5CFF",
  backgroundColor: "#04060D",
  surfaceColor: "#0B101B",
  foregroundColor: "#FFFFFF",
  font: "sans",
  sections: [
    { key: "products", enabled: true },
    { key: "collections", enabled: true },
    { key: "bundles", enabled: true },
  ],
  blocks: [],
};

export const THEME_PRESETS: {
  id: ThemePresetId;
  name: string;
  description: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  foregroundColor: string;
  font: StoreTheme["font"];
}[] = [
  {
    id: "pashove",
    name: "Pashove",
    description: "Bleu profond, nuit nette, la signature de la plateforme.",
    accentColor: "#2F5CFF",
    backgroundColor: "#04060D",
    surfaceColor: "#0B101B",
    foregroundColor: "#FFFFFF",
    font: "sans",
  },
  {
    id: "ivoire",
    name: "Ivoire",
    description: "Fond chaud, terre cuite, une vitrine de boutique d’auteur.",
    accentColor: "#9A3412",
    backgroundColor: "#FAF7F2",
    surfaceColor: "#FFFFFF",
    foregroundColor: "#1C1917",
    font: "serif",
  },
  {
    id: "foret",
    name: "Forêt",
    description: "Vert dense, matière brute, pour les produits naturels.",
    accentColor: "#15803D",
    backgroundColor: "#06130E",
    surfaceColor: "#0B1F17",
    foregroundColor: "#F3FFF8",
    font: "sans",
  },
  {
    id: "minuit",
    name: "Minuit",
    description: "Violet nocturne, contraste doux, pour les créations.",
    accentColor: "#6D28D9",
    backgroundColor: "#080B18",
    surfaceColor: "#101628",
    foregroundColor: "#F5F7FF",
    font: "sans",
  },
  {
    id: "dwell",
    name: "Dwell",
    description:
      "Ivoire, terre cuite et typographie éditoriale : une vitrine calme et haut de gamme.",
    accentColor: "#8B6F47",
    backgroundColor: "#F4F1EA",
    surfaceColor: "#FFFFFF",
    foregroundColor: "#1A1A1A",
    font: "serif",
  },
];

export function presetById(id: ThemePresetId) {
  return THEME_PRESETS.find((preset) => preset.id === id) ?? THEME_PRESETS[0];
}

export function themeFromPreset(
  id: ThemePresetId,
  sections: StoreTheme["sections"],
  blocks: StoreTheme["blocks"] = [],
): StoreTheme {
  const preset = presetById(id);

  return {
    preset: preset.id,
    accentColor: preset.accentColor,
    backgroundColor: preset.backgroundColor,
    surfaceColor: preset.surfaceColor,
    foregroundColor: preset.foregroundColor,
    font: preset.font,
    sections,
    blocks,
  };
}
