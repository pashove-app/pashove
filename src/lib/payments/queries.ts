import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  AdminPaymentProvider,
  AdminPaymentTransaction,
  CheckoutPaymentOption,
  PaymentMethod,
} from "@/lib/payments/types";
import { methodMeta } from "@/lib/payments/types";

export type CheckoutPaymentMethods = {
  planCode: string;
  currency: string;
  country: string;
  methods: PaymentMethod[];
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
    methods,
  };
}

export function paymentOptions(methods: PaymentMethod[]): CheckoutPaymentOption[] {
  return methods.map(methodMeta);
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
