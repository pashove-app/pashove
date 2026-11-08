"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";

const LOCALE_COOKIE = "pashove_locale";

function setLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Ramène une URL interne `/{locale}/store/{slug}/…` à l'URL propre du domaine.
 * Renvoie `null` quand le chemin n'appartient pas à cette boutique.
 */
function cleanStorePath(
  pathname: string,
  slug: string,
): { path: string; locale: Locale } | null {
  const segments = pathname.split("/");
  const candidate = segments[1] ?? "";

  if (!isLocale(candidate)) return null;
  if (segments[2] !== "store" || segments[3] !== slug) return null;

  const rest = segments.slice(4).join("/");
  return { path: rest ? `/${rest}` : "/", locale: candidate };
}

/**
 * Adapte les liens de la vitrine quand elle est servie sur un domaine marqué.
 *
 * Les composants continuent d'utiliser `path(locale, "/store/slug/…")` : on
 * intercepte le clic avant le routeur Next pour pousser directement l'URL
 * propre. Un second filet normalise l'URL après une navigation programmée.
 * Rien n'est modifié sur `pashove.com`.
 */
export function BrandedLinks({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Filet : une navigation programmée (action serveur, router.push) peut
  // encore produire une URL interne.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const clean = cleanStorePath(window.location.pathname, slug);
    if (!clean) return;

    if (clean.locale !== locale) setLocaleCookie(clean.locale);
    router.replace(`${clean.path}${window.location.search}${window.location.hash}`);
  }, [pathname, locale, router, slug]);

  // Interception des liens : évite un aller-retour serveur et garde l'URL
  // propre dès le premier clic.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("/")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const clean = cleanStorePath(url.pathname, slug);
      if (!clean) return;

      event.preventDefault();

      if (clean.locale !== locale) setLocaleCookie(clean.locale);
      router.push(`${clean.path}${url.search}${url.hash}`);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [locale, router, slug]);

  return null;
}
