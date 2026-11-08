/**
 * Hôtes de la plateforme et domaines des boutiques.
 *
 * Règles :
 *   - `pashove.com`, `www.pashove.com`, `app.pashove.com`… → plateforme ;
 *   - `<slug>.pashove.com` → vitrine de la boutique `<slug>` ;
 *   - tout autre hôte → domaine personnalisé, résolu en base ;
 *   - `localhost`, IP et `*.vercel.app` restent la plateforme (développement
 *     et préversions).
 *
 * Ce module est volontairement pur : il est utilisé par le proxy, le serveur
 * et les composants.
 */

export const DEFAULT_PLATFORM_DOMAIN = "pashove.com";

/** Sous-domaines réservés à la plateforme, jamais attribuables à une boutique. */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "platform-admin",
  "docs",
  "help",
  "status",
  "cdn",
  "assets",
  "static",
  "media",
  "mail",
  "email",
  "smtp",
  "support",
  "billing",
  "pay",
  "payments",
  "auth",
  "login",
  "signup",
  "register",
  "checkout",
  "delivery",
  "livreur",
  "partner",
  "partners",
  "affiliate",
  "blog",
  "shop",
  "store",
  "stores",
  "dashboard",
  "account",
  "accounts",
  "legal",
  "terms",
  "privacy",
  "security",
  "trust",
  "dev",
  "staging",
  "preview",
  "test",
  "demo",
  "pashove",
]);

export function platformDomain(): string {
  const configured = (process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, "");

  return configured || DEFAULT_PLATFORM_DOMAIN;
}

/** Retire le port, un éventuel point final et les espaces d'un en-tête Host. */
export function normalizeHost(value: string | null | undefined): string {
  const first = (value ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.replace(/:\d+$/, "").replace(/\.$/, "");
}

export type HostKind =
  | { kind: "platform" }
  | { kind: "subdomain"; slug: string }
  | { kind: "custom"; domain: string };

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const IPV4_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/;

export function classifyHost(value: string | null | undefined): HostKind {
  const host = normalizeHost(value);
  const domain = platformDomain();

  if (!host) return { kind: "platform" };

  if (host === domain || host === `www.${domain}`) {
    return { kind: "platform" };
  }

  if (host.endsWith(`.${domain}`)) {
    const label = host.slice(0, -(domain.length + 1));

    // `foo.bar.pashove.com` n'est pas un sous-domaine de boutique.
    if (!label.includes(".") && SLUG_PATTERN.test(label)) {
      if (!RESERVED_SUBDOMAINS.has(label)) {
        return { kind: "subdomain", slug: label };
      }
    }

    return { kind: "platform" };
  }

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    IPV4_PATTERN.test(host) ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".vercel.com") ||
    !host.includes(".")
  ) {
    return { kind: "platform" };
  }

  return { kind: "custom", domain: host };
}

export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase());
}

/** Adresse Pashove incluse pour une boutique. */
export function pashoveStoreHost(slug: string): string {
  return `${slug}.${platformDomain()}`;
}

/**
 * Normalise un domaine saisi par un marchand.
 *
 * Accepte `maboutique.com`, `www.maboutique.com`, ou une URL complète.
 * Refuse la plateforme elle-même, les hôtes Vercel, les IP et les domaines
 * sans TLD. L'IDN est converti en punycode par `URL`.
 */
export function normalizeCustomDomain(value: string): string | null {
  const raw = value.trim().toLowerCase();
  if (!raw) return null;

  let host: string;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(raw)
      ? raw
      : `http://${raw}`;
    host = new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }

  host = host.replace(/\.$/, "");

  if (!host || host.length > 253 || !host.includes(".")) return null;
  if (host === "localhost" || IPV4_PATTERN.test(host)) return null;
  if (host.endsWith(".vercel.app") || host.endsWith(".vercel.com")) return null;

  const domain = platformDomain();
  if (host === domain || host.endsWith(`.${domain}`)) return null;

  const labels = host.split(".");
  if (labels.length < 2) return null;
  if (!labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    return null;
  }

  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,63}$/.test(tld)) return null;

  return host;
}
