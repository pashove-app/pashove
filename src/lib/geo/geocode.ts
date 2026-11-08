/**
 * Géocodage des adresses de livraison via Nominatim (OpenStreetMap).
 *
 * Une seule requête par course, au démarrage. Le résultat est mis en cache en
 * mémoire pour éviter de répéter une même adresse sur l'instance. On respecte
 * la politique d'usage : User-Agent identifiable, pas de rafale, délai court.
 */

export type GeoPoint = { latitude: number; longitude: number };

type GeocodeInput = {
  address?: string | null;
  extra?: string | null;
  city?: string | null;
  country?: string | null;
};

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

export async function geocodeAddress(
  input: GeocodeInput,
): Promise<GeoPoint | null> {
  const address = [clean(input.address), clean(input.extra), clean(input.city)]
    .filter(Boolean)
    .join(", ");
  const country = clean(input.country).toUpperCase();

  if (!address) return null;

  const query = `${address}|${country}`;
  const cached = cache.get(query);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.point;

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
      return null;
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
      remember(query, null);
      return null;
    }

    const point = { latitude, longitude };
    remember(query, point);
    return point;
  } catch {
    // Panne ou timeout : la course démarre quand même, sans point de
    // destination. Le lien « Naviguer » reste disponible sur l'adresse texte.
    return null;
  }
}
