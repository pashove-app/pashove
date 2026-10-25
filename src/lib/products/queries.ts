import type { ProductOption, ProductType } from "@/lib/products/schema";
import { createClient } from "@/lib/supabase/server";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_amount: number;
  compare_at_amount: number | null;
  status: "draft" | "published";
  product_type: ProductType;
  stock_quantity: number | null;
  weight_grams: number | null;
  duration_minutes: number | null;
  service_location: "online" | "in_person" | null;
  tags: string[];
  video_url: string | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  shipping_countries: string[];
  description_media_id: string | null;
  description_image: { object_key: string } | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** Options déclarées : Taille, Couleur… (3 maximum). */
  options: ProductOption[];
  /** Variantes ordonnées, générées à partir des options. */
  variants: {
    id: string;
    option_values: Record<string, string>;
    sku: string | null;
    barcode: string | null;
    price_amount: number;
    stock_quantity: number;
    position: number;
  }[];
  /** Images ordonnées ; la première est l'image principale. */
  images: { id: string; object_key: string }[];
  /** Raccourci pour la liste. */
  image: { id: string; object_key: string } | null;
  /** Fichier vendu, dans le bucket privé. */
  digital_file: { id: string; name: string | null } | null;
  /** Copie partenaire : offre source, produit source et boutique source. */
  partner_offer_id: string | null;
  source_product_id: string | null;
  partner_source_store_id: string | null;
  partner_commission_bps: number | null;
};

const COLUMNS = [
  "id, name, slug, description, price_amount, compare_at_amount, status",
  "product_type, stock_quantity, weight_grams, duration_minutes, service_location",
  "tags, video_url, length_mm, width_mm, height_mm, shipping_countries",
  "description_media_id",
  "description_image:media_assets!description_media_id(object_key)",
  "published_at, created_at, updated_at, options",
  "variants:product_variants(id, option_values, sku, barcode, price_amount, stock_quantity, position)",
  "images:product_images(position, media:media_assets(id, object_key))",
  "digital_file:media_assets!digital_file_id(id, file_name)",
  "partner_offer_id, source_product_id, partner_source_store_id, partner_commission_bps",
].join(", ");

/**
 * Colonnes de la liste : tout sauf les variantes, potentiellement nombreuses
 * et inutiles au tableau. L'édition charge le jeu complet.
 */
const LIST_COLUMNS = [
  "id, name, slug, description, price_amount, compare_at_amount, status",
  "product_type, stock_quantity, weight_grams, duration_minutes, service_location",
  "tags, video_url, length_mm, width_mm, height_mm, shipping_countries",
  "description_media_id",
  "description_image:media_assets!description_media_id(object_key)",
  "published_at, created_at, updated_at, options",
  "images:product_images(position, media:media_assets(id, object_key))",
  "digital_file:media_assets!digital_file_id(id, file_name)",
  "partner_offer_id, source_product_id, partner_source_store_id, partner_commission_bps",
].join(", ");

type Row = Omit<Product, "image" | "images" | "digital_file" | "variants"> & {
  options?: ProductOption[] | null;
  variants?: Product["variants"] | null;
  images?: { position: number; media: { id: string; object_key: string } | null }[] | null;
  digital_file?: { id: string; file_name: string | null } | null;
};

function toProduct(row: Row): Product {
  const images = [...(row.images ?? [])].sort(
    (left, right) => left.position - right.position,
  );

  const media = images
    .map((entry) => entry.media)
    .filter((entry): entry is { id: string; object_key: string } => Boolean(entry));

  return {
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
    variants: [...(row.variants ?? [])].sort(
      (left, right) => left.position - right.position,
    ),
    images: media,
    image: media[0] ?? null,
    digital_file: row.digital_file
      ? { id: row.digital_file.id, name: row.digital_file.file_name }
      : null,
  };
}

export type ProductStatusFilter = "all" | "published" | "draft" | "out_of_stock";

export type ProductFilters = {
  q?: string;
  status?: ProductStatusFilter;
  tag?: string;
};

/**
 * Les produits d'une boutique, du plus récent au plus ancien.
 *
 * Le filtre `store_id` est indispensable : la politique publique laisse aussi
 * voir les produits publiés des autres boutiques à un utilisateur connecté.
 */
export async function listProducts(
  storeId: string,
  filters: ProductFilters = {},
): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(LIST_COLUMNS)
    .eq("store_id", storeId);

  const search = filters.q?.trim().slice(0, 80);
  if (search) {
    // Les jokers LIKE saisis par le marchand restent des caractères.
    const escaped = search.replace(/[\\%_]/g, (match) => `\\${match}`);
    query = query.ilike("name", `%${escaped}%`);
  }

  if (filters.status === "published") query = query.eq("status", "published");
  if (filters.status === "draft") query = query.eq("status", "draft");
  if (filters.status === "out_of_stock") {
    query = query.eq("product_type", "physical").lte("stock_quantity", 0);
  }

  if (filters.tag) query = query.contains("tags", [filters.tag]);

  const { data } = await query.order("created_at", { ascending: false });

  return ((data ?? []) as unknown as Row[]).map(toProduct);
}

export type ProductCounts = {
  all: number;
  published: number;
  draft: number;
  outOfStock: number;
};

/** Compteurs des onglets de la liste. */
export async function productCounts(storeId: string): Promise<ProductCounts> {
  const supabase = await createClient();

  const [all, published, draft, outOfStock] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("status", "published"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("status", "draft"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("product_type", "physical")
      .lte("stock_quantity", 0),
  ]);

  return {
    all: all.count ?? 0,
    published: published.count ?? 0,
    draft: draft.count ?? 0,
    outOfStock: outOfStock.count ?? 0,
  };
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
