import { z } from "zod";

/**
 * Schémas de validation des formulaires d'authentification.
 *
 * Les messages de Zod sont des **clés** (par exemple `"emailInvalid"`), pas du
 * texte : le formulaire les résout dans le dictionnaire de la langue active.
 * Un seul jeu de règles, cinq langues, et les mêmes règles réutilisables côté
 * serveur le jour où les Server Actions seront branchées.
 */

const trimmed = (min: number, max: number, key: string) =>
  z.string().trim().min(min, key).max(max, key);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "emailRequired")
    .email("emailInvalid")
    .max(254, "emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
});

export const registerSchema = z.object({
  fullName: trimmed(2, 120, "nameRequired"),
  storeName: trimmed(2, 80, "storeRequired"),
  email: z
    .string()
    .trim()
    .min(1, "emailRequired")
    .email("emailInvalid")
    .max(254, "emailInvalid"),
  password: z.string().min(1, "passwordRequired").min(8, "passwordShort").max(128, "passwordShort"),
  phone: z.string().trim().min(6, "phoneRequired").max(24, "phoneRequired"),
  country: z.string().trim().min(2, "countryRequired"),
  referral: z.string().trim().max(24).optional(),
  consent: z.literal(true, { message: "consentRequired" }),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;

/** Une clé par champ fautif, prête à afficher sous l'input concerné. */
export type FieldErrors<T> = Partial<Record<keyof T | "consent", string>>;

/**
 * Transforme la sortie de Zod en `{ champ: cléDeMessage }`.
 * Le premier problème rencontré par champ gagne — c'est celui que l'utilisateur
 * doit corriger d'abord.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    if (!(field in errors)) errors[field] = issue.message;
  }

  return errors;
}
