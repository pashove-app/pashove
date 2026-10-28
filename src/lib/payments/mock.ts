import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PaymentProvider, CreateIntentInput, WebhookResult } from "@/lib/payments/provider";
import type { PaymentConfirmation, PaymentIntent } from "@/lib/payments/types";

const MOCK_LATENCY_MS = 2000;

function webhookSecret(): string {
  return process.env.MOCK_WEBHOOK_SECRET || "mock_dev_secret";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fournisseur de démonstration.
 *
 * Il simule la latence et le succès d'un PSP, mais il ne décide jamais du
 * montant : le montant affiché par l'intention vient de la commande calculée
 * côté serveur. Le jour du passage à Flutterwave, seule l'implémentation
 * change ; le checkout et le ledger restent identiques.
 */
export class MockProvider implements PaymentProvider {
  readonly code = "mock" as const;

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    return {
      reference: `mock_${randomUUID()}`,
      provider: "mock",
      method: input.method,
      amount: input.amount,
      currency: input.currency,
      orderId: input.orderId,
      status: "requires_action",
    };
  }

  async confirm(intent: PaymentIntent): Promise<PaymentConfirmation> {
    await sleep(MOCK_LATENCY_MS);

    return {
      status: "succeeded",
      reference: intent.reference,
    };
  }

  async handleWebhook(payload: string, signature: string | null): Promise<WebhookResult> {
    if (!signature) throw new Error("missing_signature");

    const expected = createHmac("sha256", webhookSecret()).update(payload).digest("hex");
    const received = signature.replace(/^sha256=/, "");
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new Error("invalid_signature");
    }

    const body = JSON.parse(payload) as {
      orderToken?: unknown;
      reference?: unknown;
      status?: unknown;
    };

    if (
      typeof body.orderToken !== "string" ||
      typeof body.reference !== "string" ||
      (body.status !== "succeeded" && body.status !== "failed")
    ) {
      throw new Error("invalid_payload");
    }

    return {
      orderToken: body.orderToken,
      reference: body.reference,
      status: body.status,
    };
  }
}

export function verifyMockSignature(payload: string, signature: string | null): boolean {
  try {
    if (!signature) return false;
    const expected = createHmac("sha256", webhookSecret()).update(payload).digest("hex");
    const received = signature.replace(/^sha256=/, "");
    return (
      expected.length === received.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(received))
    );
  } catch {
    return false;
  }
}
