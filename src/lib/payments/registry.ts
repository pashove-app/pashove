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
  if (saspayConfigured()) return "saspay";

  // En production, on ne bascule jamais silencieusement sur le Mock : une
  // commande ne doit pas être marquée payée sans argent. Le checkout échoue
  // proprement et la compensation replace le stock et le panier.
  if (process.env.NODE_ENV === "production") return "saspay";

  return "mock";
}
