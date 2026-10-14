import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/fr";

export type { Dictionary };

/**
 * Chargement paresseux : une langue n'est téléchargée que si elle est
 * réellement affichée, ce qui garde le bundle initial léger.
 */
const LOADERS: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  fr: () => import("./dictionaries/fr"),
  en: () => import("./dictionaries/en"),
  bm: () => import("./dictionaries/bm"),
  ln: () => import("./dictionaries/ln"),
  ar: () => import("./dictionaries/ar"),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const loaded = await LOADERS[locale]();
  return loaded.default;
}

/** Remplace les jetons `{nom}` d'une chaîne traduite. */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
