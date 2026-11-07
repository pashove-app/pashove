import { z } from "zod";

/**
 * Moyen de paiement choisi au checkout.
 *
 * `paymentNetwork` est le code réseau SasPay (`orange_ml`, `card`, `cod`…) ou
 * une famille de repli. Il n'est jamais fait confiance : l'action serveur le
 * résout à nouveau contre le catalogue verrouillé avant toute écriture.
 */
export const paymentSchema = z.object({
  paymentNetwork: z
    .string()
    .trim()
    .min(1, "checkoutPaymentInvalid")
    .max(40, "checkoutPaymentInvalid"),
  paymentPhone: z.string().trim().max(40).optional().default(""),
  paymentOtp: z.string().trim().max(10).optional().default(""),
  cardNumber: z.string().trim().max(30).optional().default(""),
  cardExpiry: z.string().trim().max(10).optional().default(""),
  cardCvv: z.string().trim().max(4).optional().default(""),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
