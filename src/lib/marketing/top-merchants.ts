import { publicUrl } from "@/lib/r2/media";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Mur de la réussite : les boutiques qui ont le plus vendu ce mois-ci.
 *
 * Le calcul vit en base (`get_top_merchants_of_month`), pour rester une seule
 * source de vérité et ne jamais exposer les montants. La page publique
 * n'obtient que des informations déjà visibles sur une vitrine : nom, slug,
 * logo.
 */
export type TopMerchant = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export function initialsFor(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "?";
}

export async function getTopMerchantsOfMonth(
  limit = 8,
): Promise<TopMerchant[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("get_top_merchants_of_month", {
      p_limit: limit,
    });

    if (error) {
      // La migration peut ne pas encore être appliquée : la section affiche
      // alors ses emplacements libres, sans casser la page d'accueil.
      console.error("[marketing] top merchants", error.message);
      return [];
    }

    const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
    const rows = (data ?? []) as {
      store_id: string;
      name: string;
      slug: string;
      logo_key: string | null;
    }[];

    return rows.map((row) => ({
      id: row.store_id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logo_key && base ? publicUrl(row.logo_key) : null,
    }));
  } catch (error) {
    console.error("[marketing] top merchants", error);
    return [];
  }
}
