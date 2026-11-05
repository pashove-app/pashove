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


/**
 * Champs du cadeau, validés seulement lorsque la case est cochée.
 * La date est une date civile (`AAAA-MM-JJ`) sans heure : le serveur la place
 * au début de la journée et `create_gift_claim` la ramène à maintenant si elle
 * est déjà passée.
 */
export const giftCheckoutSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(2, "giftNameInvalid")
    .max(120, "giftNameInvalid"),
  recipientEmail: z
    .string()
    .trim()
    .email("giftEmailInvalid")
    .max(254, "giftEmailInvalid"),
  message: z.string().trim().max(500, "giftMessageTooLong"),
  scheduledDate: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "giftDateInvalid",
    ),
});

export type GiftCheckoutInput = z.infer<typeof giftCheckoutSchema>;
