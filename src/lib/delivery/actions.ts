"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";

export type DeliverySettingsState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

export async function saveDeliverySettingsAction(
  _previous: DeliverySettingsState,
  formData: FormData,
): Promise<DeliverySettingsState> {
  const store = await currentStore();
  if (!store) return { status: "error", message: "Boutique introuvable." };

  const mode = formData.get("mode") === "pashove" ? "pashove" : "self";
  const countries = formData
    .getAll("countries")
    .map((value) => String(value).toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_delivery_settings", {
    p_store_id: store.id,
    p_mode: mode,
    p_countries: countries,
  });

  if (error) {
    const message = error.message.includes("zones_required")
      ? "Choisis au moins un pays desservi par Pashove Delivery."
      : error.message.includes("zone_not_in_markets")
        ? "Un pays choisi n’est pas activé dans tes pays de vente."
        : "Enregistrement impossible.";
    return { status: "error", message };
  }

  revalidatePath("/", "layout");
  return { status: "saved", message: "Réglages de livraison enregistrés." };
}
