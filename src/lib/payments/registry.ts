import { MockProvider } from "@/lib/payments/mock";
import type { PaymentProvider } from "@/lib/payments/provider";

const providers: Record<string, PaymentProvider> = {
  mock: new MockProvider(),
};

export function getPaymentProvider(code: string): PaymentProvider {
  const provider = providers[code];
  if (!provider) throw new Error("provider_not_configured");
  return provider;
}
