import { createClient } from "@/lib/supabase/server";

export type AdminDeliveryZone = {
  id: string;
  countryCode: string;
  name: string;
  feeAmount: number;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
};

export async function adminDeliveryZones(): Promise<AdminDeliveryZone[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_delivery_zones");
  if (!Array.isArray(data)) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id ?? ""),
    countryCode: String(row.countryCode ?? ""),
    name: String(row.name ?? ""),
    feeAmount: Number(row.feeAmount ?? 0),
    currency: String(row.currency ?? ""),
    isDefault: row.isDefault === true,
    isActive: row.isActive !== false,
  }));
}
