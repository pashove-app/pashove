import { z } from "zod";

/**
 * Règles du produit, partagées par le formulaire et la Server Action.
 *
 * Le prix est saisi en unité majeure (« 15000 », « 19.99 ») puis converti en
 * unité mineure côté serveur : le franc n'a pas de sous-unité, l'euro en a
 * deux. Aucun flottant n'est stocké.
 */

const optionalMediaId = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
    "productImageInvalid",
  );

const priceInput = z
  .string()
  .trim()
  .min(1, "productPriceRequired")
  .regex(/^\d{1,7}(?:[.,]\d{1,2})?$/, "productPriceInvalid");

export const productSchema = z.object({
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
  mediaId: optionalMediaId,
});

export type ProductValues = z.infer<typeof productSchema>;

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
