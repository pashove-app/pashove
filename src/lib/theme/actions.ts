"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { DEFAULT_THEME, themeFromPreset } from "@/lib/theme/presets";
import { getStoreTheme } from "@/lib/theme/queries";
import type {
  StoreTheme,
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

  revalidatePath("/", "layout");
  return {
    ok: true,
    theme: {
      ...(data as StoreTheme),
      sections: theme.sections,
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

  return persist(storeId, { ...theme, sections });
}

export async function applyThemePresetAction(
  storeId: string,
  presetId: ThemePresetId,
): Promise<ThemeActionResult> {
  if (!storeId || !PRESETS.includes(presetId)) {
    return { ok: false, error: "invalid" };
  }

  const current = await getStoreTheme(storeId);
  const next = themeFromPreset(presetId, current.sections);
  return persist(storeId, next);
}

export async function resetThemeAction(
  storeId: string,
): Promise<ThemeActionResult> {
  if (!storeId) return { ok: false, error: "invalid" };
  return persist(storeId, DEFAULT_THEME);
}
