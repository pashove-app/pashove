"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getGiftBuyer, getGiftClaimInfo } from "@/lib/gifts/queries";
import type { GiftClaimState } from "@/lib/gifts/types";
import { emailGiftClaimed } from "@/lib/email/events";
import { signDownload } from "@/lib/r2/client";
import { canManageTeam, currentMembership } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function claimErrorKey(message?: string): string {
  const value = message ?? "";

  if (value.includes("gift_expired")) return "errorExpired";
  if (value.includes("gift_not_ready")) return "errorNotReady";
  if (value.includes("gift_slot_taken")) return "errorSlotTaken";
  if (value.includes("gift_address_required")) return "required";
  if (value.includes("gift_slot_required")) return "required";

  return "errorGeneric";
}

/** Réclame un cadeau : adresse, créneau ou accès numérique, en une transaction. */
export async function claimGiftAction(
  _previous: GiftClaimState,
  formData: FormData,
): Promise<GiftClaimState> {
  const locale = field(formData, "locale") || "fr";
  const token = field(formData, "token");

  if (!isSupabaseConfigured() || !token) {
    return { status: "error", messageKey: "errorGeneric" };
  }

  const serviceAt = field(formData, "serviceStartsAt");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("gift_claim", {
    p_token: token,
    p_country: field(formData, "country") || null,
    p_city: field(formData, "city") || null,
    p_address: field(formData, "address") || null,
    p_extra: field(formData, "extra") || null,
    p_phone: field(formData, "phone") || null,
    p_service_starts_at: serviceAt ? new Date(serviceAt).toISOString() : null,
  });

  if (error) {
    return { status: "error", messageKey: claimErrorKey(error.message) };
  }

  const result = data as { status?: string } | null;
  if (!result || result.status !== "claimed") {
    return { status: "error", messageKey: "errorGeneric" };
  }

  const info = await getGiftClaimInfo(token);
  const buyer = await getGiftBuyer(token);

  if (info && buyer) {
    after(async () => {
      await emailGiftClaimed({
        buyerEmail: buyer.email,
        buyerName: buyer.name,
        storeName: buyer.storeName,
        storeSlug: buyer.storeSlug,
        orderNumber: buyer.orderNumber,
        recipientName: info.recipientName,
        itemNames: info.items.map((item) => item.name),
        locale,
      });
    });
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/gift/claimed/${token}`);
}

/** Télécharge un fichier de cadeau, même sans compte. */
export async function downloadGiftFileAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const token = field(formData, "token");
  const entitlementId = field(formData, "entitlementId");

  if (!isSupabaseConfigured() || !token || !entitlementId) {
    redirect(`/${locale}/gift/claimed/${token}?download=error`);
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("gift_download", {
    p_token: token,
    p_entitlement_id: entitlementId,
  });

  const item = data as
    | { objectKey?: string; fileName?: string }
    | null;

  if (error || !item?.objectKey) {
    redirect(`/${locale}/gift/claimed/${token}?download=error`);
  }

  let url: string;
  try {
    url = await signDownload(item.objectKey, "digital_file");
  } catch {
    redirect(`/${locale}/gift/claimed/${token}?download=error`);
  }

  redirect(url);
}

export type GiftSettingsState = {
  status: "idle" | "saved" | "error";
};

/** Active ou coupe l'option cadeau pour la boutique active. */
export async function saveGiftSettingsAction(
  _previous: GiftSettingsState,
  formData: FormData,
): Promise<GiftSettingsState> {
  const locale = field(formData, "locale") || "fr";

  if (!isSupabaseConfigured()) return { status: "error" };

  const membership = await currentMembership();
  if (!membership || !canManageTeam(membership.role)) {
    return { status: "error" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("stores")
    .update({ gift_enabled: formData.get("giftEnabled") === "on" })
    .eq("id", membership.store.id);

  if (error) return { status: "error" };

  revalidatePath("/", "layout");
  revalidatePath(`/${locale}/app/gifts`);
  return { status: "saved" };
}
