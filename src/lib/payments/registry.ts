import { MockProvider } from "@/lib/payments/mock";
import { SasPayProvider } from "@/lib/payments/saspay/provider";
import { saspayConfigured } from "@/lib/payments/saspay/client";
import type { PaymentProvider } from "@/lib/payments/provider";

const providers: Record<string, PaymentProvider> = {
  mock: new MockProvider(),
  saspay: new SasPayProvider(),
};

export function getPaymentProvider(code: string): PaymentProvider {
  const provider = providers[code];
  if (!provider) throw new Error("provider_not_configured");
  return provider;
}

/**
 * Fournisseur réel dès qu'une clé SasPay est configurée, sinon Mock.
 * Le passage se fait par variable d'environnement, sans redéploiement de code.
 */
export function activeOnlineProvider(): "saspay" | "mock" {
  return saspayConfigured() ? "saspay" : "mock";
}
