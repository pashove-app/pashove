import { z } from "zod";

/**
 * Règles du produit, partagées par le formulaire et les Server Actions.
 *
 * Le prix est saisi en unité majeure (« 15000 », « 19.99 ») puis converti en
 * unité mineure côté serveur. Les champs propres au type ne sont validés que
 * pour ce type : un service n'a pas de stock, un physique n'a pas de fichier.
 */

export const PRODUCT_TYPES = ["physical", "digital", "service"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export function isProductType(value: unknown): value is ProductType {
  return (
    typeof value === "string" &&
    (PRODUCT_TYPES as readonly string[]).includes(value)
  );
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const requiredMediaId = (key: string) =>
  z.string().trim().refine((value) => UUID_PATTERN.test(value), key);

const priceInput = z
  .string()
  .trim()
  .min(1, "productPriceRequired")
  .regex(/^\d{1,7}(?:[.,]\d{1,2})?$/, "productPriceInvalid");

const videoInput = z
  .string()
  .trim()
  .max(500, "productVideoInvalid")
  .refine(
    (value) => value === "" || /^https:\/\/\S+$/i.test(value),
    "productVideoInvalid",
  );

const tagsInput = z.string().trim().max(300, "productTagsTooLong");

const integerInput = (key: string) =>
  z.string().trim().min(1, key).regex(/^\d{1,7}$/, key);

const common = {
  name: z
    .string()
    .trim()
    .min(2, "productNameRequired")
    .max(120, "productNameRequired"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "productSlugInvalid")
    .max(60, "productSlugInvalid")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "productSlugInvalid"),
  description: z.string().trim().max(5000, "productDescriptionTooLong"),
  price: priceInput,
  status: z.enum(["draft", "published"], { message: "productStatusInvalid" }),
  tags: tagsInput,
  videoUrl: videoInput,
  imageId: requiredMediaId("productImageRequired"),
};

export const physicalProductSchema = z.object({
  ...common,
  stock: integerInput("productStockInvalid"),
  weight: integerInput("productWeightInvalid"),
});

export const digitalProductSchema = z.object({
  ...common,
  fileId: requiredMediaId("productFileRequired"),
});

export const serviceProductSchema = z.object({
  ...common,
  duration: z.enum(["15", "30", "45", "60", "90", "120", "180", "240"], {
    message: "productDurationInvalid",
  }),
  location: z.enum(["online", "in_person"], {
    message: "productLocationInvalid",
  }),
});

export function productSchemaFor(type: ProductType) {
  if (type === "physical") return physicalProductSchema;
  if (type === "digital") return digitalProductSchema;
  return serviceProductSchema;
}

/**
 * Convertit un prix saisi en unité mineure de la devise.
 *
 * XOF n'a pas de sous-unité : « 1500,50 » doit être refusé, pas arrondi en
 * silence. EUR et USD ont deux décimales.
 */
export function parsePrice(value: string, currency: string): number | null {
  const normalized = value.trim().replace(",", ".");

  if (currency === "XOF") {
    if (!/^\d{1,7}$/.test(normalized)) return null;
    return Number(normalized);
  }

  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Réaffiche un prix stocké en unité mineure dans le formulaire. */
export function formatPriceInput(amount: number, currency: string): string {
  if (currency === "XOF") return String(amount);
  return (amount / 100).toFixed(2);
}

/** Étiquettes : minuscules, sans doublon, 24 caractères maximum chacune. */
export function normalizeTags(raw: string): string[] {
  const tags = raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .map((tag) => tag.slice(0, 24));

  return Array.from(new Set(tags)).slice(0, 10);
}
