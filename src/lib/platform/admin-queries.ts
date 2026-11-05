import { createClient } from "@/lib/supabase/server";
import type {
  AdminDashboard,
  AdminMerchant,
  AdminMerchantDetail,
  AdminSettingsData,
  AdminStore,
  AdminStoreDetail,
  AdminUser,
  AdminUserDetail,
} from "./admin-types";

async function rpc<T>(name: string, params: Record<string, unknown> = {}): Promise<T | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, params);
  if (error || !data) return null;
  return data as T;
}

export async function getAdminDashboard(): Promise<AdminDashboard | null> {
  return rpc<AdminDashboard>("platform_dashboard");
}

export async function listAdminMerchants(): Promise<AdminMerchant[]> {
  return (await rpc<AdminMerchant[]>("platform_merchants")) ?? [];
}

export async function getAdminMerchant(
  userId: string,
): Promise<AdminMerchantDetail | null> {
  return rpc<AdminMerchantDetail>("platform_merchant_detail", {
    p_user_id: userId,
  });
}

export async function listAdminStores(): Promise<AdminStore[]> {
  return (await rpc<AdminStore[]>("platform_stores")) ?? [];
}

export async function getAdminStore(
  storeId: string,
): Promise<AdminStoreDetail | null> {
  return rpc<AdminStoreDetail>("platform_store_detail", {
    p_store_id: storeId,
  });
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  return (await rpc<AdminUser[]>("platform_users")) ?? [];
}

export async function getAdminUser(
  userId: string,
): Promise<AdminUserDetail | null> {
  return rpc<AdminUserDetail>("platform_user_detail", {
    p_user_id: userId,
  });
}

export async function getAdminSettings(): Promise<AdminSettingsData | null> {
  return rpc<AdminSettingsData>("platform_settings");
}
