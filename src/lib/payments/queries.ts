import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { activeOnlineProvider } from "@/lib/payments/registry";
import { getPublicStoreMarkets } from "@/lib/markets/queries";
import {
  codOption,
  fallbackOption,
  isGatewayNetwork,
  optionFromRate,
} from "@/lib/payments/catalog";
import { listPayinRates } from "@/lib/payments/saspay/client";
import { convertMinor } from "@/lib/fx/rates";
import { formatMinor } from "@/lib/fx/currency";
import {
  PAYOUT_COUNTRIES,
  providersForCountry,
  type PayoutCountry,
  type PayoutProvider,
} from "@/lib/finance/providers";
import type {
  AdminPaymentProvider,
  AdminPaymentTransaction,
  CheckoutMarket,
  CheckoutPaymentOption,
  PaymentMethod,
} from "@/lib/payments/types";

export type CheckoutPaymentMethods = {
  planCode: string;
  currency: string;
  country: string;
  methods: PaymentMethod[];
  provider: "mock" | "saspay";
  feeIncluded: boolean;
  feeChargeMode: "client" | "merchant";
};

export type CheckoutOptions = {
  planCode: string;
  currency: string;
  country: string;
  provider: "mock" | "saspay";
  markets: CheckoutMarket[];
  defaultMarket: string;
  minimumOnline: number;
  minimumCard: number;
  feeIncluded: boolean;
  feeChargeMode: "client" | "merchant";
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
  hasPhysical = true,
): Promise<CheckoutPaymentMethods> {
  const supabase = createPublicClient();
  let { data } = await supabase.rpc("checkout_payment_methods", {
    p_slug: slug,
    p_has_non_physical: hasNonPhysical,
    p_country: country ?? null,
    p_currency: currency ?? null,
    p_total: Math.max(0, Math.round(total)),
    p_has_physical: hasPhysical,
  });

  // Déploiement du code avant la migration : on retombe sur les signatures
  // précédentes au lieu de vider le checkout.
  if (data === null) {
    const v5 = await supabase.rpc("checkout_payment_methods", {
      p_slug: slug,
      p_has_non_physical: hasNonPhysical,
      p_country: country ?? null,
      p_currency: currency ?? null,
      p_total: Math.max(0, Math.round(total)),
    });
    data = v5.data;
  }

  if (data === null) {
    const v4 = await supabase.rpc("checkout_payment_methods", {
      p_slug: slug,
      p_has_non_physical: hasNonPhysical,
      p_country: country ?? null,
      p_currency: currency ?? null,
    });
    data = v4.data;
  }

  const raw = (data ?? {}) as Partial<CheckoutPaymentMethods>;
  const methods = Array.isArray(raw.methods)
    ? raw.methods.filter((method): method is PaymentMethod =>
        KNOWN_METHODS.includes(method as PaymentMethod),
      )
    : [];

  const planCode = typeof raw.planCode === "string" ? raw.planCode : "free";

  return {
    planCode,
    currency: typeof raw.currency === "string" ? raw.currency : "XOF",
    country: typeof raw.country === "string" ? raw.country : "",
    methods,
    provider: activeOnlineProvider(),
    feeIncluded:
      typeof raw.feeIncluded === "boolean" ? raw.feeIncluded : planCode === "free",
    feeChargeMode: raw.feeChargeMode === "client" ? "client" : "merchant",
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
 * Liste finale affichée au client, par marché activé.
 *
 * Les pays et les moyens sont **verrouillés** : la liste vient de SasPay
 * (`/pricing/my-rates/`, filtrée sur le pays du marché) ou, en repli, du
 * référentiel plateforme. Le marchand ne peut que personnaliser l'habillage.
 *
 * Tant que la conversion FX n'existe pas, un marché d'une autre devise que
 * celle de la boutique est renvoyé `available: false` (raison `fx_pending`).
 */
export async function getCheckoutOptions(
  slug: string,
  hasNonPhysical: boolean,
  country?: string | null,
  currency?: string | null,
  total = 0,
  hasPhysical = true,
  deliveryMode?: "self" | "pashove" | null,
): Promise<CheckoutOptions> {
  const base = await getCheckoutPaymentMethods(
    slug,
    hasNonPhysical,
    country,
    currency,
    total,
    hasPhysical,
  );

  const provider = base.provider;
  const storeCurrency = (base.currency || currency || "XOF").toUpperCase();
  const storeCountry = (base.country || country || "").toUpperCase();
  const onlineMethods = base.methods.filter((method) => method !== "cod");
  const codAllowed = base.methods.includes("cod");
  const chargeClientFee = !base.feeIncluded && base.feeChargeMode === "client";

  let rates = [] as Awaited<ReturnType<typeof listPayinRates>>;
  if (provider === "saspay" && onlineMethods.length > 0) {
    try {
      rates = await listPayinRates();
    } catch (error) {
      console.error("[saspay] rates unavailable, fallback catalogue", error);
    }
  }

  const activated = await getPublicStoreMarkets(slug);
  const markets =
    activated.length > 0
      ? activated
      : [
          {
            code: `${storeCountry}-${storeCurrency}`,
            countryCode: storeCountry,
            countryName: storeCountry,
            currency: storeCurrency,
          },
        ];

  const result: CheckoutMarket[] = [];

  for (const market of markets) {
    const marketCurrency = market.currency.toUpperCase();
    const sameCurrency = marketCurrency === storeCurrency;

    const quote = sameCurrency
      ? {
          rate: 1,
          source: "identity" as const,
          amountMinor: Math.round(total),
          amountDecimal: formatMinor(Math.round(total), storeCurrency),
        }
      : await convertMinor(total, storeCurrency, marketCurrency);

    if (!quote) {
      result.push({
        code: market.code,
        countryCode: market.countryCode,
        countryName: market.countryName,
        currency: market.currency,
        available: false,
        reason: "fx_pending",
        options: [],
        paymentCurrency: marketCurrency,
        paymentAmountMinor: 0,
        paymentAmountDecimal: "",
        fxRate: 0,
        fxSource: "identity",
      });
      continue;
    }

    const options: CheckoutPaymentOption[] = [];

    if (onlineMethods.length > 0) {
      const countryRates = rates.filter(
        (rate) =>
          rate.country_code?.trim().toUpperCase() ===
            market.countryCode.toUpperCase() && rate.payin?.available !== false,
      );

      if (countryRates.length > 0) {
        const seen = new Set<string>();
        for (const rate of countryRates) {
          if (
            !rate.network_code ||
            isGatewayNetwork(rate.network_code) ||
            seen.has(rate.network_code)
          ) {
            continue;
          }
          seen.add(rate.network_code);
          options.push(
            optionFromRate(rate, provider, quote.amountMinor, chargeClientFee),
          );
        }
      } else {
        for (const method of fallbackForCountry(onlineMethods, market.countryCode)) {
          options.push(fallbackOption(method, provider));
        }
      }

      // La carte SasPay est facturée en USD : on ne l'expose que dans la
      // devise de la boutique tant que la conversion carte n'est pas traitée.
      if (
        sameCurrency &&
        onlineMethods.includes("card") &&
        !options.some((option) => option.kind === "card")
      ) {
        options.push(fallbackOption("card", provider));
      }
    }

    // Le COD n'est proposé qu'en livraison autonome : une boutique en
    // Pashove Delivery est payée en ligne, la course ne peut pas être
    // encaissée à la livraison.
    if (codAllowed && sameCurrency && deliveryMode !== "pashove") {
      options.push(codOption());
    }

    result.push({
      code: market.code,
      countryCode: market.countryCode,
      countryName: market.countryName,
      currency: market.currency,
      available: options.length > 0,
      reason: options.length > 0 ? undefined : "no_methods",
      options,
      paymentCurrency: marketCurrency,
      paymentAmountMinor: quote.amountMinor,
      paymentAmountDecimal: quote.amountDecimal,
      fxRate: quote.rate,
      fxSource: quote.source,
    });
  }

  const defaultMarket =
    result.find(
      (market) =>
        market.available && market.countryCode.toUpperCase() === storeCountry,
    )?.code ??
    result.find((market) => market.available)?.code ??
    result[0]?.code ??
    "";

  return {
    planCode: base.planCode,
    currency: base.currency,
    country: base.country,
    provider,
    markets: result,
    defaultMarket,
    minimumOnline: 200,
    minimumCard: 25000,
    feeIncluded: base.feeIncluded,
    feeChargeMode: base.feeChargeMode,
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
