import { createClient } from "@/lib/supabase/server";

export type CourierDelivery = {
  id: string;
  status: string;
  feeAmount: number;
  currency: string;
  offerExpiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  orderNumber: number;
  storeName: string;
  customerName: string;
  customerPhone: string;
  shippingCountry: string;
  shippingCity: string;
  shippingAddress: string;
  shippingExtra: string | null;
  notes: string | null;
};

export type CourierDashboard = {
  offer: CourierDelivery | null;
  active: CourierDelivery | null;
};

function normalize(value: unknown): CourierDelivery | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    status: String(row.status ?? ""),
    feeAmount: Number(row.feeAmount ?? 0),
    currency: String(row.currency ?? "XOF"),
    offerExpiresAt:
      typeof row.offerExpiresAt === "string" ? row.offerExpiresAt : null,
    acceptedAt: typeof row.acceptedAt === "string" ? row.acceptedAt : null,
    createdAt: String(row.createdAt ?? ""),
    orderNumber: Number(row.orderNumber ?? 0),
    storeName: String(row.storeName ?? ""),
    customerName: String(row.customerName ?? ""),
    customerPhone: String(row.customerPhone ?? ""),
    shippingCountry: String(row.shippingCountry ?? ""),
    shippingCity: String(row.shippingCity ?? ""),
    shippingAddress: String(row.shippingAddress ?? ""),
    shippingExtra:
      typeof row.shippingExtra === "string" ? row.shippingExtra : null,
    notes: typeof row.notes === "string" ? row.notes : null,
  };
}

export async function myCourierDeliveries(): Promise<CourierDashboard> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_courier_deliveries");
  const raw = (data ?? {}) as { offer?: unknown; active?: unknown };

  return {
    offer: normalize(raw.offer ?? null),
    active: normalize(raw.active ?? null),
  };
}
