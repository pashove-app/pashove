"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteMediaAsset } from "@/lib/media/assets";
import { getProduct } from "@/lib/products/queries";
import {
  checkVariantMatrix,
  isProductType,
  normalizeTags,
  parsePrice,
  parseProductOptions,
  parseProductVariants,
  productSchemaFor,
  type ProductOption,
  type ProductType,
  type VariantInput,
  type VariantPayload,
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
function messageKeyFor(error: { code?: string; message?: string }): string {
  const message = error.message ?? "";
  if (message.includes("invalid_options")) return "productOptionsInvalid";
  if (message.includes("invalid_variants")) return "productVariantsInvalid";
  if (message.includes("invalid_media") || message.includes("too_many_images")) {
    return "productMediaInvalid";
  }
  if (message.includes("invalid_file")) return "productFileRequired";
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
  descriptionMediaId: string;
  stock?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  shippingAll?: "1" | "0";
  shippingCountries?: string[];
  options: string;
  variants: string;
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
    descriptionMediaId: field(formData, "descriptionMediaId"),
    stock: field(formData, "stock"),
    weight: field(formData, "weight"),
    length: field(formData, "length"),
    width: field(formData, "width"),
    height: field(formData, "height"),
    shippingAll: field(formData, "shippingAll") === "on" ? "1" : "0",
    shippingCountries: list(formData, "shippingCountry"),
    options: field(formData, "optionsJson"),
    variants: field(formData, "variantsJson"),
    fileId: field(formData, "digitalFileId"),
    duration: field(formData, "duration"),
    location: field(formData, "serviceLocation"),
  };
}

/**
 * Options et matrice, validées avant tout enregistrement.
 *
 * Seul un produit physique en porte ; les autres types envoient des tableaux
 * vides et ne peuvent donc pas créer de variantes par accident.
 */
function readVariantDraft(
  type: ProductType,
  data: ReturnType<typeof readForm>,
):
  | { options: ProductOption[]; variants: VariantInput[] }
  | { error: string; field: string } {
  if (type !== "physical") return { options: [], variants: [] };

  const options = parseProductOptions(data.options);
  if ("error" in options) return { error: options.error, field: "optionsJson" };

  const variants = parseProductVariants(data.variants);
  if ("error" in variants) return { error: variants.error, field: "variantsJson" };

  const checked = checkVariantMatrix(options.options, variants.variants);
  if (checked.error) return { error: checked.error, field: "variantsJson" };

  return { options: options.options, variants: variants.variants };
}

/**
 * Convertit les prix saisis en unité mineure.
 *
 * Le client n'envoie qu'un texte : la conversion, l'héritage du prix du
 * produit et les arrondis restent côté serveur.
 */
function buildVariantPayload(
  variants: VariantInput[],
  productPrice: number,
  currency: string,
): { variants: VariantPayload[] } | { error: string } {
  const payload: VariantPayload[] = [];

  for (const [position, variant] of variants.entries()) {
    const inherited = variant.price === null || variant.price.trim() === "";
    const price = inherited ? productPrice : parsePrice(variant.price as string, currency);

    if (price === null) return { error: "productVariantPriceInvalid" };

    payload.push({
      id: variant.id,
      option_values: variant.option_values,
      price_amount: price,
      stock_quantity: Number(variant.stock),
      sku: variant.sku,
      barcode: variant.barcode,
      position,
    });
  }

  return { variants: payload };
}

function variantStockTotal(variants: VariantInput[]): string {
  return String(variants.reduce((total, variant) => total + Number(variant.stock), 0));
}

/**
 * Valide les prix. Renvoie une erreur de champ, ou les montants convertis.
 *
 * Le prix comparé, quand il existe, doit rester supérieur au prix de vente :
 * un prix « barré » plus bas n'aurait aucun sens.
 */
type PriceResult =
  | { ok: true; price: number; compareAt: number | null }
  | { ok: false; error: string };

function validatePrices(
  priceInput: string,
  compareInput: string,
  currency: string,
): PriceResult {
  const price = parsePrice(priceInput, currency);
  if (price === null) return { ok: false, error: "productPriceInvalid" };

  if (compareInput === "") return { ok: true, price, compareAt: null };

  const compareAt = parsePrice(compareInput, currency);
  if (compareAt === null) return { ok: false, error: "productCompareInvalid" };
  if (compareAt <= price) return { ok: false, error: "productCompareTooLow" };

  return { ok: true, price, compareAt };
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

  const raw = readForm(formData);
  const draft = readVariantDraft(type, raw);
  if ("error" in draft) {
    return { status: "invalid", fieldErrors: { [draft.field]: draft.error } };
  }

  // Avec variantes, le stock global est la somme : il est recalculé ici et
  // jamais repris du champ masqué.
  const stock = draft.options.length > 0 ? variantStockTotal(draft.variants) : raw.stock;

  const parsed = productSchemaFor(type).safeParse({ ...raw, stock });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const data = parsed.data as ParsedProduct;
  const prices = validatePrices(data.price, data.compareAtPrice, store.currency);
  if (!prices.ok) {
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

  const built = buildVariantPayload(draft.variants, prices.price, store.currency);
  if ("error" in built) {
    return { status: "invalid", fieldErrors: { variantsJson: built.error } };
  }

  const { error } = await supabase.rpc("create_product", {
    p_store_id: store.id,
    p_name: data.name,
    p_slug: data.slug,
    p_description: data.description,
    p_price_amount: prices.price,
    p_compare_at_amount: prices.compareAt,
    p_status: data.status,
    p_product_type: type,
    p_tags: normalizeTags(data.tags),
    p_video_url: data.videoUrl || null,
    p_image_ids: data.imageIds,
    p_options: draft.options,
    p_variants: built.variants,
    p_description_media_id: data.descriptionMediaId || null,
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
  const raw = readForm(formData);
  const draft = readVariantDraft(type, raw);
  if ("error" in draft) {
    return { status: "invalid", fieldErrors: { [draft.field]: draft.error } };
  }

  const stock = draft.options.length > 0 ? variantStockTotal(draft.variants) : raw.stock;

  const parsed = productSchemaFor(type).safeParse({ ...raw, stock });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  const data = parsed.data as ParsedProduct;
  const prices = validatePrices(data.price, data.compareAtPrice, store.currency);
  if (!prices.ok) {
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

  const built = buildVariantPayload(draft.variants, prices.price, store.currency);
  if ("error" in built) {
    return { status: "invalid", fieldErrors: { variantsJson: built.error } };
  }

  const { error } = await supabase.rpc("update_product", {
    p_product_id: existing.id,
    p_name: data.name,
    p_slug: data.slug,
    p_description: data.description,
    p_price_amount: prices.price,
    p_compare_at_amount: prices.compareAt,
    p_status: data.status,
    p_tags: normalizeTags(data.tags),
    p_video_url: data.videoUrl || null,
    p_image_ids: data.imageIds,
    p_options: draft.options,
    p_variants: built.variants,
    p_description_media_id: data.descriptionMediaId || null,
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

  const previousDescriptionId = existing.description_media_id;
  if (
    previousDescriptionId &&
    previousDescriptionId !== (data.descriptionMediaId || null)
  ) {
    await deleteMediaAsset(supabase, previousDescriptionId);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/products?updated=1`);
}

/** Bascule un produit entre brouillon et publié depuis la liste. */
export async function toggleProductStatusAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const productId = field(formData, "productId");

  if (!isSupabaseConfigured() || !productId) return;

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) redirect(`/${locale}/auth/login`);

  const product = await getProduct(productId, store.id);
  if (!product) return;

  const status = product.status === "published" ? "draft" : "published";

  await supabase
    .from("products")
    .update({
      status,
      published_at:
        status === "published"
          ? (product.published_at ?? new Date().toISOString())
          : product.published_at,
    })
    .eq("id", product.id)
    .eq("store_id", store.id);

  revalidatePath("/", "layout");
}

/**
 * Supprime un produit, ses variantes et ses médias.
 *
 * Le produit part d'abord (les variantes et la galerie tombent en cascade),
 * puis les objets du bucket sont retirés à partir des identifiants relevés
 * avant la suppression.
 */
export async function deleteProductAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const productId = field(formData, "productId");

  if (!isSupabaseConfigured() || !productId) return;

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) redirect(`/${locale}/auth/login`);

  const product = await getProduct(productId, store.id);
  if (!product) return;

  const mediaIds = product.images.map((image) => image.id);
  if (product.digital_file) mediaIds.push(product.digital_file.id);
  if (product.description_media_id) mediaIds.push(product.description_media_id);

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id)
    .eq("store_id", store.id);

  if (error) {
    // Un produit présent dans un paquet ne se supprime pas : le marchand doit
    // d'abord le retirer du paquet. La contrainte de clé étrangère le garantit.
    if (error.code === "23503") {
      redirect(`/${locale}/app/products?error=in_bundle`);
    }
    return;
  }

  for (const id of mediaIds) {
    await deleteMediaAsset(supabase, id);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/products?deleted=1`);
}
