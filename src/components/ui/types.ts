import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Props communes à toutes les sections de la vitrine. */
export type SectionProps = {
  /** Dictionnaire de la langue active. */
  t: Dictionary;
  locale: Locale;
};

/** Construit un lien interne préfixé par la langue. */
export function path(locale: Locale, href: string): string {
  if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
    return href;
  }
  const clean = href.startsWith("/") ? href : `/${href}`;
  return `/${locale}${clean === "/" ? "" : clean}`;
}
