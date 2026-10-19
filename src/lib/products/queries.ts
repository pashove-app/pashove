import type { ProductType } from "@/lib/products/schema";
import { createClient } from "@/lib/supabase/server";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_amount: number;
  status: "draft" | "published";
  product_type: ProductType;
  stock_quantity: number | null;
  weight_grams: number | null;
  duration_minutes: number | null;
  service_location: "online" | "in_person" | null;
  tags: string[];
  video_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** Image principale (position 0), s'il y en a une. */
  image: { id: string; object_key: string } | null;
  /** Fichier vendu, dans le bucket privé. */
  digital_file: { id: string; name: string | null } | null;
};

const COLUMNS = [
  "id, name, slug, description, price_amount, status, product_type",
  "stock_quantity, weight_grams, duration_minutes, service_location",
  "tags, video_url, published_at, created_at, updated_at",
  "images:product_images(position, media:media_assets(id, object_key))",
  "digital_file:media_assets!digital_file_id(id, file_name)",
].join(", ");

type Row = Omit<Product, "image" | "digital_file"> & {
  images?: { position: number; media: { id: string; object_key: string } | null }[] | null;
  digital_file?: { id: string; file_name: string | null } | null;
};

function toProduct(row: Row): Product {
  const images = [...(row.images ?? [])].sort(
    (left, right) => left.position - right.position,
  );

  return {
    ...row,
    image: images[0]?.media ?? null,
    digital_file: row.digital_file
      ? { id: row.digital_file.id, name: row.digital_file.file_name }
      : null,
  };
}

/**
 * Les produits d'une boutique, du plus récent au plus ancien.
 *
 * Le filtre `store_id` est indispensable : la politique publique laisse aussi
 * voir les produits publiés des autres boutiques à un utilisateur connecté.
 */
export async function listProducts(storeId: string): Promise<Product[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as Row[]).map(toProduct);
}

/** Un produit précis, à condition qu'il appartienne à la boutique. */
export async function getProduct(
  id: string,
  storeId: string,
): Promise<Product | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  return data ? toProduct(data as unknown as Row) : null;
}

/** Nombre de produits de la boutique. */
export async function countProducts(storeId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);

  return count ?? 0;
}

/** Étiquettes déjà utilisées dans la boutique, pour le filtre de la liste. */
export async function listStoreTags(storeId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("tags")
    .eq("store_id", storeId);

  const tags = new Set<string>();
  for (const row of (data ?? []) as { tags: string[] | null }[]) {
    for (const tag of row.tags ?? []) tags.add(tag);
  }

  return Array.from(tags).sort((left, right) => left.localeCompare(right));
}
