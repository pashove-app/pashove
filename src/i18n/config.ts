/**
 * Registre des langues de la vitrine.
 * Ajouter une langue = 1 entrée ici + 1 dictionnaire dans `./dictionaries`.
 */

export const LOCALES = ["fr", "en", "bm", "ln", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export type Direction = "ltr" | "rtl";

export type LocaleMeta = {
  /** Nom dans la langue elle-même — utilisé par le sélecteur. */
  native: string;
  /** Nom en français — utilisé pour l'accessibilité. */
  french: string;
  /** Code court affiché dans le sélecteur. */
  short: string;
  dir: Direction;
  /** Balise BCP 47 complète, pour <html lang> et les métadonnées. */
  tag: string;
};

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  fr: { native: "Français", french: "Français", short: "FR", dir: "ltr", tag: "fr-FR" },
  en: { native: "English", french: "Anglais", short: "EN", dir: "ltr", tag: "en" },
  bm: { native: "Bamanankan", french: "Bambara", short: "BM", dir: "ltr", tag: "bm" },
  ln: { native: "Lingála", french: "Lingala", short: "LN", dir: "ltr", tag: "ln" },
  ar: { native: "العربية", french: "Arabe", short: "AR", dir: "rtl", tag: "ar" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function directionOf(locale: Locale): Direction {
  return LOCALE_META[locale].dir;
}

/** Préfixe une route interne avec la langue active. */
export function localePath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}
