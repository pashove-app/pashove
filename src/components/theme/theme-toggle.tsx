"use client";

import { useCallback } from "react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "pashove-theme";

type Theme = "dark" | "light";

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

/**
 * Bascule clair / sombre.
 * Les deux pictogrammes sont rendus et c'est le CSS qui affiche le bon
 * (`.theme-icon-*`), donc aucun état React et aucun risque d'hydratation.
 */
export function ThemeToggle({
  labels,
  className,
}: {
  labels: { toLight: string; toDark: string };
  className?: string;
}) {
  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Stockage indisponible : le choix ne survivra pas au rechargement.
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={labels.toLight}
      title={labels.toLight}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-full",
        "border border-border-soft bg-hairline text-muted transition-colors",
        "hover:border-border-strong hover:bg-hairline-strong hover:text-fg",
        className,
      )}
    >
      {/* Lune — affichée en thème sombre (action : passer en clair) */}
      <span className="theme-icon-dark">
        <span aria-hidden="true" className="sr-only">
          {labels.toLight}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4.5 w-4.5"
        >
          <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
        </svg>
      </span>

      {/* Soleil — affiché en thème clair (action : passer en sombre) */}
      <span className="theme-icon-light">
        <span aria-hidden="true" className="sr-only">
          {labels.toDark}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4.5 w-4.5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      </span>
    </button>
  );
}
