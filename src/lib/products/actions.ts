"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteMediaAsset } from "@/lib/media/assets";
import { getProduct } from "@/lib/products/queries";
import {
  isProductType,
  normalizeTags,
  parsePrice,
  productSchemaFor,
  type ProductType,
} from "@/lib/products/schema";
import type { ProductFormState } from "@/lib/products/types";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Traduit le code d'erreur PostgreSQL en clé de message du dictionnaire. */
function messageKeyFor(error: { code?: string }): string {
  if (error.code === "23505") return "productSlugTaken";
  if (error.code === "22023") return "productMediaInvalid";
  if (error.code === "23514") return "productInvalid";
  return "serverError";
}

type ParsedProduct = {
  name: string;
  slug: string;
  description: string;
  price: string;
  status: "draft" | "published";
  tags: string;
  videoUrl: string;
  imageId: string;
  stock?: string;
  weight?: string;
  fileId?: string;
  duration?: string;
  location?: "online" | "in_person";
};

/** Champs propres au type, nulls ailleurs : la base exige un jeu cohérent. */
function typeParams(type: ProductType, data: ParsedProduct) {
  if (type === "physical") {
    return {
      p_stock_quantity: Number(data.stock),
      p_weight_grams: Number(data.weight),
      p_duration_minutes: null,
      p_service_location: null,
      p_digital_file_id: null,
    };
  }

  if (type === "digital") {
    return {
      p_stock_quantity: null,
      p_weight_grams: null,
      p_duration_minutes: null,
      p_service_location: null,
      p_digital_file_id: data.fileId ?? null,
    };
  }

  return {
    p_stock_quantity: null,
    p_weight_grams: null,
    p_duration_minutes: Number(data.duration),
    p_service_location: data.location ?? null,
    p_digital_file_id: null,
  };
}

function readForm(formData: FormData) {
  return {
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    description: field(formData, "description"),
    price: field(formData, "price"),
    status: field(formData, "status"),
    tags: field(formData, "tags"),
    videoUrl: field(formData, "videoUrl"),
    imageId: field(formData, "productMediaId"),
    stock: field(formData, "stock"),
    weight: field(formData, "weight"),
    fileId: field(formData, "digitalFileId"),
    duration: field(formData, "duration"),
    location: field(formData, "serviceLocation"),
  };
}

/**
 * Crée un produit et son image en une seule transaction.
 *
 * Le type vient de la route et n'est jamais déduit du contenu du formulaire.
 * `create_product()` valide les médias et applique la RLS.
 */
export async function createProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const locale = field(formData, "locale") || "fr";
  const type = field(formData, "productType");

  if (!isProductType(type)) {
    return {
      status: "invalid",
      fieldErrors: { productType: "productTypeInvalid" },
    };
  }

  const parsed = productSchemaFor(type).safeParse(readForm(formData));

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const data = parsed.data as ParsedProduct;
  const price = parsePrice(data.price, store.currency);
  if (price === null) {
    return { status: "invalid", fieldErrors: { price: "productPriceInvalid" } };
  }

  const { error } = await supabase.rpc("create_product", {
    p_store_id: store.id,
    p_name: data.name,
    p_slug: data.slug,
    p_description: data.description,
    p_price_amount: price,
    p_status: data.status,
    p_product_type: type,
    p_tags: normalizeTags(data.tags),
    p_video_url: data.videoUrl || null,
    p_image_ids: [data.imageId],
    ...typeParams(type, data),
  });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/products?created=1`);
}

/**
 * Met à jour un produit existant.
 *
 * Le type enregistré fait foi : il n'est pas dans le formulaire. Les médias
 * remplacés sont supprimés du bucket après une mise à jour réussie.
 */
export async function updateProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const locale = field(formData, "locale") || "fr";
  const productId = field(formData, "productId");

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const existing = productId ? await getProduct(productId, store.id) : null;
  if (!existing) return { status: "error", messageKey: "serverError" };

  const type = existing.product_type;
  const parsed = productSchemaFor(type).safeParse(readForm(formData));

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  const data = parsed.data as ParsedProduct;
  const price = parsePrice(data.price, store.currency);
  if (price === null) {
    return { status: "invalid", fieldErrors: { price: "productPriceInvalid" } };
  }

  const params = typeParams(type, data);

  const { error } = await supabase.rpc("update_product", {
    p_product_id: existing.id,
    p_name: data.name,
    p_slug: data.slug,
    p_description: data.description,
    p_price_amount: price,
    p_status: data.status,
    p_tags: normalizeTags(data.tags),
    p_video_url: data.videoUrl || null,
    p_image_ids: [data.imageId],
    ...params,
  });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  // Les médias remplacés ne doivent pas rester dans les buckets.
  if (existing.image && existing.image.id !== data.imageId) {
    await deleteMediaAsset(supabase, existing.image.id);
  }

  const previousFileId = existing.digital_file?.id ?? null;
  const nextFileId = params.p_digital_file_id ?? null;
  if (previousFileId && previousFileId !== nextFileId) {
    await deleteMediaAsset(supabase, previousFileId);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/products?updated=1`);
}
