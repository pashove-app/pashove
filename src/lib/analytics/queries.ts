import { createClient } from "@/lib/supabase/server";

export type StoreAnalytics = {
  revenue: number;
  orders: number;
  averageOrder: number;
  newCustomers: number;
  conversionRate: number;
  carts: number;
  convertedCarts: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCustomers: {
    name: string;
    email: string;
    orders: number;
    revenue: number;
  }[];
  series: { date: string; amount: number }[];
};

export async function getStoreAnalytics(
  storeId: string,
): Promise<StoreAnalytics | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("store_analytics", {
    p_store_id: storeId,
  });

  if (error || !data) return null;
  return data as StoreAnalytics;
}
