import type { ProductOption, ProductType } from "@/lib/products/schema";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import { createClient } from "@/lib/supabase/server";

export type BundleSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "draft" | "published";
  price_amount: number;
  image_media_id: string | null;
  image: { object_key: string } | null;
  item_count: number;
  /** Somme des prix courants des articles, en unité mineure. */
  sum_amount: number;
  savings_amount: number;
  priceLabel: string;
  sumLabel: string;
  savingsLabel: string;
};

export type BundleItemDetail = {
  /** Identifiant stable côté formulaire : produit + variante éventuelle. */
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  price_amount: number;
  priceLabel: string;
};

export type BundleDetail = BundleSummary & { items: BundleItemDetail[] };

export type BundleItemOption = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  price_amount: number;
  priceLabel: string;
  imageUrl: string | null;
  status: "draft" | "published";
  product_type: ProductType;
};

type ItemRow = {
  position: number;
  product: {
    id: string;
    name: string;
    price_amount: number;
    options?: ProductOption[] | null;
  } | null;
  variant: {
    id: string;
    option_values: Record<string, string>;
    price_amount: number;
  } | null;
};

type BundleRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "draft" | "published";
  price_amount: number;
  image_media_id: string | null;
  image: { object_key: string } | null;
  bundle_items?: ItemRow[] | null;
};

const SUMMARY_COLUMNS = [
  "id, name, slug, description, status, price_amount, image_media_id",
  "image:media_assets!image_media_id(object_key)",
  "bundle_items(position, product:products!product_id(id, name, price_amount), variant:product_variants!variant_id(id, option_values, price_amount))",
].join(", ");

const DETAIL_COLUMNS = [
  "id, name, slug, description, status, price_amount, image_media_id",
  "image:media_assets!image_media_id(object_key)",
  "bundle_items(position, product:products!product_id(id, name, price_amount, options), variant:product_variants!variant_id(id, option_values, price_amount))",
].join(", ");

/** Étiquette de variante : valeurs dans l'ordre des options du produit. */
export function variantLabel(
  options: ProductOption[] | null | undefined,
  values: Record<string, string>,
): string {
  const ordered = (options ?? [])
    .map((option) => values[option.name])
    .filter((value): value is string => Boolean(value));

  const parts = ordered.length > 0 ? ordered : Object.values(values);
  return parts.join(" · ");
}

function priceOf(item: ItemRow): number {
  return item.variant?.price_amount ?? item.product?.price_amount ?? 0;
}

function sortedItems(items: ItemRow[] | null | undefined): ItemRow[] {
  return [...(items ?? [])].sort((left, right) => left.position - right.position);
}

function summarize(
  row: BundleRow,
  currency: string,
  localeTag: string,
): BundleSummary {
  const items = sortedItems(row.bundle_items);
  const sum = items.reduce((total, item) => total + priceOf(item), 0);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    price_amount: row.price_amount,
    image_media_id: row.image_media_id,
    image: row.image,
    item_count: items.length,
    sum_amount: sum,
    savings_amount: Math.max(sum - row.price_amount, 0),
    priceLabel: formatMoney(row.price_amount, currency, localeTag),
    sumLabel: formatMoney(sum, currency, localeTag),
    savingsLabel: formatMoney(Math.max(sum - row.price_amount, 0), currency, localeTag),
  };
}

/** Les paquets d'une boutique, du plus récent au plus ancien. */
export async function listBundles(
  storeId: string,
  currency: string,
  localeTag: string,
): Promise<BundleSummary[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bundles")
    .select(SUMMARY_COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as BundleRow[]).map((row) =>
    summarize(row, currency, localeTag),
  );
}

/** Un paquet et ses articles ordonnés, pour l'édition. */
export async function getBundle(
  id: string,
  storeId: string,
  currency: string,
  localeTag: string,
): Promise<BundleDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bundles")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as BundleRow;
  const items: BundleItemDetail[] = sortedItems(row.bundle_items)
    .filter((item) => item.product !== null)
    .map((item) => {
      const product = item.product!;
      const variantId = item.variant?.id ?? null;

      return {
        key: `${product.id}:${variantId ?? ""}`,
        productId: product.id,
        variantId,
        name: product.name,
        variantLabel: item.variant
          ? variantLabel(product.options, item.variant.option_values)
          : null,
        price_amount: priceOf(item),
        priceLabel: formatMoney(priceOf(item), currency, localeTag),
      };
    });

  return { ...summarize(row, currency, localeTag), items };
}

type OptionProductRow = {
  id: string;
  name: string;
  status: "draft" | "published";
  product_type: ProductType;
  price_amount: number;
  options: ProductOption[] | null;
  variants?: {
    id: string;
    option_values: Record<string, string>;
    price_amount: number;
    position: number;
  }[] | null;
  images?: { position: number; media: { object_key: string } | null }[] | null;
};

/**
 * Produits et variantes sélectionnables.
 *
 * Un produit sans variante devient une entrée ; un produit à variantes devient
 * une entrée par variante, car un paquet référence un article précis.
 */
export async function listBundleOptions(
  storeId: string,
  currency: string,
  localeTag: string,
): Promise<BundleItemOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, status, product_type, price_amount, options, variants:product_variants(id, option_values, price_amount, position), images:product_images(position, media:media_assets(object_key))",
    )
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  const options: BundleItemOption[] = [];

  for (const row of (data ?? []) as unknown as OptionProductRow[]) {
    const images = [...(row.images ?? [])].sort(
      (left, right) => left.position - right.position,
    );
    const key = images[0]?.media?.object_key ?? null;
    const imageUrl = key ? publicUrl(key) : null;
    const variants = [...(row.variants ?? [])].sort(
      (left, right) => left.position - right.position,
    );

    if (variants.length === 0) {
      options.push({
        key: `${row.id}:`,
        productId: row.id,
        variantId: null,
        name: row.name,
        variantLabel: null,
        price_amount: row.price_amount,
        priceLabel: formatMoney(row.price_amount, currency, localeTag),
        imageUrl,
        status: row.status,
        product_type: row.product_type,
      });
      continue;
    }

    for (const variant of variants) {
      options.push({
        key: `${row.id}:${variant.id}`,
        productId: row.id,
        variantId: variant.id,
        name: row.name,
        variantLabel: variantLabel(row.options, variant.option_values),
        price_amount: variant.price_amount,
        priceLabel: formatMoney(variant.price_amount, currency, localeTag),
        imageUrl,
        status: row.status,
        product_type: row.product_type,
      });
    }
  }

  return options;
}
