"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { checkoutSchema } from "@/lib/storefront/checkout-schema";
import { readCart, readCartToken } from "@/lib/storefront/cart";
import { loadStorefront } from "@/lib/storefront/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { toFieldErrors } from "@/lib/validation";

export type CheckoutFormState = {
  status: "idle" | "invalid" | "error";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorKey(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("cart_empty")) return "checkoutEmptyError";
  if (message.includes("out_of_stock")) return "checkoutOutOfStock";
  if (message.includes("country_not_allowed")) return "checkoutCountryNotAllowed";
  if (message.includes("cod_unavailable")) return "checkoutCodUnavailable";
  if (message.includes("customer_incomplete")) return "checkoutCustomerIncomplete";
  if (message.includes("customer_invalid")) return "checkoutCustomerInvalid";
  if (message.includes("product_unavailable")) return "checkoutProductUnavailable";
  if (message.includes("store_unavailable")) return "checkoutStoreUnavailable";
  if (message.includes("cart_unavailable")) return "checkoutCartUnavailable";

  return "checkoutGeneric";
}

/** Crée la commande COD, décrémente le stock, poste le ledger et vide le panier. */
export async function placeCodOrderAction(
  _previous: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const slug = field(formData, "slug");

  const parsed = checkoutSchema.safeParse({
    name: field(formData, "name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    country: field(formData, "country"),
    city: field(formData, "city"),
    address: field(formData, "address"),
    extra: field(formData, "extra"),
    notes: field(formData, "notes"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!slug) {
    return { status: "error", messageKey: "checkoutStoreUnavailable" };
  }

  const cart = await readCart(LOCALE_META[locale].tag);
  const cartToken = await readCartToken();
  if (!cart || !cartToken || cart.items.length === 0) {
    return { status: "error", messageKey: "checkoutEmptyError" };
  }

  const storefront = await loadStorefront(slug);
  if (
    storefront.status !== "active" ||
    !storefront.store ||
    storefront.store.id !== cart.storeId
  ) {
    return { status: "error", messageKey: "checkoutStoreUnavailable" };
  }

  if (!UUID_PATTERN.test(cart.checkoutKey)) {
    return { status: "error", messageKey: "checkoutGeneric" };
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("place_cod_order", {
    p_token: cartToken,
    p_customer: parsed.data,
    p_idempotency_key: cart.checkoutKey,
  });

  if (error) {
    return { status: "error", messageKey: errorKey(error) };
  }

  const result = data as { token?: string } | null;
  if (!result?.token) {
    return { status: "error", messageKey: "checkoutGeneric" };
  }

  (await cookies()).delete("pashove_cart");
  redirect(`/${locale}/store/${storefront.store.slug}/checkout/success/${result.token}`);
}
