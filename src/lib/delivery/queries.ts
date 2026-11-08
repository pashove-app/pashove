import { createPublicClient } from "@/lib/supabase/public";

export type DeliveryZone = {
  id: string;
  name: string;
  feeAmount: number;
  currency: string;
  isDefault: boolean;
};

export async function getPublicDeliveryZones(
  slug: string,
): Promise<DeliveryZone[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_delivery_zones", {
    p_slug: slug,
  });

  if (!Array.isArray(data)) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    feeAmount: Number(row.feeAmount ?? 0),
    currency: String(row.currency ?? ""),
    isDefault: row.isDefault === true,
  }));
}
