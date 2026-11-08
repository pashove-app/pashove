import type {
  PaymentConfirmation,
  PaymentIntent,
  PaymentMethod,
  PaymentProviderCode,
} from "@/lib/payments/types";

export type CreateIntentInput = {
  orderId: string;
  amount: number;
  currency: string;
  /** ISO 3166-1 alpha-2 du pays de la boutique. */
  country: string;
  method: PaymentMethod;
  /** Code réseau SasPay déjà résolu côté serveur (`orange_ml`). */
  network?: string;
  /** OTP pré-paiement exigé par certains réseaux (Orange CI/BF). */
  otp?: string;
  /** Frais ajoutés au client (ADD_ON) ou déduits du marchand (DEDUCTED). */
  feeChargeMode?: "ADD_ON" | "DEDUCTED";
  /** Clé stable par tentative de paiement (en-tête Idempotency-Key). */
  idempotencyKey: string;
  description?: string;
  /** Retour du client après une page de paiement hébergée. */
  returnUrl?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
};

export type WebhookResult = {
  orderToken: string;
  reference: string;
  status: "succeeded" | "failed";
};

/**
 * Contrat commun aux fournisseurs de paiement.
 *
 * Les implémentations réelles (Flutterwave, CinetPay, PayDunya) devront
 * respecter les mêmes trois étapes : création d'intention, confirmation,
 * webhook signé. Le checkout ne connaît jamais les détails du fournisseur.
 */
export interface PaymentProvider {
  code: PaymentProviderCode;
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  confirm(intent: PaymentIntent): Promise<PaymentConfirmation>;
  handleWebhook(payload: string, signature: string | null): Promise<WebhookResult>;
}
