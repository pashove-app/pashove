import { cache } from "react";
import type { ProductOption } from "@/lib/products/schema";
import { createPublicClient } from "@/lib/supabase/public";

export type StoreVariant = {
  id: string;
  option_values: Record<string, string>;
  sku: string | null;
  price_amount: number;
  stock_quantity: number;
  position: number;
};

export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_amount: number;
  compare_at_amount: number | null;
  product_type: "physical" | "digital" | "service";
  stock_quantity: number | null;
  tags: string[];
  options: ProductOption[];
  images: { object_key: string }[];
  variants: StoreVariant[];
};

const COLUMNS = [
  "id, name, slug, description, price_amount, compare_at_amount",
  "product_type, stock_quantity, tags, options",
  "images:product_images(position, media:media_assets(object_key))",
  "variants:product_variants(id, option_values, sku, price_amount, stock_quantity, position)",
].join(", ");

type Row = Omit<StoreProduct, "images" | "variants"> & {
  images?: { position: number; media: { object_key: string } | null }[] | null;
  variants?: StoreVariant[] | null;
};

function toProduct(row: Row): StoreProduct {
  const images = [...(row.images ?? [])].sort(
    (left, right) => left.position - right.position,
  );

  return {
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
    images: images
      .map((entry) => entry.media)
      .filter((entry): entry is { object_key: string } => Boolean(entry)),
    variants: [...(row.variants ?? [])].sort(
      (left, right) => left.position - right.position,
    ),
  };
}

/** Les produits publiés d'une boutique ouverte. */
export async function listStoreProducts(storeId: string): Promise<StoreProduct[]> {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as Row[]).map(toProduct);
}

/** Un produit publié, identifié par son adresse dans la boutique. */
export const getStoreProduct = cache(async (
  storeId: string,
  slug: string,
): Promise<StoreProduct | null> => {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("slug", slug.trim().toLowerCase())
    .eq("status", "published")
    .maybeSingle();

  return data ? toProduct(data as unknown as Row) : null;
});

/** Produit prêt à afficher : les prix sont formatés par le serveur. */
export type PricedStoreProduct = Omit<StoreProduct, "variants"> & {
  priceLabel: string;
  compareAtLabel: string | null;
  shippingLabel: string;
  variants: (StoreVariant & {
    priceLabel: string;
    compareAtLabel: string | null;
  })[];
};
