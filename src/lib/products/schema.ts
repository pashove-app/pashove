import { z } from "zod";
import { SUPPORTED_COUNTRY_CODES } from "@/lib/site-content";

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

const compareAtInput = z
  .string()
  .trim()
  .regex(/^\d{1,7}(?:[.,]\d{1,2})?$/, "productCompareInvalid")
  .or(z.literal(""));

const optionalInteger = (key: string) =>
  z.string().trim().regex(/^\d{1,7}$/, key).or(z.literal(""));

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
  imageIds: z
    .array(z.string().regex(UUID_PATTERN, "productImageRequired"))
    .min(1, "productImageRequired")
    .max(4, "productImageLimit"),
  descriptionMediaId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "productMediaInvalid",
    ),
  compareAtPrice: compareAtInput,
};

export const physicalProductSchema = z.object({
  ...common,
  stock: integerInput("productStockInvalid"),
  weight: integerInput("productWeightInvalid"),
  length: optionalInteger("productDimensionsInvalid"),
  width: optionalInteger("productDimensionsInvalid"),
  height: optionalInteger("productDimensionsInvalid"),
  shippingAll: z.enum(["1", "0"], { message: "productCountriesRequired" }),
  shippingCountries: z
    .array(
      z.enum(SUPPORTED_COUNTRY_CODES as [string, ...string[]], {
        message: "productCountriesInvalid",
      }),
    )
    .max(20, "productCountriesInvalid"),
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

/* ------------------------------------------------------------------ *
 *  Variantes
 *
 *  Le client envoie les options et la matrice en JSON. Tout est revalidé
 *  ici — structure, limites, cohérence — puis à nouveau en base.
 * ------------------------------------------------------------------ */

export const MAX_PRODUCT_OPTIONS = 3;
export const MAX_PRODUCT_VARIANTS = 100;

export type ProductOption = { name: string; values: string[] };

export type VariantInput = {
  /** Identifiant existant ; null pour une nouvelle combinaison. */
  id: string | null;
  option_values: Record<string, string>;
  /** Unité majeure ; null ou vide = prix hérité du produit. */
  price: string | null;
  stock: string;
  sku: string;
  barcode: string;
};

export type VariantPayload = {
  id: string | null;
  option_values: Record<string, string>;
  price_amount: number;
  stock_quantity: number;
  sku: string;
  barcode: string;
  position: number;
};

const OPTION_LIMIT = "productOptionsInvalid";
const VARIANT_LIMIT = "productVariantsInvalid";

const optionSchema = z.object({
  name: z.string().trim().min(1, OPTION_LIMIT).max(30, OPTION_LIMIT),
  values: z
    .array(z.string().trim().min(1, OPTION_LIMIT).max(30, OPTION_LIMIT))
    .min(1, OPTION_LIMIT)
    .max(20, OPTION_LIMIT),
});

const optionsSchema = z
  .array(optionSchema)
  .max(MAX_PRODUCT_OPTIONS, "productOptionsTooMany")
  .superRefine((options, ctx) => {
    const names = options.map((option) => option.name.toLocaleLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: "custom", message: "productOptionDuplicate" });
    }
    for (const option of options) {
      const values = option.values.map((value) => value.toLocaleLowerCase());
      if (new Set(values).size !== values.length) {
        ctx.addIssue({ code: "custom", message: "productOptionDuplicate" });
      }
    }
  });

const variantPricePattern = /^\d{1,7}(?:[.,]\d{1,2})?$/;

const variantSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(UUID_PATTERN, VARIANT_LIMIT)
    .nullish()
    .transform((value) => value ?? null),
  option_values: z.record(z.string(), z.string().trim().max(30, VARIANT_LIMIT)),
  price: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || variantPricePattern.test(value),
      "productVariantPriceInvalid",
    )
    .nullable(),
  stock: z.string().trim().regex(/^\d{1,7}$/, "productVariantStockInvalid"),
  sku: z.string().trim().max(64, VARIANT_LIMIT),
  barcode: z.string().trim().max(64, VARIANT_LIMIT),
});

const variantsSchema = z
  .array(variantSchema)
  .max(MAX_PRODUCT_VARIANTS, "productVariantsTooMany");

function jsonArray(raw: string): unknown {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return null;
  }
}

export function parseProductOptions(
  raw: string,
): { options: ProductOption[] } | { error: string } {
  const value = jsonArray(raw);
  if (value === null) return { error: OPTION_LIMIT };

  const parsed = optionsSchema.safeParse(value);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? OPTION_LIMIT };
  }

  return { options: parsed.data };
}

export function parseProductVariants(
  raw: string,
): { variants: VariantInput[] } | { error: string } {
  const value = jsonArray(raw);
  if (value === null) return { error: VARIANT_LIMIT };

  const parsed = variantsSchema.safeParse(value);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? VARIANT_LIMIT };
  }

  return { variants: parsed.data };
}

/** Chaque variante porte exactement les options du produit, sans doublon. */
export function checkVariantMatrix(
  options: ProductOption[],
  variants: VariantInput[],
): { error?: string } {
  if (options.length === 0) {
    return variants.length === 0 ? {} : { error: VARIANT_LIMIT };
  }

  if (variants.length === 0) return { error: "productVariantsRequired" };

  const names = options.map((option) => option.name);
  const expected = [...names].sort();
  const seen = new Set<string>();

  for (const variant of variants) {
    const keys = Object.keys(variant.option_values).sort();
    if (keys.length !== expected.length || keys.some((key, i) => key !== expected[i])) {
      return { error: VARIANT_LIMIT };
    }

    const combination = names.map((name) => {
      const value = variant.option_values[name];
      const allowed = options.find((option) => option.name === name)?.values ?? [];
      return allowed.includes(value) ? value : null;
    });

    if (combination.some((value) => value === null)) return { error: VARIANT_LIMIT };

    const signature = JSON.stringify(combination);
    if (seen.has(signature)) return { error: VARIANT_LIMIT };
    seen.add(signature);
  }

  return {};
}

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
