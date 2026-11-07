import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { activeOnlineProvider } from "@/lib/payments/registry";
import { codOption, fallbackOption, optionFromRate } from "@/lib/payments/catalog";
import { listPayinRates } from "@/lib/payments/saspay/client";
import {
  PAYOUT_COUNTRIES,
  providersForCountry,
  type PayoutCountry,
  type PayoutProvider,
} from "@/lib/finance/providers";
import type {
  AdminPaymentProvider,
  AdminPaymentTransaction,
  CheckoutPaymentOption,
  PaymentMethod,
} from "@/lib/payments/types";

export type CheckoutPaymentMethods = {
  planCode: string;
  currency: string;
  country: string;
  methods: PaymentMethod[];
  provider: "mock" | "saspay";
};

export type CheckoutOptions = {
  planCode: string;
  currency: string;
  country: string;
  provider: "mock" | "saspay";
  options: CheckoutPaymentOption[];
};

const KNOWN_METHODS: PaymentMethod[] = [
  "cod",
  "orange_money",
  "wave",
  "mtn_money",
  "moov_money",
  "mobile_money",
  "card",
];

/** Éligibilité calculée en base : plan, nature du panier, COD. */
export async function getCheckoutPaymentMethods(
  slug: string,
  hasNonPhysical: boolean,
  country?: string | null,
  currency?: string | null,
  total = 0,
): Promise<CheckoutPaymentMethods> {
  const supabase = createPublicClient();
  let { data } = await supabase.rpc("checkout_payment_methods", {
    p_slug: slug,
    p_has_non_physical: hasNonPhysical,
    p_country: country ?? null,
    p_currency: currency ?? null,
    p_total: Math.max(0, Math.round(total)),
  });

  // Déploiement du code avant la migration : on retombe sur l'ancienne
  // signature à quatre arguments au lieu de vider le checkout.
  if (data === null) {
    const legacy = await supabase.rpc("checkout_payment_methods", {
      p_slug: slug,
      p_has_non_physical: hasNonPhysical,
      p_country: country ?? null,
      p_currency: currency ?? null,
    });
    data = legacy.data;
  }

  const raw = (data ?? {}) as Partial<CheckoutPaymentMethods>;
  const methods = Array.isArray(raw.methods)
    ? raw.methods.filter((method): method is PaymentMethod =>
        KNOWN_METHODS.includes(method as PaymentMethod),
      )
    : [];

  return {
    planCode: typeof raw.planCode === "string" ? raw.planCode : "free",
    currency: typeof raw.currency === "string" ? raw.currency : "XOF",
    country: typeof raw.country === "string" ? raw.country : "",
    methods,
    provider: activeOnlineProvider(),
  };
}

/**
 * Seuls les réseaux connus du référentiel pays sont montrés quand SasPay n'est
 * pas joignable : MTN n'existe pas au Mali, Wave n'existe pas au Bénin, etc.
 */
function fallbackForCountry(methods: PaymentMethod[], country: string): PaymentMethod[] {
  const iso = country.trim().toUpperCase();
  const allowed = PAYOUT_COUNTRIES.includes(iso as PayoutCountry)
    ? providersForCountry(iso as PayoutCountry)
    : null;

  if (!allowed) return methods;

  const family: Partial<Record<PaymentMethod, PayoutProvider>> = {
    orange_money: "orange",
    wave: "wave",
    mtn_money: "mtn",
    moov_money: "moov",
  };

  return methods.filter((method) => {
    const provider = family[method];
    return provider ? allowed.includes(provider) : true;
  });
}

/**
 * Liste finale affichée au client.
 *
 * Les pays et les moyens sont **verrouillés** : la liste vient de SasPay
 * (`/pricing/my-rates/`, filtrée sur le pays de la boutique) ou, en repli, du
 * référentiel plateforme. Le marchand ne peut que personnaliser l'habillage.
 */
export async function getCheckoutOptions(
  slug: string,
  hasNonPhysical: boolean,
  country?: string | null,
  currency?: string | null,
  total = 0,
): Promise<CheckoutOptions> {
  const base = await getCheckoutPaymentMethods(
    slug,
    hasNonPhysical,
    country,
    currency,
    total,
  );

  const provider = base.provider;
  const onlineMethods = base.methods.filter((method) => method !== "cod");
  const options: CheckoutPaymentOption[] = [];

  if (onlineMethods.length > 0) {
    let rates = [] as Awaited<ReturnType<typeof listPayinRates>>;

    if (provider === "saspay") {
      try {
        rates = await listPayinRates();
      } catch (error) {
        console.error("[saspay] rates unavailable, fallback catalogue", error);
      }
    }

    const iso = (base.country || country || "").trim().toUpperCase();
    const countryRates = rates.filter(
      (rate) =>
        rate.country_code?.trim().toUpperCase() === iso &&
        rate.payin?.available !== false,
    );

    if (countryRates.length > 0) {
      const seen = new Set<string>();
      for (const rate of countryRates) {
        if (!rate.network_code || seen.has(rate.network_code)) continue;
        seen.add(rate.network_code);
        options.push(optionFromRate(rate, provider));
      }
    } else {
      for (const method of fallbackForCountry(onlineMethods, iso)) {
        options.push(fallbackOption(method, provider));
      }
    }
  }

  if (base.methods.includes("cod")) {
    options.push(codOption());
  }

  return {
    planCode: base.planCode,
    currency: base.currency,
    country: base.country,
    provider,
    options,
  };
}

export async function adminPaymentTransactions(): Promise<AdminPaymentTransaction[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_payment_transactions");
  return (data ?? []) as AdminPaymentTransaction[];
}

export async function adminPaymentProviders(): Promise<AdminPaymentProvider[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_payment_providers");
  return (data ?? []) as AdminPaymentProvider[];
}
