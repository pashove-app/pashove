"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteMediaAsset } from "@/lib/media/assets";
import { bundleSchema, toRpcItems } from "@/lib/bundles/schema";
import type { BundleFormState } from "@/lib/bundles/types";
import { getBundle } from "@/lib/bundles/queries";
import { parsePrice } from "@/lib/products/schema";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function list(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

function messageKeyFor(error: { code?: string; message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("bundle_price_too_high")) return "bundlePriceTooHigh";
  if (message.includes("bundle_items_count")) return "bundleItemsCount";
  if (message.includes("duplicate_items")) return "bundleItemsDuplicate";
  if (message.includes("invalid_items")) return "bundleItemsInvalid";
  if (message.includes("invalid_media")) return "bundleMediaInvalid";
  if (message.includes("bundle_price_invalid")) return "bundlePriceInvalid";
  if (error.code === "23505") return "bundleSlugTaken";
  if (error.code === "23514") return "bundleInvalid";

  return "serverError";
}

/** Crée ou met à jour un paquet et ses articles, atomiquement. */
export async function saveBundleAction(
  _previous: BundleFormState,
  formData: FormData,
): Promise<BundleFormState> {
  const locale = field(formData, "locale") || "fr";
  const bundleId = field(formData, "bundleId");

  const parsed = bundleSchema.safeParse({
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    description: field(formData, "description"),
    status: field(formData, "status"),
    imageMediaId: field(formData, "imageMediaId"),
    price: field(formData, "price"),
    items: list(formData, "item"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const priceAmount = parsePrice(parsed.data.price, store.currency);
  if (priceAmount === null || priceAmount <= 0) {
    return {
      status: "invalid",
      fieldErrors: { price: "bundlePriceInvalid" },
    };
  }

  const existing = bundleId ? await getBundle(bundleId, store.id, store.currency, "fr") : null;

  if (bundleId && !existing) {
    return { status: "error", messageKey: "serverError" };
  }

  const imageMediaId = parsed.data.imageMediaId || null;

  const { error } = await supabase.rpc("save_bundle", {
    p_bundle_id: bundleId || null,
    p_store_id: store.id,
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_description: parsed.data.description,
    p_image_media_id: imageMediaId,
    p_price_amount: priceAmount,
    p_status: parsed.data.status,
    p_items: toRpcItems(parsed.data.items),
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  if (existing?.image?.object_key && existing.image_media_id !== imageMediaId) {
    await deleteMediaAsset(supabase, existing.image_media_id as string);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/bundles?${bundleId ? "updated=1" : "created=1"}`);
}

/** Supprime un paquet, ses articles et sa couverture. */
export async function deleteBundleAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const bundleId = field(formData, "bundleId");

  if (!isSupabaseConfigured() || !bundleId) return;

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) redirect(`/${locale}/auth/login`);

  const existing = await getBundle(bundleId, store.id, store.currency, "fr");
  if (!existing) return;

  const { error } = await supabase
    .from("bundles")
    .delete()
    .eq("id", existing.id)
    .eq("store_id", store.id);

  if (error) return;

  if (existing.image_media_id) {
    await deleteMediaAsset(supabase, existing.image_media_id);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/bundles?deleted=1`);
}
