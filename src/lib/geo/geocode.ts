/**
 * Géocodage des adresses de livraison via Nominatim (OpenStreetMap).
 *
 * Une seule requête par course, au démarrage. Le résultat est mis en cache en
 * mémoire pour éviter de répéter une même adresse sur l'instance. On respecte
 * la politique d'usage : User-Agent identifiable, pas de rafale, délai court.
 *
 * On interroge d'abord rue + ville. Les compléments d'adresse (« Immeuble B »,
 * « 2e étage ») sont souvent absents d'OSM et font échouer une requête qui,
 * sans eux, trouve parfaitement le quartier. On ne les ajoute qu'en second
 * essai, dans un délai qui respecte la limite d'une requête par seconde.
 */

export type GeoPoint = { latitude: number; longitude: number };

type GeocodeInput = {
  address?: string | null;
  extra?: string | null;
  city?: string | null;
  country?: string | null;
};

type QueryResult = { point: GeoPoint | null; cacheable: boolean };

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { point: GeoPoint | null; at: number }>();

function remember(query: string, point: GeoPoint | null): void {
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(query, { point, at: Date.now() });
}

function clean(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "—" ? "" : trimmed;
}

async function nominatim(
  address: string,
  country: string,
): Promise<QueryResult> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("accept-language", "fr");
  if (/^[A-Z]{2}$/.test(country)) {
    url.searchParams.set("countrycodes", country.toLowerCase());
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": `Pashove/1.0 (${process.env.EMAIL_REPLY_TO ?? "support@pashove.com"})`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.warn("[geo] geocode failed", { status: response.status });
      // Panne temporaire : on ne mémorise pas un échec réseau pour 24 h.
      return { point: null, cacheable: false };
    }

    const payload = (await response.json()) as {
      lat?: string;
      lon?: string;
    }[];

    const first = Array.isArray(payload) ? payload[0] : null;
    const latitude = Number(first?.lat);
    const longitude = Number(first?.lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return { point: null, cacheable: true };
    }

    return { point: { latitude, longitude }, cacheable: true };
  } catch {
    // Panne ou timeout : la course démarre quand même, sans point de
    // destination. Le lien « Naviguer » reste disponible sur l'adresse texte.
    return { point: null, cacheable: false };
  }
}

export async function geocodeAddress(
  input: GeocodeInput,
): Promise<GeoPoint | null> {
  const country = clean(input.country).toUpperCase();
  const base = [clean(input.address), clean(input.city)]
    .filter(Boolean)
    .join(", ");
  const withExtra = [clean(input.address), clean(input.extra), clean(input.city)]
    .filter(Boolean)
    .join(", ");

  if (!base) return null;

  const queries = withExtra && withExtra !== base ? [base, withExtra] : [base];

  for (let index = 0; index < queries.length; index += 1) {
    const address = queries[index];
    const query = `${address}|${country}`;
    const cached = cache.get(query);

    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      if (cached.point) return cached.point;
      continue;
    }

    // Deuxième essai : un peu plus d'une seconde après le premier, pour ne pas
    // dépasser la limite Nominatim d'une requête par seconde.
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    const result = await nominatim(address, country);

    if (result.cacheable) remember(query, result.point);
    if (result.point) return result.point;
  }

  return null;
}
