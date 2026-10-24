import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import { createClient } from "@/lib/supabase/server";

export type CollectionSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  image_media_id: string | null;
  image: { object_key: string } | null;
  product_count: number;
};

export type CollectionDetail = Omit<CollectionSummary, "product_count"> & {
  productIds: string[];
};

export type CollectionProductOption = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  product_type: "physical" | "digital" | "service";
  priceLabel: string;
  imageUrl: string | null;
};

type SummaryRow = Omit<CollectionSummary, "product_count"> & {
  collection_products?: { product_id: string }[] | null;
};

type DetailRow = Omit<CollectionDetail, "productIds"> & {
  collection_products?: { product_id: string; position: number }[] | null;
};

const SUMMARY_COLUMNS = [
  "id, name, slug, description, is_published, image_media_id",
  "image:media_assets!image_media_id(object_key)",
  "collection_products(product_id)",
].join(", ");

const DETAIL_COLUMNS = [
  "id, name, slug, description, is_published, image_media_id",
  "image:media_assets!image_media_id(object_key)",
  "collection_products(product_id, position)",
].join(", ");

/** Les collections d'une boutique, de la plus récente à la plus ancienne. */
export async function listCollections(
  storeId: string,
): Promise<CollectionSummary[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("collections")
    .select(SUMMARY_COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as SummaryRow[]).map((row) => ({
    ...row,
    product_count: row.collection_products?.length ?? 0,
  }));
}

/** Une collection et ses produits ordonnés, pour l'édition. */
export async function getCollection(
  id: string,
  storeId: string,
): Promise<CollectionDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("collections")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as DetailRow;
  const productIds = [...(row.collection_products ?? [])]
    .sort((left, right) => left.position - right.position)
    .map((entry) => entry.product_id);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    is_published: row.is_published,
    image_media_id: row.image_media_id,
    image: row.image,
    productIds,
  };
}

type ProductOptionRow = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  product_type: "physical" | "digital" | "service";
  price_amount: number;
  images?: { position: number; media: { object_key: string } | null }[] | null;
};

/** Tous les produits de la boutique, pour le sélecteur de collection. */
export async function listCollectionProducts(
  storeId: string,
  currency: string,
  localeTag: string,
): Promise<CollectionProductOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, status, product_type, price_amount, images:product_images(position, media:media_assets(object_key))",
    )
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  return ((data ?? []) as unknown as ProductOptionRow[]).map((row) => {
    const images = [...(row.images ?? [])].sort(
      (left, right) => left.position - right.position,
    );
    const key = images[0]?.media?.object_key ?? null;

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      product_type: row.product_type,
      priceLabel: formatMoney(row.price_amount, currency, localeTag),
      imageUrl: key ? publicUrl(key) : null,
    };
  });
}
