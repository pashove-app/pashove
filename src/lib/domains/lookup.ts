import { platformDomain } from "@/lib/domains/hosts";

/**
 * Résolution d'un domaine personnalisé → slug de boutique.
 *
 * Appelé par le proxy à chaque requête sur un domaine marqué. Le résultat est
 * mis en cache quelques secondes par isolate pour ne pas interroger Supabase à
 * chaque clic. Une réponse négative est cachée plus brièvement : un domaine qui
 * vient d'être vérifié doit devenir joignable rapidement.
 *
 * On passe par l'API REST Supabase avec la clé anon : la fonction
 * `resolve_store_domain` est `security definer` et ne renvoie qu'un slug de
 * boutique active dont le domaine est vérifié.
 */

const POSITIVE_TTL_MS = 60_000;
const NEGATIVE_TTL_MS = 20_000;
const MAX_ENTRIES = 1_000;

type CacheEntry = { slug: string | null; at: number };

const cache = new Map<string, CacheEntry>();

function remember(domain: string, slug: string | null): void {
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(domain, { slug, at: Date.now() });
}

export async function resolveCustomDomain(
  domain: string,
): Promise<string | null> {
  const host = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!host || !host.includes(".")) return null;

  // Ne jamais résoudre le domaine de la plateforme comme un domaine marchand.
  const platform = platformDomain();
  if (host === platform || host.endsWith(`.${platform}`)) return null;

  const cached = cache.get(host);
  if (cached) {
    const ttl = cached.slug ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
    if (Date.now() - cached.at < ttl) return cached.slug;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const response = await fetch(`${url}/rest/v1/rpc/resolve_store_domain`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_domain: host }),
      cache: "no-store",
      signal: AbortSignal.timeout(800),
    });

    if (!response.ok) return null;

    const value = (await response.json()) as unknown;
    const slug =
      typeof value === "string" && /^[a-z0-9-]{3,30}$/.test(value)
        ? value
        : null;

    remember(host, slug);
    return slug;
  } catch {
    // Panne réseau passagère : pas de cache négatif, la prochaine requête
    // retentera. Le proxy répondra 404 entre-temps, jamais la vitrine d'une
    // autre boutique.
    return null;
  }
}

/** Utilisé par les tests et après une suppression de domaine. */
export function forgetCustomDomain(domain: string): void {
  cache.delete(domain.trim().toLowerCase().replace(/\.$/, ""));
}
