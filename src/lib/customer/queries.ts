import { createClient } from "@/lib/supabase/server";

export type CustomerOrderSummary = {
  id: string;
  token: string;
  number: number;
  status: string;
  paymentStatus: string;
  currency: string;
  total: number;
  createdAt: string;
  itemCount: number;
};

export type CustomerOrderItem = {
  id: string;
  name: string;
  variantLabel: string | null;
  sku: string | null;
  imageKey: string | null;
  productType: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  serviceStartsAt: string | null;
};

export type CustomerOrderDetail = {
  id: string;
  number: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  currency: string;
  subtotal: number;
  discount: number;
  discountCode: string | null;
  shipping: number;
  total: number;
  createdAt: string;
  customerName: string;
  country: string;
  city: string;
  address: string;
  extra: string | null;
  notes: string | null;
  items: CustomerOrderItem[];
};

export type CustomerEntitlement = {
  id: string;
  productName: string;
  fileName: string | null;
  orderNumber: number;
  downloadCount: number;
  maxDownloads: number;
  status: "available" | "revoked" | "expired";
  createdAt: string;
  expiresAt: string | null;
};

export type CustomerBooking = {
  id: string;
  productName: string;
  orderNumber: number;
  startsAt: string;
  durationMinutes: number;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
};

export async function getCustomerUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Réclame les commandes invitées ; appelé à l'ouverture de l'espace client. */
export async function claimGuestOrders(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("claim_guest_orders");
}

export async function customerOrders(
  slug: string,
): Promise<CustomerOrderSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("customer_orders", { p_slug: slug });
  return (data ?? []) as CustomerOrderSummary[];
}

export async function customerOrder(
  slug: string,
  id: string,
): Promise<CustomerOrderDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("customer_order", {
    p_slug: slug,
    p_order_id: id,
  });
  return (data as CustomerOrderDetail | null) ?? null;
}

export async function customerEntitlements(
  slug: string,
): Promise<CustomerEntitlement[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("customer_entitlements", {
    p_slug: slug,
  });
  return (data ?? []) as CustomerEntitlement[];
}

export async function customerBookings(
  slug: string,
): Promise<CustomerBooking[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("customer_bookings", { p_slug: slug });
  return (data ?? []) as CustomerBooking[];
}
