import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  AdminPaymentProvider,
  AdminPaymentTransaction,
  CheckoutPaymentOption,
  PaymentMethod,
} from "@/lib/payments/types";
import { methodMeta } from "@/lib/payments/types";
import { activeOnlineProvider } from "@/lib/payments/registry";
import {
  PAYOUT_COUNTRIES,
  providersForCountry,
  type PayoutCountry,
  type PayoutProvider,
} from "@/lib/finance/providers";

export type CheckoutPaymentMethods = {
  planCode: string;
  currency: string;
  country: string;
  methods: PaymentMethod[];
  provider: "mock" | "saspay";
};

export async function getCheckoutPaymentMethods(
  slug: string,
  hasNonPhysical: boolean,
  country?: string | null,
  currency?: string | null,
): Promise<CheckoutPaymentMethods> {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("checkout_payment_methods", {
    p_slug: slug,
    p_has_non_physical: hasNonPhysical,
    p_country: country ?? null,
    p_currency: currency ?? null,
  });

  const raw = (data ?? {}) as Partial<CheckoutPaymentMethods>;
  const methods = Array.isArray(raw.methods)
    ? raw.methods.filter((method): method is PaymentMethod => methodMeta(method).code === method)
    : [];

  return {
    planCode: typeof raw.planCode === "string" ? raw.planCode : "free",
    currency: typeof raw.currency === "string" ? raw.currency : "XOF",
    country: typeof raw.country === "string" ? raw.country : "",
    methods: filterMethodsForCountry(methods, raw.country ?? ""),
    provider: activeOnlineProvider(),
  };
}

/**
 * Tous les réseaux ne sont pas disponibles dans tous les pays : on garde les
 * familles connues du référentiel pays (MTN absent du Sénégal, Wave absent du
 * Bénin, etc.) et on laisse SasPay trancher en dernier ressort.
 */
function filterMethodsForCountry(
  methods: PaymentMethod[],
  country: string,
): PaymentMethod[] {
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

export function paymentOptions(
  methods: PaymentMethod[],
  provider: "mock" | "saspay" = "mock",
): CheckoutPaymentOption[] {
  return methods.map((method) => methodMeta(method, provider));
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
