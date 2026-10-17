import { z } from "zod";
import { SUPPORTED_COUNTRY_CODES } from "@/lib/site-content";

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
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
}

/** Domaine public des boutiques, tant que le sous-domaine n'est pas branché. */
export const STORE_DOMAIN = "pashove.com";
