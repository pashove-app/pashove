import { createClient } from "@/lib/supabase/server";

export type InventoryVariant = {
  id: string;
  label: string;
  sku: string | null;
  stock: number;
};

export type InventoryProduct = {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  low: boolean;
  out: boolean;
  variants: InventoryVariant[];
};

export type InventoryLocation = {
  id: string;
  name: string;
  kind: "warehouse" | "shop" | "other";
  is_default: boolean;
};

export type InventoryMovement = {
  id: string;
  created_at: string;
  delta: number;
  reason: string;
  note: string | null;
  product_name: string;
  variant_label: string | null;
  location_name: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  stock_quantity: number | null;
  low_stock_threshold: number;
  product_variants?: {
    id: string;
    option_values: Record<string, string> | null;
    sku: string | null;
    stock_quantity: number;
  }[] | null;
};

/** Produits physiques avec leur stock, variantes comprises. */
export async function listInventoryProducts(
  storeId: string,
): Promise<InventoryProduct[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, stock_quantity, low_stock_threshold, product_variants(id, option_values, sku, stock_quantity)",
    )
    .eq("store_id", storeId)
    .eq("product_type", "physical")
    .order("name", { ascending: true })
    .limit(500);

  return ((data ?? []) as unknown as ProductRow[]).map((row) => {
    const variants = [...(row.product_variants ?? [])]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((variant) => ({
        id: variant.id,
        label: Object.values(variant.option_values ?? {}).join(" · ") || "Variante",
        sku: variant.sku,
        stock: variant.stock_quantity,
      }));

    const stock =
      variants.length > 0
        ? variants.reduce((total, variant) => total + variant.stock, 0)
        : row.stock_quantity ?? 0;

    return {
      id: row.id,
      name: row.name,
      stock,
      threshold: row.low_stock_threshold,
      low: stock > 0 && stock <= row.low_stock_threshold,
      out: stock <= 0,
      variants,
    };
  });
}

export async function listInventoryLocations(
  storeId: string,
): Promise<InventoryLocation[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("inventory_locations")
    .select("id, name, kind, is_default")
    .eq("store_id", storeId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  return (data ?? []) as unknown as InventoryLocation[];
}

type MovementRow = {
  id: string;
  created_at: string;
  delta: number;
  reason: string;
  note: string | null;
  product: { name: string } | { name: string }[] | null;
  variant: {
    sku: string | null;
    option_values: Record<string, string> | null;
  } | {
    sku: string | null;
    option_values: Record<string, string> | null;
  }[] | null;
  location: { name: string } | { name: string }[] | null;
};

export async function listInventoryMovements(
  storeId: string,
  limit = 60,
): Promise<InventoryMovement[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("inventory_movements")
    .select(
      "id, created_at, delta, reason, note, product:products(name), variant:product_variants(sku, option_values), location:inventory_locations(name)",
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as MovementRow[]).map((row) => {
    const product = Array.isArray(row.product) ? row.product[0] : row.product;
    const variant = Array.isArray(row.variant) ? row.variant[0] : row.variant;
    const location = Array.isArray(row.location) ? row.location[0] : row.location;

    return {
      id: row.id,
      created_at: row.created_at,
      delta: row.delta,
      reason: row.reason,
      note: row.note,
      product_name: product?.name ?? "Produit",
      variant_label:
        variant?.sku ??
        (variant ? Object.values(variant.option_values ?? {}).join(" · ") : null) ??
        null,
      location_name: location?.name ?? null,
    };
  });
}
