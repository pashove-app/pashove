import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const collectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "collectionNameInvalid")
    .max(80, "collectionNameInvalid"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "collectionSlugInvalid")
    .max(60, "collectionSlugInvalid")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "collectionSlugInvalid"),
  description: z.string().trim().max(500, "collectionDescriptionTooLong"),
  status: z.enum(["draft", "published"], {
    message: "collectionStatusInvalid",
  }),
  imageMediaId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "collectionMediaInvalid",
    ),
  productIds: z
    .array(z.string().regex(UUID_PATTERN, "collectionProductsInvalid"))
    .max(200, "collectionProductsInvalid"),
});

export type CollectionInput = z.infer<typeof collectionSchema>;
