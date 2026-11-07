"use server";

import { revalidatePath } from "next/cache";
import { resolveLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";
import { CHECKOUT_BLOCKS, type CheckoutBlockKey } from "@/lib/checkout/settings";

export type CheckoutSettingsState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Enregistre l'habillage du checkout. Pays et moyens ne sont jamais modifiables. */
export async function saveCheckoutSettingsAction(
  _previous: CheckoutSettingsState,
  formData: FormData,
): Promise<CheckoutSettingsState> {
  const store = await currentStore();
  if (!store) {
    return { status: "error", message: "Boutique introuvable." };
  }

  const locale = resolveLocale(field(formData, "locale"));
  const preset = field(formData, "preset") === "detailed" ? "detailed" : "compact";

  const blocks: CheckoutBlockKey[] = [];
  for (const entry of formData.getAll("blocks")) {
    const key = String(entry);
    if (
      CHECKOUT_BLOCKS.includes(key as CheckoutBlockKey) &&
      !blocks.includes(key as CheckoutBlockKey)
    ) {
      blocks.push(key as CheckoutBlockKey);
    }
  }
  for (const key of CHECKOUT_BLOCKS) {
    if (!blocks.includes(key)) blocks.push(key);
  }

  let texts: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(field(formData, "texts") || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      texts = parsed as Record<string, unknown>;
    }
  } catch {
    texts = {};
  }

  texts[locale] = {
    title: field(formData, "title").slice(0, 120),
    subtitle: field(formData, "subtitle").slice(0, 240),
    payLabel: field(formData, "payLabel").slice(0, 40),
  };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_checkout_settings", {
    p_store_id: store.id,
    p_preset: preset,
    p_blocks: blocks,
    p_texts: texts,
    p_show_gift: formData.get("showGift") === "on",
    p_show_discount: formData.get("showDiscount") === "on",
  });

  if (error) {
    return { status: "error", message: "Enregistrement impossible." };
  }

  revalidatePath("/", "layout");
  return { status: "saved", message: "Réglages enregistrés." };
}
