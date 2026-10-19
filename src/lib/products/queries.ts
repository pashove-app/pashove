import { createClient } from "@/lib/supabase/server";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_amount: number;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** Image principale (position 0), s'il y en a une. */
  image: { object_key: string } | null;
};

const COLUMNS = [
  "id, name, slug, description, price_amount, status, published_at, created_at, updated_at",
  "images:product_images(position, media:media_assets(object_key))",
].join(", ");

type Row = Omit<Product, "image"> & {
  images?: { position: number; media: { object_key: string } | null }[] | null;
};

/**
 * Les produits de la boutique, du plus récent au plus ancien.
 *
 * Aucun filtre par boutique : RLS ne laisse voir que ceux du marchand
 * connecté — et, pour un visiteur, seulement les produits publiés.
 */
export async function listProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const images = [...(row.images ?? [])].sort(
      (left, right) => left.position - right.position,
    );

    return {
      ...row,
      image: images[0]?.media ?? null,
    };
  });
}

/** Nombre de produits de la boutique. */
export async function countProducts(): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  return count ?? 0;
}
