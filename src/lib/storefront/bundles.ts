import type { ProductOption } from "@/lib/products/schema";
import { formatMoney } from "@/lib/money";
import { createPublicClient } from "@/lib/supabase/public";

export type PublicBundleItem = {
  name: string;
  slug: string;
  variantLabel: string | null;
  price_amount: number;
  priceLabel: string;
  image_key: string | null;
  product_type: string;
};

export type PublicBundle = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_key: string | null;
  price_amount: number;
  priceLabel: string;
  sum_amount: number;
  sumLabel: string;
  savings_amount: number;
  savingsLabel: string;
  items: PublicBundleItem[];
};

type ItemRow = {
  position: number;
  product: {
    name: string;
    slug: string;
    product_type: string;
    price_amount: number;
    options: ProductOption[] | null;
    images?: { position: number; media: { object_key: string } | null }[] | null;
  } | null;
  variant: {
    option_values: Record<string, string>;
    price_amount: number;
  } | null;
};

type BundleRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_amount: number;
  image: { object_key: string } | null;
  bundle_items: ItemRow[] | null;
};

const COLUMNS = [
  "id, name, slug, description, price_amount",
  "image:media_assets!image_media_id(object_key)",
  "bundle_items(position, product:products!product_id(name, slug, product_type, price_amount, options, images:product_images(position, media:media_assets(object_key))), variant:product_variants!variant_id(option_values, price_amount))",
].join(", ");

function variantLabel(
  options: ProductOption[] | null | undefined,
  values: Record<string, string>,
): string {
  const ordered = (options ?? [])
    .map((option) => values[option.name])
    .filter((value): value is string => Boolean(value));
  return (ordered.length > 0 ? ordered : Object.values(values)).join(" · ");
}

function toBundle(row: BundleRow, currency: string, tag: string): PublicBundle {
  const items = [...(row.bundle_items ?? [])]
    .sort((left, right) => left.position - right.position)
    .filter((item) => item.product !== null)
    .map((item) => {
      const product = item.product!;
      const images = [...(product.images ?? [])].sort(
        (left, right) => left.position - right.position,
      );
      const price = item.variant?.price_amount ?? product.price_amount;

      return {
        name: product.name,
        slug: product.slug,
        variantLabel: item.variant
          ? variantLabel(product.options, item.variant.option_values)
          : null,
        price_amount: price,
        priceLabel: formatMoney(price, currency, tag),
        image_key: images[0]?.media?.object_key ?? null,
        product_type: product.product_type,
      } satisfies PublicBundleItem;
    });

  const sum = items.reduce((total, item) => total + item.price_amount, 0);
  const savings = Math.max(sum - row.price_amount, 0);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image_key: row.image?.object_key ?? null,
    price_amount: row.price_amount,
    priceLabel: formatMoney(row.price_amount, currency, tag),
    sum_amount: sum,
    sumLabel: formatMoney(sum, currency, tag),
    savings_amount: savings,
    savingsLabel: formatMoney(savings, currency, tag),
    items,
  };
}

export async function listPublicBundles(
  storeId: string,
  currency: string,
  tag: string,
): Promise<PublicBundle[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("bundles")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as BundleRow[]).map((row) =>
    toBundle(row, currency, tag),
  );
}

export async function getPublicBundle(
  storeId: string,
  slug: string,
  currency: string,
  tag: string,
): Promise<PublicBundle | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("bundles")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("slug", slug.trim().toLowerCase())
    .eq("status", "published")
    .maybeSingle();

  return data
    ? toBundle(data as unknown as BundleRow, currency, tag)
    : null;
}
