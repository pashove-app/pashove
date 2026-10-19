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

function list(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
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
  compareAtPrice: string;
  status: "draft" | "published";
  tags: string;
  videoUrl: string;
  imageIds: string[];
  stock?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  shippingAll?: "1" | "0";
  shippingCountries?: string[];
  fileId?: string;
  duration?: string;
  location?: "online" | "in_person";
};

function toOptionalInt(value: string | undefined): number | null {
  return value ? Number(value) : null;
}

/** Champs propres au type, nulls ailleurs : la base exige un jeu cohérent. */
function typeParams(type: ProductType, data: ParsedProduct) {
  if (type === "physical") {
    return {
      p_stock_quantity: Number(data.stock),
      p_weight_grams: Number(data.weight),
      p_duration_minutes: null,
      p_service_location: null,
      p_digital_file_id: null,
      p_length_mm: toOptionalInt(data.length),
      p_width_mm: toOptionalInt(data.width),
      p_height_mm: toOptionalInt(data.height),
      p_shipping_countries:
        data.shippingAll === "1" ? [] : (data.shippingCountries ?? []),
    };
  }

  if (type === "digital") {
    return {
      p_stock_quantity: null,
      p_weight_grams: null,
      p_duration_minutes: null,
      p_service_location: null,
      p_digital_file_id: data.fileId ?? null,
      p_length_mm: null,
      p_width_mm: null,
      p_height_mm: null,
      p_shipping_countries: [],
    };
  }

  return {
    p_stock_quantity: null,
    p_weight_grams: null,
    p_duration_minutes: Number(data.duration),
    p_service_location: data.location ?? null,
    p_digital_file_id: null,
    p_length_mm: null,
    p_width_mm: null,
    p_height_mm: null,
    p_shipping_countries: [],
  };
}

function readForm(formData: FormData) {
  return {
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    description: field(formData, "description"),
    price: field(formData, "price"),
    compareAtPrice: field(formData, "compareAtPrice"),
    status: field(formData, "status"),
    tags: field(formData, "tags"),
    videoUrl: field(formData, "videoUrl"),
    imageIds: list(formData, "imageIds"),
    stock: field(formData, "stock"),
    weight: field(formData, "weight"),
    length: field(formData, "length"),
    width: field(formData, "width"),
    height: field(formData, "height"),
    shippingAll: field(formData, "shippingAll") === "on" ? "1" : "0",
    shippingCountries: list(formData, "shippingCountry"),
    fileId: field(formData, "digitalFileId"),
    duration: field(formData, "duration"),
    location: field(formData, "serviceLocation"),
  };
}

/**
 * Valide les prix. Renvoie une erreur de champ, ou les montants convertis.
 *
 * Le prix comparé, quand il existe, doit rester supérieur au prix de vente :
 * un prix « barré » plus bas n'aurait aucun sens.
 */
function validatePrices(
  priceInput: string,
  compareInput: string,
  currency: string,
): { price?: number; compareAt?: number | null; error?: string } {
  const price = parsePrice(priceInput, currency);
  if (price === null) return { error: "productPriceInvalid" };

  if (compareInput === "") return { price, compareAt: null };

  const compareAt = parsePrice(compareInput, currency);
  if (compareAt === null) return { error: "productCompareInvalid" };
  if (compareAt <= price) return { error: "productCompareTooLow" };

  return { price, compareAt };
}

/** Crée un produit et sa galerie dans une seule transaction. */
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
  const prices = validatePrices(data.price, data.compareAtPrice, store.currency);
  if (prices.error) {
    return { status: "invalid", fieldErrors: { price: prices.error } };
  }

  if (
    type === "physical" &&
    data.shippingAll !== "1" &&
    (data.shippingCountries ?? []).length === 0
  ) {
    return {
      status: "invalid",
      fieldErrors: { shippingCountries: "productCountriesRequired" },
    };
  }

  const { error } = await supabase.rpc("create_product", {
    p_store_id: store.id,
    p_name: data.name,
    p_slug: data.slug,
    p_description: data.description,
    p_price_amount: prices.price,
    p_compare_at_amount: prices.compareAt ?? null,
    p_status: data.status,
    p_product_type: type,
    p_tags: normalizeTags(data.tags),
    p_video_url: data.videoUrl || null,
    p_image_ids: data.imageIds,
    ...typeParams(type, data),
  });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/products?created=1`);
}

/** Met à jour un produit existant, galerie comprise. */
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
  const prices = validatePrices(data.price, data.compareAtPrice, store.currency);
  if (prices.error) {
    return { status: "invalid", fieldErrors: { price: prices.error } };
  }

  if (
    type === "physical" &&
    data.shippingAll !== "1" &&
    (data.shippingCountries ?? []).length === 0
  ) {
    return {
      status: "invalid",
      fieldErrors: { shippingCountries: "productCountriesRequired" },
    };
  }

  const params = typeParams(type, data);

  const { error } = await supabase.rpc("update_product", {
    p_product_id: existing.id,
    p_name: data.name,
    p_slug: data.slug,
    p_description: data.description,
    p_price_amount: prices.price,
    p_compare_at_amount: prices.compareAt ?? null,
    p_status: data.status,
    p_tags: normalizeTags(data.tags),
    p_video_url: data.videoUrl || null,
    p_image_ids: data.imageIds,
    ...params,
  });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  // Les images retirées de la galerie quittent aussi le bucket.
  const removedImages = existing.images
    .map((image) => image.id)
    .filter((id) => !data.imageIds.includes(id));

  for (const id of removedImages) {
    await deleteMediaAsset(supabase, id);
  }

  const previousFileId = existing.digital_file?.id ?? null;
  const nextFileId = params.p_digital_file_id ?? null;
  if (previousFileId && previousFileId !== nextFileId) {
    await deleteMediaAsset(supabase, previousFileId);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/products?updated=1`);
}
