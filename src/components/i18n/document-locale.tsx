"use client";

import { useEffect } from "react";
import type { Direction } from "@/i18n/config";

/**
 * Le layout racine n'est pas re-rendu lors d'une navigation cliente :
 * `lang` et `dir` resteraient donc figés sur la langue d'arrivée.
 * Ce composant les resynchronise après chaque changement de langue.
 */
function applyDocumentLocale(locale: string, dir: Direction) {
  const root = document.documentElement;
  if (root.lang !== locale) root.lang = locale;
  if (root.dir !== dir) root.dir = dir;
}

export function DocumentLocale({
  locale,
  dir,
}: {
  locale: string;
  dir: Direction;
}) {
  useEffect(() => {
    applyDocumentLocale(locale, dir);
  }, [locale, dir]);

  return null;
}
