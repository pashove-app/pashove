"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const PATH = "/platform-admin/delivery-pricing";

export async function saveDeliveryZoneAction(formData: FormData): Promise<void> {
  const id = field(formData, "id");
  const market = field(formData, "market");
  const country = field(formData, "country") || market.split("-")[0] || "";
  const currency = field(formData, "currency") || market.split("-")[1] || "";
  const name = field(formData, "name");
  const fee = Number(field(formData, "fee"));
  const isDefault = formData.get("isDefault") === "on";

  if (!name || !Number.isFinite(fee) || fee < 0) {
    redirect(`${PATH}?error=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_delivery_zone", {
    p_id: id || null,
    p_country: country.toUpperCase(),
    p_name: name,
    p_fee: Math.round(fee),
    p_currency: currency.toUpperCase(),
    p_is_default: isDefault,
  });

  if (error) {
    console.error("[delivery] save zone failed", error.message);
    redirect(`${PATH}?error=save`);
  }

  revalidatePath(PATH);
  revalidatePath("/", "layout");
  redirect(`${PATH}?ok=1`);
}

export async function deleteDeliveryZoneAction(formData: FormData): Promise<void> {
  const id = field(formData, "id");
  const supabase = await createClient();
  await supabase.rpc("delete_delivery_zone", { p_id: id });

  revalidatePath(PATH);
  revalidatePath("/", "layout");
  redirect(`${PATH}?ok=1`);
}
