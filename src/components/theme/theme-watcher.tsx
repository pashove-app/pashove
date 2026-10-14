"use client";

import { useEffect } from "react";

const STORAGE_KEY = "pashove-theme";

/**
 * Suit la préférence système tant que l'utilisateur n'a pas choisi
 * explicitement un thème. N'écrit aucun état React : le thème vit
 * sur l'attribut `data-theme` de <html>.
 */
export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");

    const apply = () => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) return;
      } catch {
        // Navigation privée : on applique la préférence système sans persister.
      }
      document.documentElement.setAttribute(
        "data-theme",
        media.matches ? "light" : "dark",
      );
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return null;
}
