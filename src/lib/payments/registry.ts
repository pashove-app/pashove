import { MockProvider } from "@/lib/payments/mock";
import { PlaceholderProvider } from "@/lib/payments/providers/placeholder";
import { PaymentProviderRouter, type RoutedProvider } from "@/lib/payments/router";
import { SasPayProvider } from "@/lib/payments/saspay/provider";
import { saspayConfigured } from "@/lib/payments/saspay/client";
import type { PaymentProvider } from "@/lib/payments/provider";
import type { PaymentProviderCode } from "@/lib/payments/types";

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

function fallbackConfigured(code: PaymentProviderCode): boolean {
  if (code === "paydunya") {
    return Boolean(
      process.env.PAYDUNYA_MASTER_KEY?.trim() &&
        process.env.PAYDUNYA_PRIVATE_KEY?.trim() &&
        process.env.PAYDUNYA_TOKEN?.trim(),
    );
  }

  if (code === "cinetpay") {
    return Boolean(
      process.env.CINETPAY_API_KEY?.trim() &&
        process.env.CINETPAY_SITE_ID?.trim(),
    );
  }

  if (code === "flutterwave") {
    return Boolean(process.env.FLUTTERWAVE_SECRET_KEY?.trim());
  }

  return false;
}

/**
 * Ordre des fournisseurs en ligne, modifiable sans redéploiement :
 * `PAYMENT_PROVIDER_ORDER=saspay,paydunya,cinetpay,flutterwave`.
 *
 * SasPay reste primaire. Un secours n'entre dans le routeur que si ses clés
 * sont présentes ; tant qu'il n'est pas implémenté, il répond 501 et laisse la
 * main au suivant.
 */
export function onlineProviderRouter(): PaymentProviderRouter {
  const primary = activeOnlineProvider();
  const entries: RoutedProvider[] = [
    { code: primary, provider: getPaymentProvider(primary) },
  ];

  if (primary === "saspay") {
    const configuredOrder = (process.env.PAYMENT_PROVIDER_ORDER ?? "")
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);

    const order =
      configuredOrder.length > 0
        ? configuredOrder
        : ["paydunya", "cinetpay", "flutterwave"];

    for (const raw of order) {
      if (
        raw === "paydunya" ||
        raw === "cinetpay" ||
        raw === "flutterwave"
      ) {
        if (fallbackConfigured(raw) && !entries.some((entry) => entry.code === raw)) {
          entries.push({ code: raw, provider: new PlaceholderProvider(raw) });
        }
      }
    }
  }

  return new PaymentProviderRouter(entries);
}
