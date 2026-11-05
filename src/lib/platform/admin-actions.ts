"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AdminActionResult = {
  status: "idle" | "saved" | "error";
  message?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function messageFor(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  if (message.includes("protected_account")) return "Ce compte plateforme est protégé.";
  if (message.includes("last_super_admin")) return "Impossible de retirer le dernier super administrateur.";
  if (message.includes("user_not_found")) return "Aucun compte ne correspond à cet e-mail.";
  if (message.includes("invalid_plan")) return "Les valeurs du plan sont invalides.";
  if (message.includes("not_allowed")) return "Ton rôle ne permet pas cette action.";
  return "L'action a échoué. Réessaie.";
}

async function call(
  name: string,
  params: Record<string, unknown>,
): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase indisponible." };

  const supabase = await createClient();
  const { error } = await supabase.rpc(name, params);

  if (error) return { status: "error", message: messageFor(error) };

  revalidatePath("/platform-admin", "layout");
  return { status: "saved" };
}

export async function setMerchantStatusAction(
  _previous: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  return call("platform_set_merchant_status", {
    p_user_id: field(formData, "userId"),
    p_suspend: field(formData, "suspend") === "true",
  });
}

export async function setStoreStatusAction(
  _previous: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  return call("platform_set_store_status", {
    p_store_id: field(formData, "storeId"),
    p_suspend: field(formData, "suspend") === "true",
  });
}

export async function setUserStatusAction(
  _previous: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  return call("platform_set_user_status", {
    p_user_id: field(formData, "userId"),
    p_suspend: field(formData, "suspend") === "true",
  });
}

export async function resetUserSecurityAction(
  _previous: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  return call("platform_reset_user_security", {
    p_user_id: field(formData, "userId"),
  });
}

export async function savePlanAction(
  _previous: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  return call("platform_save_plan", {
    p_code: field(formData, "code"),
    p_name: field(formData, "name"),
    p_commission_bps: Number(field(formData, "commissionBps")),
    p_max_stores: Number(field(formData, "maxStores")),
    p_max_members: Number(field(formData, "maxMembers")),
    p_price_amount: Number(field(formData, "priceAmount")),
  });
}

export async function addAdminAction(
  _previous: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  return call("platform_add_admin", {
    p_email: field(formData, "email"),
    p_role: field(formData, "role") || "admin",
  });
}

export async function removeAdminAction(
  _previous: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  return call("platform_remove_admin", {
    p_user_id: field(formData, "userId"),
  });
}

export async function saveSettingAction(
  _previous: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const key = field(formData, "key");
  const enabled = field(formData, "enabled") === "true";

  return call("platform_save_setting", {
    p_key: key,
    p_value: enabled,
  });
}
