import type { CSSProperties } from "react";
import type { SettingValue, ThemePalette, ThemeSectionInstance, ThemeSettings } from "@/lib/theme-editor/types";
import { DEFAULT_PALETTES } from "@/lib/theme-editor/schema";

const FONTS: Record<string, string> = {
  sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  inter: 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, sans-serif',
  serif: 'var(--font-playfair), "Playfair Display", Georgia, "Times New Roman", serif',
  georgia: 'Georgia, "Times New Roman", serif',
  mono: 'var(--font-geist-mono), ui-monospace, "SF Mono", monospace',
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};

export function fontFamily(key: string | undefined): string {
  return FONTS[key ?? "sans"] ?? FONTS.sans;
}

export function activePalette(settings: ThemeSettings): ThemePalette {
  return (
    settings.palettes.find((palette) => palette.id === settings.activePaletteId) ??
    settings.palettes[0] ??
    DEFAULT_PALETTES[0]
  );
}

export function paletteById(settings: ThemeSettings, id: string): ThemePalette | null {
  return settings.palettes.find((palette) => palette.id === id) ?? null;
}

export function settingString(
  settings: Record<string, SettingValue>,
  key: string,
  fallback = "",
): string {
  const value = settings[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "";
  if (value && typeof value === "object" && "$metafield" in value) {
    return value.$metafield.fallback;
  }
  return fallback;
}

export function settingNumber(
  settings: Record<string, SettingValue>,
  key: string,
  fallback: number,
): number {
  const value = settings[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function settingBoolean(
  settings: Record<string, SettingValue>,
  key: string,
  fallback = false,
): boolean {
  const value = settings[key];
  return typeof value === "boolean" ? value : fallback;
}

export function resolveText(
  settings: Record<string, SettingValue>,
  key: string,
  metafields: Record<string, Record<string, unknown>> | undefined,
  fallback = "",
): string {
  const value = settings[key];
  if (value && typeof value === "object" && "$metafield" in value) {
    const ref = value.$metafield;
    const map = metafields?.[ref.owner] ?? {};
    const resolved = map[`${ref.namespace}.${ref.key}`];
    if (resolved !== undefined && resolved !== null && resolved !== "") {
      return typeof resolved === "string" ? resolved : JSON.stringify(resolved);
    }
    return ref.fallback;
  }
  return settingString(settings, key, fallback);
}

export function translate(settings: ThemeSettings, key: string, fallback: string): string {
  const value = settings.translations[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function pageBackground(settings: ThemeSettings): string {
  return activePalette(settings).background;
}

export function themeVars(settings: ThemeSettings): CSSProperties {
  const palette = activePalette(settings);
  const radius = settings.mediaRadius;
  return {
    "--t-bg": palette.background,
    "--t-text": palette.text,
    "--t-muted": palette.muted,
    "--t-accent": palette.accent,
    "--t-btn-bg": palette.buttonBg,
    "--t-btn-text": palette.buttonText,
    "--t-border": palette.border,
    "--t-promo": palette.badgePromo,
    "--t-soldout": palette.badgeSoldOut,
    "--t-new": palette.badgeNew,
    "--t-radius": `${radius}px`,
    "--t-page-width": settings.pageWidth === "full" ? "100%" : `${settings.pageWidth}px`,
    "--t-content-width":
      settings.contentWidth === "narrow"
        ? "760px"
        : settings.contentWidth === "wide"
          ? "1120px"
          : "960px",
    "--t-section-gap": `${settings.sectionSpacing}px`,
    "--t-grid-gap-x": `${settings.gridGapX}px`,
    "--t-grid-gap-y": `${settings.gridGapY}px`,
    "--t-page-margin": `${settings.pageMargin}px`,
    // Les composants historiques de la vitrine (panier, achat) lisent les
    // jetons `--color-*`. On les aligne sur la palette du thème publié.
    "--color-bg": palette.background,
    "--color-bg-soft": palette.background,
    "--color-surface": palette.background,
    "--color-surface-2": palette.border,
    "--color-surface-3": palette.border,
    "--color-fg": palette.text,
    "--color-body": palette.text,
    "--color-muted": palette.muted,
    "--color-subtle": palette.muted,
    "--color-faint": palette.muted,
    "--color-border": palette.border,
    "--color-border-soft": palette.border,
    "--color-border-strong": palette.border,
    "--color-hairline": palette.border,
    "--color-hairline-strong": palette.border,
    "--color-accent": palette.accent,
    "--color-accent-soft": palette.accent,
    "--color-accent-strong": palette.accent,
    "--color-brand-400": palette.buttonBg,
    "--color-brand-500": palette.buttonBg,
    "--color-brand-600": palette.buttonBg,
    "--color-on-accent": palette.buttonText,
    backgroundColor: palette.background,
    color: palette.text,
    fontFamily: fontFamily(settings.bodyFont),
    fontSize: `${settings.baseFontSize}px`,
    lineHeight: settings.lineHeight,
    letterSpacing: `${settings.letterSpacing}px`,
  } as CSSProperties;
}

export function cardStyle(settings: ThemeSettings): CSSProperties {
  const { productCard } = settings;
  return {
    borderRadius: `${productCard.radius}px`,
    border: productCard.border ? `1px solid var(--t-border)` : "none",
    boxShadow: productCard.shadow ? "0 12px 30px -18px rgb(0 0 0 / 0.35)" : "none",
    overflow: "hidden",
    background: "color-mix(in srgb, var(--t-text) 3%, transparent)",
  };
}

export type SectionVisual = {
  wrapper: CSSProperties;
  inner: CSSProperties;
  vars: Record<string, string>;
};

export function sectionVisual(
  section: ThemeSectionInstance,
  settings: ThemeSettings,
): SectionVisual {
  const { settings: local } = section;
  const palette = paletteById(settings, settingString(local, "paletteId"));
  const active = palette ?? activePalette(settings);

  const background = settingString(local, "backgroundColor") || palette?.background || "transparent";
  const gradient = settingBoolean(local, "gradient");
  const textColor = settingString(local, "textColor") || palette?.text || active.text;
  const buttonBg = settingString(local, "buttonBg") || palette?.buttonBg || active.buttonBg;
  const buttonText = settingString(local, "buttonText") || palette?.buttonText || active.buttonText;
  const borderColor =
    settingString(local, "sectionBorderColor") ||
    settingString(local, "borderColor") ||
    palette?.border ||
    active.border;
  const accent = palette?.accent || active.accent;

  const heightMode = settingString(local, "sectionHeight", "auto");
  const height =
    heightMode === "small"
      ? "240px"
      : heightMode === "medium"
        ? "420px"
        : heightMode === "large"
          ? "600px"
          : heightMode === "custom"
            ? `${settingNumber(local, "sectionHeightCustom", 520)}px`
            : undefined;

  const borderWidth = settingNumber(local, "borderWidth", 0);
  const borderStyle = settingString(local, "borderStyle", "none");
  const shadow = settingBoolean(local, "shadow");
  const shadowIntensity = settingNumber(local, "shadowIntensity", 16);
  const shadowColor = settingString(local, "shadowColor", "#000000");
  const textAlign = settingString(local, "textAlign", "left") as CSSProperties["textAlign"];
  const verticalAlign = settingString(local, "verticalAlign", "center");

  const wrapper: CSSProperties = {
    position: "relative",
    background: gradient
      ? `linear-gradient(${settingString(local, "gradientDirection", "135deg")}, ${
          settingString(local, "gradientFrom") || background
        }, ${settingString(local, "gradientTo") || "transparent"})`
      : background,
    color: textColor,
    marginTop: `${settingNumber(local, "marginTop", 0)}px`,
    marginBottom: `${settingNumber(local, "marginBottom", 0)}px`,
    paddingTop: `${settingNumber(local, "paddingTop", 64)}px`,
    paddingBottom: `${settingNumber(local, "paddingBottom", 64)}px`,
    paddingLeft: `${settingNumber(local, "paddingLeft", 0)}px`,
    paddingRight: `${settingNumber(local, "paddingRight", 0)}px`,
    minHeight: height,
    display: height ? "flex" : undefined,
    alignItems:
      verticalAlign === "top" ? "flex-start" : verticalAlign === "bottom" ? "flex-end" : "center",
    borderTop:
      borderStyle !== "none" && borderWidth > 0
        ? `${borderWidth}px ${borderStyle} ${borderColor}`
        : undefined,
    borderBottom:
      borderStyle !== "none" && borderWidth > 0
        ? `${borderWidth}px ${borderStyle} ${borderColor}`
        : undefined,
    borderRadius: settingNumber(local, "cornerRadius", 0)
      ? `${settingNumber(local, "cornerRadius", 0)}px`
      : undefined,
    boxShadow: shadow
      ? `0 ${shadowIntensity}px ${shadowIntensity * 2}px -${shadowIntensity}px ${shadowColor}55`
      : undefined,
    textAlign,
    overflow: "hidden",
  };

  const widthMode = settingString(local, "contentWidth", "container");
  const maxWidth =
    widthMode === "full"
      ? "100%"
      : widthMode === "narrow"
        ? "760px"
        : settings.pageWidth === "full"
          ? "100%"
          : `${settings.pageWidth}px`;

  const inner: CSSProperties = {
    width: "100%",
    maxWidth,
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: widthMode === "full" ? "clamp(1rem, 4cqw, 2.5rem)" : "clamp(1rem, 4cqw, 1.5rem)",
    paddingRight: widthMode === "full" ? "clamp(1rem, 4cqw, 2.5rem)" : "clamp(1rem, 4cqw, 1.5rem)",
    textAlign,
    display: "flex",
    flexDirection: "column",
    alignItems: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
    justifyContent:
      verticalAlign === "top" ? "flex-start" : verticalAlign === "bottom" ? "flex-end" : "center",
  };

  const vars: Record<string, string> = {
    "--s-bg": background,
    "--s-text": textColor,
    "--s-muted": palette?.muted ?? active.muted,
    "--s-accent": accent,
    "--s-btn-bg": buttonBg,
    "--s-btn-text": buttonText,
    "--s-border": borderColor,
    "--s-radius": `${settingNumber(local, "cornerRadius", 0)}px`,
    "--s-gap": `${settingNumber(local, "blockGap", 16)}px`,
    "--s-element-gap": `${settingNumber(local, "elementGap", 12)}px`,
    "--s-heading-font": fontFamily(settingString(local, "headingFont", settings.headingFont)),
    "--s-body-font": fontFamily(settingString(local, "bodyFont", settings.bodyFont)),
    "--s-heading-size": `${settingNumber(local, "headingSize", 40)}px`,
    "--s-heading-weight": settingString(local, "headingWeight", String(settings.headingWeight)),
    "--s-heading-line": `${settingNumber(local, "headingLineHeight", 110) / 100}`,
    "--s-heading-tracking": `${settingNumber(local, "headingLetterSpacing", 0)}px`,
    "--s-heading-case":
      settingString(local, "headingCase", "none") === "upper"
        ? "uppercase"
        : settingString(local, "headingCase", "none") === "lower"
          ? "lowercase"
          : "none",
    "--s-body-size": `${settingNumber(local, "bodySize", settings.baseFontSize)}px`,
    "--s-body-align": settingString(local, "bodyAlign", textAlign ?? "left"),
  };

  return { wrapper, inner, vars };
}

export function sectionHidden(
  section: ThemeSectionInstance,
  device: "desktop" | "tablet" | "mobile",
): boolean {
  if (!section.visible) return true;
  if (device === "desktop" && section.settings.showDesktop === false) return true;
  if (device === "tablet" && section.settings.showTablet === false) return true;
  if (device === "mobile" && section.settings.showMobile === false) return true;
  return false;
}

export function marketMatches(
  section: ThemeSectionInstance,
  market: string | undefined,
): boolean {
  const value = settingString(section.settings, "market", "all");
  if (!value || value === "all" || !market) return true;
  return value === market;
}
