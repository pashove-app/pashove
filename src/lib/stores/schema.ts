import { z } from "zod";
import { SUPPORTED_COUNTRY_CODES } from "@/lib/site-content";
import { slugify as sharedSlugify } from "@/lib/slug";

/**
 * Règles de la boutique, partagées par le formulaire et la Server Action.
 *
 * Comme pour l'authentification, les messages de Zod sont des **clés** résolues
 * dans le dictionnaire de la langue active : le serveur ne connaît pas la langue
 * du marchand, et une seule règle doit tenir dans les cinq.
 *
 * Ces règles doublent volontairement les contraintes posées en base : le
 * formulaire donne une erreur lisible, la base reste le dernier rempart.
 */

/**
 * Identifiants déjà pris par un service de la plateforme.
 *
 * Le jour où le sous-domaine `slug.pashove.com` sera branché, un marchand qui
 * s'emparerait de `admin` ou `api` deviendrait un problème d'infrastructure, pas
 * seulement de nommage.
 */
const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "auth", "account", "accounts", "dashboard",
  "mail", "smtp", "cdn", "static", "assets", "img", "files", "blog", "help",
  "docs", "status", "store", "shop", "pashove", "support", "partners", "partner",
  "checkout", "onboarding", "legal", "billing", "pay", "payments", "test", "dev",
  "staging", "preview",
]);

/** Devise d'affichage de la boutique. Le FCFA d'abord : c'est la zone visée. */
export const CURRENCIES = ["XOF", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const createStoreSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "storeNameRequired")
    .max(80, "storeNameTooLong"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "slugShort")
    .max(30, "slugLong")
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/, "slugInvalid")
    .refine((value) => !RESERVED_SLUGS.has(value), "slugReserved"),
  country: z.enum(SUPPORTED_COUNTRY_CODES as [string, ...string[]], {
    message: "countryInvalid",
  }),
  currency: z.enum(CURRENCIES, { message: "currencyInvalid" }),
});

export type CreateStoreValues = z.infer<typeof createStoreSchema>;

/* ------------------------------------------------------------------ *
 *  Étape 3 — ce que la boutique vend
 * ------------------------------------------------------------------ */

export const PRODUCT_TYPES = ["physical", "digital", "service"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Au moins un type de vente, et seulement les trois connus. */
export const sellingSchema = z.object({
  productTypes: z
    .array(z.enum(PRODUCT_TYPES, { message: "productTypesRequired" }))
    .min(1, "productTypesRequired"),
});

/* ------------------------------------------------------------------ *
 *  Réglages de la vitrine
 * ------------------------------------------------------------------ */

/**
 * Identifiant d'un média déjà téléversé, ou chaîne vide pour « aucun ».
 *
 * Le formulaire ne transmet plus d'adresse d'image : seulement la référence
 * d'une ligne `media_assets`, créée par la route d'envoi après vérification de
 * l'objet dans le bucket.
 */
const optionalMediaId = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
    "mediaInvalid",
  );

export const storeSettingsSchema = z.object({
  description: z.string().trim().max(500, "descriptionTooLong"),
  contactEmail: z
    .string()
    .trim()
    .max(254, "contactEmailInvalid")
    .refine(
      (value) => value === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value),
      "contactEmailInvalid",
    ),
  contactPhone: z
    .string()
    .trim()
    .max(24, "contactPhoneInvalid")
    .refine((value) => value === "" || value.length >= 6, "contactPhoneInvalid"),
  logoMediaId: optionalMediaId,
  bannerMediaId: optionalMediaId,
  shippingFlat: z
    .string()
    .trim()
    .regex(/^\d{1,7}(?:[.,]\d{1,2})?$/, "shippingInvalid")
    .or(z.literal("")),
  codEnabled: z.enum(["1", "0"], { message: "serverError" }),
});

/** Nombre maximal de caractères de l'identifiant, repris par le formulaire. */
export const SLUG_MAX = 30;

/**
 * Déduit un identifiant lisible d'un nom de boutique.
 *
 * Les accents sont dépliés (`Maison Kora` → `maison-kora`) plutôt que
 * remplacés par des tirets : un identifiant reste une adresse, elle doit se
 * dicter au téléphone sans hésitation.
 */
export function slugify(value: string): string {
  return sharedSlugify(value, SLUG_MAX);
}

/** Domaine public des boutiques, tant que le sous-domaine n'est pas branché. */
export const STORE_DOMAIN = "pashove.com";
