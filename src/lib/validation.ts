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

/** Une seule règle d'adresse pour toute la plateforme. */
const emailField = z
  .string()
  .trim()
  .min(1, "emailRequired")
  .email("emailInvalid")
  .max(254, "emailInvalid");

/** Une seule règle de mot de passe : inscription, réinitialisation, changement. */
const passwordField = z
  .string()
  .min(1, "passwordRequired")
  .min(8, "passwordShort")
  .max(128, "passwordShort");

/** Un code à six chiffres, celui d'une application d'authentification ou d'un e-mail. */
const sixDigitCode = (requiredKey: string, invalidKey: string) =>
  z
    .string()
    .trim()
    .min(1, requiredKey)
    .regex(/^\d{6}$/, invalidKey);

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "passwordRequired"),
});

/**
 * Inscription volontairement courte : nom, adresse, mot de passe.
 *
 * Le nom de boutique, le pays et le téléphone sont demandés dans l'onboarding,
 * une fois le compte créé — les poser ici aussi ferait remplir deux fois la même
 * chose, et découragerait avant la première vente.
 */
export const registerSchema = z.object({
  fullName: trimmed(2, 120, "nameRequired"),
  email: emailField,
  password: passwordField,
  consent: z.literal(true, { message: "consentRequired" }),
});

/** Une adresse, rien d'autre : demande de réinitialisation, renvoi de code. */
export const emailOnlySchema = z.object({ email: emailField });

/** Deux champs, une seule règle : le second doit confirmer le premier. */
export const resetPasswordSchema = z
  .object({ password: passwordField, confirm: z.string().min(1, "passwordRequired") })
  .refine((values) => values.password === values.confirm, {
    message: "passwordMismatch",
    path: ["confirm"],
  });

/** Code à six chiffres d'une application d'authentification (TOTP). */
export const totpCodeSchema = z.object({
  code: sixDigitCode("totpRequired", "totpInvalid"),
});

/** Code de confirmation d'adresse, envoyé par e-mail à l'inscription. */
export const verifyEmailSchema = z.object({
  email: emailField,
  code: sixDigitCode("emailCodeRequired", "emailCodeInvalid"),
});

/**
 * Changement de mot de passe depuis les paramètres de sécurité.
 *
 * L'ancien mot de passe est exigé : c'est ce qui distingue ce formulaire de la
 * réinitialisation par lien, où l'utilisateur ne le connaît plus par définition.
 */
export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "currentPasswordRequired"),
    password: passwordField,
    confirm: z.string().min(1, "passwordRequired"),
  })
  .refine((values) => values.password === values.confirm, {
    message: "passwordMismatch",
    path: ["confirm"],
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
