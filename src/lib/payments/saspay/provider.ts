import type {
  PaymentConfirmation,
  PaymentIntent,
} from "@/lib/payments/types";
import type {
  CreateIntentInput,
  PaymentProvider,
  WebhookResult,
} from "@/lib/payments/provider";
import {
  createSoftpay,
  resolveNetwork,
  SasPayError,
  verifyPayment,
} from "@/lib/payments/saspay/client";

/** « Awa Sossou » → { first_name: "Awa", last_name: "Sossou" }. */
function splitName(name: string): { first_name: string; last_name: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "Client", last_name: "Pashove" };
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

/**
 * SasPay exige un numéro au format international. Le checkout ne connaît pas
 * l'indicatif du pays : on ajoute le « + » s'il manque et on laisse SasPay
 * valider. Un numéro déjà préfixé est transmis tel quel.
 */
function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export class SasPayProvider implements PaymentProvider {
  readonly code = "saspay" as const;

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const network = await resolveNetwork(input.method, input.country);

    const payment = await createSoftpay({
      amount: input.amount,
      currency: input.currency,
      country: input.country.trim().toUpperCase(),
      network,
      description: input.description,
      customer: {
        email: input.customer.email,
        ...splitName(input.customer.name),
        phone: normalizePhone(input.customer.phone),
      },
      metadata: { order_id: input.orderId },
      returnUrl: input.returnUrl,
      idempotencyKey: input.idempotencyKey,
    });

    return {
      reference: payment.id,
      provider: "saspay",
      method: input.method,
      amount: input.amount,
      currency: input.currency,
      orderId: input.orderId,
      status: "pending",
      redirectUrl: payment.checkout_url?.trim() ? payment.checkout_url : null,
      networkCode: network,
    };
  }

  /**
   * SasPay ne se confirme pas de façon synchrone : le statut définitif arrive
   * par webhook. Cette méthode sert uniquement aux vérifications explicites.
   */
  async confirm(intent: PaymentIntent): Promise<PaymentConfirmation> {
    const payment = await verifyPayment(intent.reference);

    if (payment.status === "SUCCESS") {
      return { status: "succeeded", reference: intent.reference };
    }

    if (payment.status === "FAILED" || payment.status === "CANCELLED") {
      return {
        status: "failed",
        reference: intent.reference,
        failureReason: payment.status,
      };
    }

    throw new SasPayError("payment_pending", 409, "Paiement encore en attente");
  }

  async handleWebhook(): Promise<WebhookResult> {
    // La signature SasPay porte sur un horodatage en en-tête : la vérification
    // vit dans la route, qui a accès à la requête complète.
    throw new SasPayError(
      "webhook_route_only",
      500,
      "Le webhook SasPay est traité par /api/payments/webhook/saspay",
    );
  }
}
