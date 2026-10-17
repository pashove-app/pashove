import { cache } from "react";
import { createPublicClient, isPublicSupabaseConfigured } from "@/lib/supabase/public";

/** Ce que la vitrine a le droit de montrer d'une boutique. */
export type PublicStore = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country: string;
  currency: string;
  category: string | null;
};

export type StorefrontStatus = "active" | "suspended" | "missing";

const COLUMNS =
  "id, name, slug, description, logo_url, banner_url, contact_email, contact_phone, country, currency, category";

/** Normalise un segment d'URL avant de le comparer : les slugs sont minuscules. */
function normalize(slug: string): string {
  return slug.trim().toLowerCase();
}

async function readStatus(slug: string): Promise<StorefrontStatus> {
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("storefront_status", {
    p_slug: normalize(slug),
  });

  if (error) return "missing";
  return (data as StorefrontStatus | null) ?? "missing";
}

async function readStore(slug: string): Promise<PublicStore | null> {
  const supabase = createPublicClient();

  // Aucun filtre sur `status` ici : la politique RLS ne rend que les boutiques
  // ouvertes, et c'est la base qui décide, pas la requête.
  const { data } = await supabase
    .from("stores")
    .select(COLUMNS)
    .eq("slug", normalize(slug))
    .maybeSingle();

  return (data as PublicStore | null) ?? null;
}

/**
 * Charge l'état public d'une vitrine.
 *
 * `cache` déduplique l'appel entre `generateMetadata` et la page, qui sont
 * rendus dans la même passe.
 */
export const loadStorefront = cache(
  async (
    slug: string,
  ): Promise<{ status: StorefrontStatus; store: PublicStore | null }> => {
    if (!isPublicSupabaseConfigured()) {
      return { status: "missing", store: null };
    }

    const status = await readStatus(slug);
    if (status !== "active") return { status, store: null };

    const store = await readStore(slug);
    return store ? { status, store } : { status: "missing", store: null };
  },
);
