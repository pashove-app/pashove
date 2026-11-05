"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { DEFAULT_THEME, themeFromPreset } from "@/lib/theme/presets";
import { getStoreTheme } from "@/lib/theme/queries";
import type {
  StoreTheme,
  ThemeBlock,
  ThemeBlockType,
  ThemeFont,
  ThemePresetId,
  ThemeSection,
  ThemeSectionKey,
} from "@/lib/theme/types";

export type ThemeActionResult = {
  ok: boolean;
  theme?: StoreTheme;
  error?: "invalid" | "unauthorized" | "failed";
};

const PRESETS: ThemePresetId[] = ["pashove", "ivoire", "foret", "minuit"];
const FONTS: ThemeFont[] = ["sans", "serif", "mono"];
const SECTION_KEYS: ThemeSectionKey[] = [
  "products",
  "collections",
  "bundles",
];
const HEX = /^#[0-9a-fA-F]{6}$/;
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

function normaliseBlocks(value: unknown): ThemeBlock[] | null {
  if (!Array.isArray(value) || value.length > 20) return null;

  const blocks: ThemeBlock[] = [];

  for (const [index, entry] of value.entries()) {
    if (!entry || typeof entry !== "object") return null;
    const raw = entry as Record<string, unknown>;
    const type = raw.type;

    if (!BLOCK_TYPES.includes(type as ThemeBlockType)) return null;

    blocks.push({
      id: text(raw.id, 80) || `block-${index + 1}`,
      type: type as ThemeBlockType,
      enabled: raw.enabled !== false,
      title: text(raw.title, 160),
      body: text(raw.body, 5000),
      imageUrl: text(raw.imageUrl, 500),
      videoUrl: text(raw.videoUrl, 500),
      ctaLabel: text(raw.ctaLabel, 80),
      ctaHref: text(raw.ctaHref, 300),
      items: Array.isArray(raw.items)
        ? raw.items.slice(0, 8).map((item) => {
            const value = (item ?? {}) as Record<string, unknown>;
            return {
              title: text(value.title, 120),
              text: text(value.text, 500),
              author: text(value.author, 80),
            };
          })
        : [],
    });
  }

  return blocks;
}

function normaliseSections(value: unknown): ThemeSection[] | null {
  if (!Array.isArray(value) || value.length > 6) return null;

  const seen = new Set<ThemeSectionKey>();
  const sections: ThemeSection[] = [];

  for (const entry of value) {
    const key = (entry as { key?: unknown })?.key;
    if (
      typeof key !== "string" ||
      !SECTION_KEYS.includes(key as ThemeSectionKey) ||
      seen.has(key as ThemeSectionKey)
    ) {
      return null;
    }
    seen.add(key as ThemeSectionKey);
    sections.push({
      key: key as ThemeSectionKey,
      enabled: (entry as { enabled?: unknown })?.enabled !== false,
    });
  }

  return sections;
}

async function persistBlocks(
  storeId: string,
  blocks: ThemeBlock[],
): Promise<boolean> {
  const client = await createClient();
  const { error } = await client.rpc("save_store_blocks", {
    p_store_id: storeId,
    p_blocks: blocks,
  });

  return !error;
}

async function persist(storeId: string, theme: StoreTheme): Promise<ThemeActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "failed" };

  const client = await createClient();
  const { data, error } = await client.rpc("save_store_theme", {
    p_store_id: storeId,
    p_preset: theme.preset,
    p_accent_color: theme.accentColor,
    p_background_color: theme.backgroundColor,
    p_surface_color: theme.surfaceColor,
    p_foreground_color: theme.foregroundColor,
    p_font: theme.font,
    p_sections: theme.sections,
  });

  if (error || !data) return { ok: false, error: "failed" };

  if (!(await persistBlocks(storeId, theme.blocks))) {
    return { ok: false, error: "failed" };
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    theme: {
      ...(data as StoreTheme),
      sections: theme.sections,
      blocks: theme.blocks,
    },
  };
}

export async function saveThemeAction(
  storeId: string,
  theme: StoreTheme,
): Promise<ThemeActionResult> {
  if (!storeId || !theme) return { ok: false, error: "invalid" };

  if (
    !PRESETS.includes(theme.preset) ||
    !FONTS.includes(theme.font) ||
    !HEX.test(theme.accentColor) ||
    !HEX.test(theme.backgroundColor) ||
    !HEX.test(theme.surfaceColor) ||
    !HEX.test(theme.foregroundColor)
  ) {
    return { ok: false, error: "invalid" };
  }

  const sections = normaliseSections(theme.sections);
  if (!sections) return { ok: false, error: "invalid" };

  const blocks = normaliseBlocks(theme.blocks);
  if (!blocks) return { ok: false, error: "invalid" };

  return persist(storeId, { ...theme, sections, blocks });
}

export async function applyThemePresetAction(
  storeId: string,
  presetId: ThemePresetId,
): Promise<ThemeActionResult> {
  if (!storeId || !PRESETS.includes(presetId)) {
    return { ok: false, error: "invalid" };
  }

  const current = await getStoreTheme(storeId);
  const next = themeFromPreset(presetId, current.sections, current.blocks);
  return persist(storeId, next);
}

export async function resetThemeAction(
  storeId: string,
): Promise<ThemeActionResult> {
  if (!storeId) return { ok: false, error: "invalid" };
  return persist(storeId, { ...DEFAULT_THEME, blocks: [] });
}
