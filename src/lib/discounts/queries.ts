import { createClient } from "@/lib/supabase/server";

export type DiscountKind = "percent" | "fixed";

export type DiscountStatus = "active" | "scheduled" | "expired" | "inactive";

export type DiscountRow = {
  id: string;
  code: string;
  kind: DiscountKind;
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  uses_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

const COLUMNS =
  "id, code, kind, value, min_subtotal, max_uses, uses_count, starts_at, expires_at, active, created_at";

/** Statut affiché, déduit des dates et du quota — jamais stocké en base. */
export function discountStatus(
  row: DiscountRow,
  now: Date = new Date(),
): DiscountStatus {
  if (!row.active) return "inactive";
  if (row.starts_at && new Date(row.starts_at) > now) return "scheduled";
  if (row.expires_at && new Date(row.expires_at) <= now) return "expired";
  if (row.max_uses !== null && row.uses_count >= row.max_uses) return "expired";

  return "active";
}

/** Les codes promo d'une boutique, du plus récent au plus ancien. */
export async function listDiscounts(storeId: string): Promise<DiscountRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("discount_codes")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return (data ?? []) as DiscountRow[];
}
