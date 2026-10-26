import { z } from "zod";

/**
 * Formulaire de commande.
 *
 * L'adresse n'est exigée que lorsqu'un objet physique doit être livré. Un
 * panier composé uniquement de produits numériques ou de services n'a pas de
 * livraison : on ne demande ni ville, ni adresse.
 */
export function buildCheckoutSchema(requiresShipping: boolean) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, "checkoutNameInvalid")
      .max(120, "checkoutNameInvalid"),
    email: z
      .string()
      .trim()
      .email("checkoutEmailInvalid")
      .max(254, "checkoutEmailInvalid"),
    phone: z
      .string()
      .trim()
      .min(6, "checkoutPhoneInvalid")
      .max(40, "checkoutPhoneInvalid"),
    country: requiresShipping
      ? z
          .string()
          .trim()
          .length(2, "checkoutCountryInvalid")
          .transform((v) => v.toUpperCase())
      : z
          .string()
          .trim()
          .transform((v) => (v ? v.toUpperCase() : "FR")),
    city: requiresShipping
      ? z
          .string()
          .trim()
          .min(2, "checkoutCityInvalid")
          .max(100, "checkoutCityInvalid")
      : z.string().trim().max(100).default(""),
    address: requiresShipping
      ? z
          .string()
          .trim()
          .min(5, "checkoutAddressInvalid")
          .max(200, "checkoutAddressInvalid")
      : z.string().trim().max(200).default(""),
    extra: z.string().trim().max(200, "checkoutAddressInvalid"),
    notes: z.string().trim().max(500, "checkoutNotesTooLong"),
  });
}

export type CheckoutInput = z.infer<
  ReturnType<typeof buildCheckoutSchema>
>;
