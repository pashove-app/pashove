import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_THEME, THEME_PRESETS } from "@/lib/theme/presets";
import { normalizeHex } from "@/lib/theme/color";
import type {
  StoreTheme,
  ThemeBlock,
  ThemeBlockType,
  ThemeFont,
  ThemePresetId,
  ThemeSection,
  ThemeSectionKey,
} from "@/lib/theme/types";

const SECTION_KEYS: ThemeSectionKey[] = [
  "products",
  "collections",
  "bundles",
];

function normalizeSections(value: unknown): ThemeSection[] {
  if (!Array.isArray(value)) return DEFAULT_THEME.sections;

  const seen = new Set<ThemeSectionKey>();
  const sections: ThemeSection[] = [];

  for (const entry of value) {
    const key = (entry as { key?: unknown })?.key;
    if (
      typeof key !== "string" ||
      !SECTION_KEYS.includes(key as ThemeSectionKey) ||
      seen.has(key as ThemeSectionKey)
    ) {
      continue;
    }

    seen.add(key as ThemeSectionKey);
    sections.push({
      key: key as ThemeSectionKey,
      enabled: (entry as { enabled?: unknown })?.enabled !== false,
    });
  }

  for (const key of SECTION_KEYS) {
    if (!seen.has(key)) sections.push({ key, enabled: true });
  }

  return sections;
}

const BLOCK_TYPES: ThemeBlockType[] = [
  "text",
  "image",
  "video",
  "newsletter",
  "faq",
  "testimonials",
];

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function normalizeBlocks(value: unknown): ThemeBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .filter((entry) => BLOCK_TYPES.includes(entry.type as ThemeBlockType))
    .slice(0, 20)
    .map((entry, index) => ({
      id: text(entry.id, 80) || `block-${index + 1}`,
      type: entry.type as ThemeBlockType,
      enabled: entry.enabled !== false,
      title: text(entry.title, 160),
      body: text(entry.body, 5000),
      imageUrl: text(entry.imageUrl, 500),
      videoUrl: text(entry.videoUrl, 500),
      ctaLabel: text(entry.ctaLabel, 80),
      ctaHref: text(entry.ctaHref, 300),
      items: Array.isArray(entry.items)
        ? entry.items
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
            .slice(0, 8)
            .map((item) => ({
              title: text(item.title, 120),
              text: text(item.text, 500),
              author: text(item.author, 80),
            }))
        : [],
    }));
}

function normalizeTheme(value: unknown): StoreTheme {
  const raw = (value ?? {}) as Record<string, unknown>;
  const preset = THEME_PRESETS.some((entry) => entry.id === raw.preset)
    ? (raw.preset as ThemePresetId)
    : DEFAULT_THEME.preset;
  const font = ["sans", "serif", "mono"].includes(String(raw.font))
    ? (raw.font as ThemeFont)
    : DEFAULT_THEME.font;

  return {
    preset,
    accentColor: normalizeHex(raw.accentColor, DEFAULT_THEME.accentColor),
    backgroundColor: normalizeHex(
      raw.backgroundColor,
      DEFAULT_THEME.backgroundColor,
    ),
    surfaceColor: normalizeHex(raw.surfaceColor, DEFAULT_THEME.surfaceColor),
    foregroundColor: normalizeHex(
      raw.foregroundColor,
      DEFAULT_THEME.foregroundColor,
    ),
    font,
    sections: normalizeSections(raw.sections),
    blocks: normalizeBlocks(raw.blocks),
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : null,
  };
}

/** Thème public d'une boutique ; `cache` évite deux RPC dans la même page. */
export const getPublicStoreTheme = cache(
  async (slug: string): Promise<StoreTheme> => {
    const supabase = createPublicClient();
    const { data } = await supabase.rpc("public_store_theme", {
      p_slug: slug,
    });
    return normalizeTheme(data);
  },
);

/** Thème courant pour l'éditeur marchand. */
export async function getStoreTheme(storeId: string): Promise<StoreTheme> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("store_theme", {
    p_store_id: storeId,
  });
  return normalizeTheme(data);
}
