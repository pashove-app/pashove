import { createClient } from "@/lib/supabase/server";

export type StoreCustomer = {
  store_id: string;
  customer_key: string;
  name: string;
  email: string | null;
  phone: string | null;
  orders_count: number;
  total_spent: number;
  all_orders: number;
  first_order_at: string;
  last_order_at: string;
};

export type CustomerOrder = {
  id: string;
  number: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "refunded" | "failed";
  total_amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
  shipping_address: string;
  shipping_extra: string | null;
  shipping_city: string;
  shipping_country: string;
};

/** Les clients agrégés d'une boutique, dérivés des commandes. */
export async function listStoreCustomers(
  storeId: string,
): Promise<StoreCustomer[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("store_customers")
    .select("*")
    .eq("store_id", storeId)
    .order("last_order_at", { ascending: false });

  return (data as StoreCustomer[] | null) ?? [];
}

/** Les commandes d'un client précis, identifié par sa clé. */
export async function getCustomerOrders(
  storeId: string,
  key: string,
): Promise<CustomerOrder[]> {
  const supabase = await createClient();

  const { data } = await supabase.rpc("store_customer_orders", {
    p_store_id: storeId,
    p_key: key,
  });

  return (data as CustomerOrder[] | null) ?? [];
}
