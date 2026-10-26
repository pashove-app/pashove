"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

function cssName(key: string): string {
  if (key.startsWith("--")) return key;
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

/**
 * Applique les jetons du thème à la racine pendant la visite de la vitrine.
 *
 * Les tiroirs (panier, menu mobile) sont rendus dans un portail sur `body` :
 * ils n'héritent pas des variables posées sur la coquille. On les pose donc
 * temporairement sur `html`, puis on restaure exactement l'état précédent.
 */
export function ThemeScope({ style }: { style: ThemeStyle }) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = new Map<string, string>();

    for (const [key, value] of Object.entries(style)) {
      if (typeof value !== "string") continue;
      const name = cssName(key);
      previous.set(name, root.style.getPropertyValue(name));
      root.style.setProperty(name, value);
    }

    return () => {
      for (const [name, value] of previous) {
        if (value) root.style.setProperty(name, value);
        else root.style.removeProperty(name);
      }
    };
  }, [style]);

  return null;
}
