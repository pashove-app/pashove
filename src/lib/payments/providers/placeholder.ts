import { PaymentProviderError } from "@/lib/payments/router";
import type {
  CreateIntentInput,
  PaymentProvider,
  WebhookResult,
} from "@/lib/payments/provider";
import type {
  PaymentConfirmation,
  PaymentIntent,
  PaymentProviderCode,
} from "@/lib/payments/types";

/**
 * Fournisseur de secours déclaré mais pas encore implémenté.
 *
 * Il n'est instancié que si ses clés existent. Toute méthode répond 501 afin
 * que le routeur essaie le fournisseur suivant, sans jamais confirmer un
 * paiement fictif.
 */
export class PlaceholderProvider implements PaymentProvider {
  readonly code: PaymentProviderCode;

  constructor(code: PaymentProviderCode) {
    this.code = code;
  }

  private disabled(): never {
    throw new PaymentProviderError(
      "provider_not_implemented",
      501,
      `${this.code} is not implemented yet`,
    );
  }

  async createIntent(_input: CreateIntentInput): Promise<PaymentIntent> {
    return this.disabled();
  }

  async confirm(_intent: PaymentIntent): Promise<PaymentConfirmation> {
    return this.disabled();
  }

  async handleWebhook(
    _payload: string,
    _signature: string | null,
  ): Promise<WebhookResult> {
    return this.disabled();
  }
}
