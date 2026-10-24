import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Une ligne du paquet : `productId:variantId` (`variantId` vide si le produit
 * n'a pas de variante). Un seul champ caché par article, dans l'ordre affiché.
 */
const ITEM_PATTERN = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$`,
  "i",
);

export const bundleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "bundleNameInvalid")
    .max(120, "bundleNameInvalid"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "bundleSlugInvalid")
    .max(60, "bundleSlugInvalid")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "bundleSlugInvalid"),
  description: z.string().trim().max(1000, "bundleDescriptionTooLong"),
  status: z.enum(["draft", "published"], {
    message: "bundleStatusInvalid",
  }),
  imageMediaId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "bundleMediaInvalid",
    ),
  price: z.string().trim().min(1, "bundlePriceInvalid"),
  items: z
    .array(z.string().regex(ITEM_PATTERN, "bundleItemsInvalid"))
    .min(2, "bundleItemsCount")
    .max(3, "bundleItemsCount"),
});

export type BundleInput = z.infer<typeof bundleSchema>;

/** Transforme les clés `produit:variante` en lignes pour la RPC. */
export function toRpcItems(
  items: string[],
): { product_id: string; variant_id: string | null }[] {
  return items.map((item) => {
    const [productId, variantId] = item.split(":");
    return { product_id: productId, variant_id: variantId || null };
  });
}
