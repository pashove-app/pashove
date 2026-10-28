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
  method: PaymentMethod;
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
