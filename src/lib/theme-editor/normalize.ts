import type {
  SettingValue,
  ThemeBlockInstance,
  ThemeDocument,
  ThemePalette,
  ThemeSectionInstance,
  ThemeSettings,
  ThemeTemplate,
  ThemeTemplateType,
} from "@/lib/theme-editor/types";
import { TEMPLATE_TYPES } from "@/lib/theme-editor/types";
import { DEFAULT_PALETTES, getBlockSchema, getSectionSchema } from "@/lib/theme-editor/schema";
import { defaultSettings } from "@/lib/theme-editor/defaults";

export const MAX_SECTIONS_PER_TEMPLATE = 25;
export const MAX_BLOCKS_PER_TEMPLATE = 1250;
export const MAX_TEMPLATES = 24;
export const MAX_BLOCKS_PER_SECTION = 40;

const MAX_TEXT = 4000;
const MAX_LONG_TEXT = 20000;
const MAX_URL = 1000;
const HEX = /^#[0-9a-fA-F]{6}$/;

function asString(value: unknown, max = MAX_TEXT): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function asNumber(value: unknown, fallback: number, min = -1000000, max = 1000000): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asHex(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX.test(value) ? value.toUpperCase() : fallback;
}

function normalizeValue(value: unknown, key: string): SettingValue | undefined {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return typeof value === "number" && !Number.isFinite(value) ? undefined : value;
  }

  if (typeof value === "string") {
    const max =
      key.toLowerCase().includes("css") || key.toLowerCase().includes("code")
        ? MAX_LONG_TEXT
        : key.toLowerCase().includes("link") || key.toLowerCase().includes("url")
          ? MAX_URL
          : MAX_TEXT;
    return value.slice(0, max);
  }

  if (typeof value === "object") {
    const ref = (value as { $metafield?: Record<string, unknown> }).$metafield;
    if (ref && typeof ref === "object") {
      const owner = ref.owner;
      if (
        owner === "product" ||
        owner === "collection" ||
        owner === "page" ||
        owner === "article" ||
        owner === "shop"
      ) {
        return {
          $metafield: {
            owner,
            namespace: asString(ref.namespace, 40) || "custom",
            key: asString(ref.key, 60),
            fallback: asString(ref.fallback, MAX_TEXT),
          },
        };
      }
    }
  }

  return undefined;
}

function normalizeSettingsValue(raw: Record<string, unknown>): Record<string, SettingValue> {
  const out: Record<string, SettingValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.length > 80) continue;
    const normalized = normalizeValue(value, key);
    if (normalized !== undefined) out[key] = normalized;
  }
  return out;
}

function normalizePalettes(value: unknown): ThemePalette[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_PALETTES;

  const palettes: ThemePalette[] = [];
  for (const entry of value.slice(0, 12)) {
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    const name = asString(raw.name, 40) || "Palette";
    const id = asString(raw.id, 80) || `palette-${palettes.length + 1}`;
    palettes.push({
      id,
      name,
      background: asHex(raw.background, "#04060D"),
      text: asHex(raw.text, "#FFFFFF"),
      muted: asHex(raw.muted, "#A7B0C0"),
      accent: asHex(raw.accent, "#2F5CFF"),
      buttonBg: asHex(raw.buttonBg, "#2F5CFF"),
      buttonText: asHex(raw.buttonText, "#FFFFFF"),
      border: asHex(raw.border, "#1A2131"),
      badgePromo: asHex(raw.badgePromo, "#2F5CFF"),
      badgeSoldOut: asHex(raw.badgeSoldOut, "#6B7280"),
      badgeNew: asHex(raw.badgeNew, "#10B981"),
    });
  }

  return palettes.length > 0 ? palettes : DEFAULT_PALETTES;
}

export function normalizeSettings(value: unknown): ThemeSettings {
  const base = defaultSettings();
  if (!value || typeof value !== "object") return base;

  const raw = value as Record<string, unknown>;
  const productCardRaw =
    raw.productCard && typeof raw.productCard === "object"
      ? (raw.productCard as Record<string, unknown>)
      : {};

  const stylePreset =
    raw.stylePreset === "minimal" ||
    raw.stylePreset === "elegant" ||
    raw.stylePreset === "bold"
      ? raw.stylePreset
      : "modern";

  const translations: Record<string, string> = {};
  if (raw.translations && typeof raw.translations === "object") {
    for (const [key, entry] of Object.entries(raw.translations as Record<string, unknown>).slice(0, 200)) {
      if (typeof entry === "string") translations[key.slice(0, 120)] = entry.slice(0, 1000);
    }
  }

  return {
    ...base,
    logoUrl: asString(raw.logoUrl, MAX_URL),
    logoAlt: asString(raw.logoAlt, 160),
    logoWidth: asNumber(raw.logoWidth, 40, 16, 240),
    mobileLogoUrl: asString(raw.mobileLogoUrl, MAX_URL),
    logoPosition: raw.logoPosition === "center" ? "center" : "left",
    faviconUrl: asString(raw.faviconUrl, MAX_URL),
    palettes: normalizePalettes(raw.palettes),
    activePaletteId: asString(raw.activePaletteId, 80),
    headingFont: asString(raw.headingFont, 40) || "sans",
    bodyFont: asString(raw.bodyFont, 40) || "sans",
    typeScale: asNumber(raw.typeScale, 1.15, 0.8, 2),
    baseFontSize: asNumber(raw.baseFontSize, 16, 12, 22),
    headingWeight: asNumber(raw.headingWeight, 600, 300, 900),
    lineHeight: asNumber(raw.lineHeight, 1.55, 1, 2.4),
    letterSpacing: asNumber(raw.letterSpacing, 0, -2, 4),
    pageWidth:
      raw.pageWidth === "1200" || raw.pageWidth === "1600" || raw.pageWidth === "full"
        ? raw.pageWidth
        : "1400",
    contentWidth:
      raw.contentWidth === "narrow" || raw.contentWidth === "wide"
        ? raw.contentWidth
        : "normal",
    sectionSpacing: asNumber(raw.sectionSpacing, 64, 0, 160),
    gridGapX: asNumber(raw.gridGapX, 20, 0, 64),
    gridGapY: asNumber(raw.gridGapY, 28, 0, 64),
    pageMargin: asNumber(raw.pageMargin, 20, 0, 64),
    revealOnScroll: asBoolean(raw.revealOnScroll, true),
    revealAnimation:
      raw.revealAnimation === "slide" || raw.revealAnimation === "zoom"
        ? raw.revealAnimation
        : "fade",
    cardHover:
      raw.cardHover === "tilt" || raw.cardHover === "none" ? raw.cardHover : "elevate",
    hoverLift: asNumber(raw.hoverLift, 4, 0, 32),
    hoverPerspective: asNumber(raw.hoverPerspective, 600, 100, 2000),
    buttonHover:
      raw.buttonHover === "shadow" || raw.buttonHover === "none"
        ? raw.buttonHover
        : "scale",
    productCard: {
      radius: asNumber(productCardRaw.radius, 16, 0, 48),
      border: asBoolean(productCardRaw.border, true),
      shadow: asBoolean(productCardRaw.shadow, false),
      imageRatio:
        productCardRaw.imageRatio === "square" ||
        productCardRaw.imageRatio === "landscape" ||
        productCardRaw.imageRatio === "adapt"
          ? productCardRaw.imageRatio
          : "portrait",
      showPrice: asBoolean(productCardRaw.showPrice, true),
      showVendor: asBoolean(productCardRaw.showVendor, false),
      showBadge: asBoolean(productCardRaw.showBadge, true),
      badgeStyle:
        productCardRaw.badgeStyle === "square" || productCardRaw.badgeStyle === "none"
          ? productCardRaw.badgeStyle
          : "pill",
    },
    collectionCardRadius: asNumber(raw.collectionCardRadius, 16, 0, 48),
    collectionCardShadow: asBoolean(raw.collectionCardShadow, false),
    collectionCardShowCount: asBoolean(raw.collectionCardShowCount, true),
    articleCardRadius: asNumber(raw.articleCardRadius, 16, 0, 48),
    articleCardShowExcerpt: asBoolean(raw.articleCardShowExcerpt, true),
    articleCardShowDate: asBoolean(raw.articleCardShowDate, true),
    mediaRadius: asNumber(raw.mediaRadius, 20, 0, 64),
    mediaBorder: asBoolean(raw.mediaBorder, true),
    mediaShadow: asBoolean(raw.mediaShadow, false),
    menuStyle:
      raw.menuStyle === "modal" || raw.menuStyle === "drawer"
        ? raw.menuStyle
        : "dropdown",
    badgePosition: raw.badgePosition === "top-right" ? "top-right" : "top-left",
    socialInstagram: asString(raw.socialInstagram, MAX_URL),
    socialFacebook: asString(raw.socialFacebook, MAX_URL),
    socialTiktok: asString(raw.socialTiktok, MAX_URL),
    socialYoutube: asString(raw.socialYoutube, MAX_URL),
    socialPinterest: asString(raw.socialPinterest, MAX_URL),
    socialX: asString(raw.socialX, MAX_URL),
    socialLinkedin: asString(raw.socialLinkedin, MAX_URL),
    socialWhatsapp: asString(raw.socialWhatsapp, MAX_URL),
    searchSuggestions: asBoolean(raw.searchSuggestions, true),
    searchShowVendor: asBoolean(raw.searchShowVendor, false),
    searchShowPrice: asBoolean(raw.searchShowPrice, true),
    searchSuggestionCount: asNumber(raw.searchSuggestionCount, 5, 3, 10),
    currencyShowCode: asBoolean(raw.currencyShowCode, false),
    currencySymbolPosition:
      raw.currencySymbolPosition === "before" ? "before" : "after",
    currencyThousands:
      raw.currencyThousands === "comma" || raw.currencyThousands === "dot"
        ? raw.currencyThousands
        : "space",
    cartType:
      raw.cartType === "page" || raw.cartType === "popup" ? raw.cartType : "drawer",
    cartShowVendor: asBoolean(raw.cartShowVendor, false),
    cartNote: asBoolean(raw.cartNote, true),
    cartEmptyCollectionId: asString(raw.cartEmptyCollectionId, 80),
    cartBgColor: asString(raw.cartBgColor, 20),
    cartTextColor: asString(raw.cartTextColor, 20),
    cartButtonColor: asString(raw.cartButtonColor, 20),
    customCss: asString(raw.customCss, MAX_LONG_TEXT),
    stylePreset,
    translations,
  };
}

function normalizeBlock(value: unknown, sectionType: string): ThemeBlockInstance | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const type = asString(raw.type, 60);
  const schema = getBlockSchema(type);
  const section = getSectionSchema(sectionType);
  const allowed = section?.blocks?.allowed.includes(type) ?? false;
  if (!schema || !allowed) return null;

  return {
    id: asString(raw.id, 100) || `block-${Math.random().toString(36).slice(2, 8)}`,
    type,
    name: asString(raw.name, 80) || undefined,
    visible: asBoolean(raw.visible, true),
    settings: normalizeSettingsValue(
      raw.settings && typeof raw.settings === "object"
        ? (raw.settings as Record<string, unknown>)
        : {},
    ),
  };
}

function normalizeSection(value: unknown): ThemeSectionInstance | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const type = asString(raw.type, 60);
  const schema = getSectionSchema(type);
  if (!schema) return null;

  const blocks: ThemeBlockInstance[] = [];
  if (Array.isArray(raw.blocks)) {
    for (const entry of raw.blocks.slice(0, MAX_BLOCKS_PER_SECTION)) {
      const block = normalizeBlock(entry, type);
      if (block) blocks.push(block);
    }
  }

  return {
    id: asString(raw.id, 100) || `section-${Math.random().toString(36).slice(2, 8)}`,
    type,
    name: asString(raw.name, 80) || schema.label,
    visible: asBoolean(raw.visible, true),
    settings: normalizeSettingsValue(
      raw.settings && typeof raw.settings === "object"
        ? (raw.settings as Record<string, unknown>)
        : {},
    ),
    blocks,
  };
}

function normalizeSections(value: unknown, max: number): ThemeSectionInstance[] {
  if (!Array.isArray(value)) return [];
  const out: ThemeSectionInstance[] = [];
  let remainingBlocks = MAX_BLOCKS_PER_TEMPLATE;

  for (const entry of value.slice(0, max)) {
    const section = normalizeSection(entry);
    if (!section) continue;
    if (section.blocks.length > remainingBlocks) {
      section.blocks = section.blocks.slice(0, Math.max(0, remainingBlocks));
    }
    remainingBlocks -= section.blocks.length;
    out.push(section);
  }

  return out;
}

function normalizeTemplate(value: unknown): ThemeTemplate | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const type = raw.type;
  if (typeof type !== "string" || !TEMPLATE_TYPES.includes(type as ThemeTemplateType)) {
    return null;
  }

  const sections = normalizeSections(raw.sections, MAX_SECTIONS_PER_TEMPLATE);
  if ((type as ThemeTemplateType) === "index" && sections.length === 0) return null;

  return {
    id: asString(raw.id, 100) || `template-${Math.random().toString(36).slice(2, 8)}`,
    type: type as ThemeTemplateType,
    name: asString(raw.name, 80) || "Modèle",
    sections,
  };
}

/** Valide et borne un document reçu du client. Retourne `null` s'il est inutilisable. */
export function normalizeDocument(value: unknown): ThemeDocument | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const templates: ThemeTemplate[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw.templates)) {
    for (const entry of raw.templates.slice(0, MAX_TEMPLATES)) {
      const template = normalizeTemplate(entry);
      if (!template || seen.has(template.id)) continue;
      seen.add(template.id);
      templates.push(template);
    }
  }

  const index = templates.find((template) => template.type === "index");
  if (!index) return null;

  return {
    schemaVersion: 1,
    settings: normalizeSettings(raw.settings),
    header: normalizeSections(raw.header, 8),
    footer: normalizeSections(raw.footer, 8),
    templates,
  };
}

export function countBlocks(document: ThemeDocument): number {
  return document.templates.reduce(
    (total, template) =>
      total + template.sections.reduce((sum, section) => sum + section.blocks.length, 0),
    0,
  );
}

export function isSectionVisibleForDevice(
  settings: Record<string, SettingValue>,
  device: "desktop" | "tablet" | "mobile",
): boolean {
  if (device === "desktop") return settings.showDesktop !== false;
  if (device === "tablet") return settings.showTablet !== false;
  return settings.showMobile !== false;
}
