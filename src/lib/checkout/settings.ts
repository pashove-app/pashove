import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

export type CheckoutPreset = "compact" | "detailed";

export type CheckoutBlockKey =
  | "contact"
  | "delivery"
  | "gift"
  | "summary"
  | "payment";

export const CHECKOUT_BLOCKS: CheckoutBlockKey[] = [
  "contact",
  "delivery",
  "gift",
  "summary",
  "payment",
];

export const CHECKOUT_PRESETS: CheckoutPreset[] = ["compact", "detailed"];

export type CheckoutTexts = Record<
  string,
  { title?: string; subtitle?: string; payLabel?: string }
>;

export type CheckoutSettings = {
  preset: CheckoutPreset;
  blocks: CheckoutBlockKey[];
  texts: CheckoutTexts;
  showGift: boolean;
  showDiscount: boolean;
};

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  preset: "compact",
  blocks: [...CHECKOUT_BLOCKS],
  texts: {},
  showGift: true,
  showDiscount: true,
};

const MAX_TITLE = 120;
const MAX_SUBTITLE = 240;
const MAX_PAY_LABEL = 40;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeTexts(value: unknown): CheckoutTexts {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const texts: CheckoutTexts = {};

  for (const [locale, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!isLocale(locale) || !entry || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    texts[locale] = {
      title: clean(raw.title, MAX_TITLE),
      subtitle: clean(raw.subtitle, MAX_SUBTITLE),
      payLabel: clean(raw.payLabel, MAX_PAY_LABEL),
    };
  }

  return texts;
}

export function normalizeCheckoutSettings(value: unknown): CheckoutSettings {
  if (!value || typeof value !== "object") return DEFAULT_CHECKOUT_SETTINGS;

  const raw = value as Record<string, unknown>;
  const preset: CheckoutPreset =
    raw.preset === "detailed" ? "detailed" : "compact";

  const blocks: CheckoutBlockKey[] = [];
  if (Array.isArray(raw.blocks)) {
    for (const entry of raw.blocks) {
      if (
        typeof entry === "string" &&
        CHECKOUT_BLOCKS.includes(entry as CheckoutBlockKey) &&
        !blocks.includes(entry as CheckoutBlockKey)
      ) {
        blocks.push(entry as CheckoutBlockKey);
      }
    }
  }

  for (const key of CHECKOUT_BLOCKS) {
    if (!blocks.includes(key)) blocks.push(key);
  }

  return {
    preset,
    blocks,
    texts: normalizeTexts(raw.texts),
    showGift: raw.showGift !== false,
    showDiscount: raw.showDiscount !== false,
  };
}

/** Textes effectifs du checkout : surcharge marchand, puis libellés par défaut. */
export function checkoutTexts(
  settings: CheckoutSettings,
  locale: Locale,
  fallbacks: { title: string; subtitle: string; payLabel: string },
): { title: string; subtitle: string; payLabel: string } {
  const entry =
    settings.texts[locale] ?? settings.texts[DEFAULT_LOCALE] ?? {};

  return {
    title: entry.title?.trim() || fallbacks.title,
    subtitle: entry.subtitle?.trim() || fallbacks.subtitle,
    payLabel: entry.payLabel?.trim() || fallbacks.payLabel,
  };
}
