"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveLocale } from "@/i18n/config";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function setCourierOnlineAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const online = field(formData, "online") === "true";

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_courier_online", {
    p_online: online,
  });

  if (error) {
    console.error("[courier] online toggle failed", error.message);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/courier`);
}

export async function acceptDeliveryAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const id = field(formData, "deliveryId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_delivery", {
    p_delivery_id: id,
  });

  if (error) {
    redirect(`/${locale}/app/courier?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/courier`);
}

export async function declineDeliveryAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const id = field(formData, "deliveryId");
  const supabase = await createClient();
  await supabase.rpc("decline_delivery", { p_delivery_id: id });

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/courier`);
}

/** Appelée par le compte à rebours quand il atteint zéro. */
export async function expireDeliveryOfferAction(
  deliveryId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("expire_delivery_offer", { p_delivery_id: deliveryId });
  revalidatePath("/", "layout");
}
