import { createPublicClient } from "@/lib/supabase/public";
import { listStoreProductsByIds, type StoreProduct } from "@/lib/storefront/products";

export type PublicCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_key: string | null;
  product_count: number;
};

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: { object_key: string } | null;
  collection_products: { product: { id: string } | null }[] | null;
};

const COLUMNS = [
  "id, name, slug, description",
  "image:media_assets!image_media_id(object_key)",
  "collection_products(product:products(id))",
].join(", ");

function toCollection(row: CollectionRow): PublicCollection {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image_key: row.image?.object_key ?? null,
    product_count: (row.collection_products ?? []).filter(
      (item) => item.product !== null,
    ).length,
  };
}

export async function listPublicCollections(
  storeId: string,
): Promise<PublicCollection[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("collections")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("is_published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as CollectionRow[]).map(toCollection);
}

export type PublicCollectionDetail = {
  collection: PublicCollection;
  products: StoreProduct[];
  /** Tous les identifiants, y compris ceux des produits masqués. */
  productIds: string[];
};

export async function getPublicCollection(
  storeId: string,
  slug: string,
): Promise<PublicCollectionDetail | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("collections")
    .select(
      "id, name, slug, description, image:media_assets!image_media_id(object_key), collection_products(position, product_id)",
    )
    .eq("store_id", storeId)
    .eq("slug", slug.trim().toLowerCase())
    .eq("is_published", true)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: { object_key: string } | null;
    collection_products: { position: number; product_id: string }[] | null;
  };

  const orderedIds = [...(row.collection_products ?? [])]
    .sort((left, right) => left.position - right.position)
    .map((item) => item.product_id);

  const products = await listStoreProductsByIds(storeId, orderedIds);
  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((product): product is StoreProduct => Boolean(product));

  return {
    collection: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image_key: row.image?.object_key ?? null,
      product_count: ordered.length,
    },
    products: ordered,
    productIds: orderedIds,
  };
}
