"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteMediaAsset } from "@/lib/media/assets";
import { collectionSchema } from "@/lib/collections/schema";
import type { CollectionFormState } from "@/lib/collections/types";
import { getCollection } from "@/lib/collections/queries";
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

  if (message.includes("collection_empty")) return "collectionEmpty";
  if (message.includes("invalid_products")) return "collectionProductsInvalid";
  if (message.includes("invalid_media")) return "collectionMediaInvalid";
  if (error.code === "23505") return "collectionSlugTaken";
  if (error.code === "23514") return "collectionInvalid";

  return "serverError";
}

/** Crée ou met à jour une collection et ses produits, atomiquement. */
export async function saveCollectionAction(
  _previous: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const locale = field(formData, "locale") || "fr";
  const collectionId = field(formData, "collectionId");

  const parsed = collectionSchema.safeParse({
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    description: field(formData, "description"),
    status: field(formData, "status"),
    imageMediaId: field(formData, "imageMediaId"),
    productIds: list(formData, "productId"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const existing = collectionId
    ? await getCollection(collectionId, store.id)
    : null;

  if (collectionId && !existing) {
    return { status: "error", messageKey: "serverError" };
  }

  const imageMediaId = parsed.data.imageMediaId || null;

  const { error } = await supabase.rpc("save_collection", {
    p_collection_id: collectionId || null,
    p_store_id: store.id,
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_description: parsed.data.description,
    p_image_media_id: imageMediaId,
    p_is_published: parsed.data.status === "published",
    p_product_ids: parsed.data.productIds,
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  if (
    existing?.image_media_id &&
    existing.image_media_id !== imageMediaId
  ) {
    await deleteMediaAsset(supabase, existing.image_media_id);
  }

  revalidatePath("/", "layout");
  redirect(
    `/${locale}/app/collections?${collectionId ? "updated=1" : "created=1"}`,
  );
}

/** Supprime une collection, ses liaisons et sa couverture. */
export async function deleteCollectionAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const collectionId = field(formData, "collectionId");

  if (!isSupabaseConfigured() || !collectionId) return;

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) redirect(`/${locale}/auth/login`);

  const existing = await getCollection(collectionId, store.id);
  if (!existing) return;

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", existing.id)
    .eq("store_id", store.id);

  if (error) return;

  if (existing.image_media_id) {
    await deleteMediaAsset(supabase, existing.image_media_id);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/collections?deleted=1`);
}
