"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { buildCheckoutSchema } from "@/lib/storefront/checkout-schema";
import { readCart, readCartToken } from "@/lib/storefront/cart";
import { loadStorefront } from "@/lib/storefront/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { toFieldErrors } from "@/lib/validation";
import { rememberOrderToken } from "@/lib/customer/order-cookie";

export type CheckoutFormState = {
  status: "idle" | "invalid" | "error";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
  messageVars?: Record<string, string>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

function errorKey(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("cart_empty")) return "checkoutEmptyError";
  if (message.includes("bundle_item_out_of_stock")) return "checkoutOutOfStock";
  if (message.includes("out_of_stock")) return "checkoutOutOfStock";
  if (message.includes("country_not_allowed")) return "checkoutCountryNotAllowed";
  if (message.includes("cod_unavailable")) return "checkoutCodUnavailable";
  if (message.includes("customer_incomplete")) return "checkoutCustomerIncomplete";
  if (message.includes("customer_invalid")) return "checkoutCustomerInvalid";
  if (message.includes("bundle_unavailable")) return "checkoutProductUnavailable";
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

  const requiresShipping = cart.items.some(
    (item) => item.productType === "physical" || item.productType === "bundle",
  );

  const parsed = buildCheckoutSchema(requiresShipping).safeParse({
    name: field(formData, "name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    country: field(formData, "country") || storefront.store.country,
    city: field(formData, "city"),
    address: field(formData, "address"),
    extra: field(formData, "extra"),
    notes: field(formData, "notes"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  const createAccount = field(formData, "createAccount") === "on";
  const password = field(formData, "password");

  if (createAccount && password.length < 8) {
    return {
      status: "invalid",
      fieldErrors: { password: "passwordShort" },
    };
  }

  if (!UUID_PATTERN.test(cart.checkoutKey)) {
    return { status: "error", messageKey: "checkoutGeneric" };
  }

  // Une commande sans objet physique n'a pas d'adresse. On fournit une valeur
  // technique à la validation historique de `place_order`, puis
  // `place_cod_order` vide les champs de livraison de la commande.
  const customer = requiresShipping
    ? parsed.data
    : {
        ...parsed.data,
        country: storefront.store.country,
        city: "—",
        address: "—",
      };

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("place_cod_order", {
    p_token: cartToken,
    p_customer: customer,
    p_idempotency_key: cart.checkoutKey,
  });

  if (error) {
    const message = error.message ?? "";
    const bundleStock = message.match(/bundle_item_out_of_stock:(.+)$/);

    if (bundleStock) {
      return {
        status: "error",
        messageKey: "checkoutBundleOutOfStock",
        messageVars: { name: bundleStock[1].trim() },
      };
    }

    return { status: "error", messageKey: errorKey(error) };
  }

  const result = data as { token?: string } | null;
  if (!result?.token) {
    return { status: "error", messageKey: "checkoutGeneric" };
  }

  await rememberOrderToken(result.token);

  // Si l'acheteur est déjà connecté (même un marchand sur sa propre vitrine),
  // la commande rejoint immédiatement son espace client, quel que soit l'e-mail
  // saisi pour le contact.
  const authClient = isSupabaseConfigured() ? await createClient() : null;

  if (authClient) {
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (user) {
      await authClient.rpc("link_order_to_customer", {
        p_token: result.token,
      });
    }
  }

  // Création de compte facultative : la commande est déjà enregistrée. Si la
  // confirmation d'e-mail est active, la session s'ouvrira après le clic.
  if (createAccount && authClient) {
    const { data: auth } = await authClient.auth.signUp({
      email: parsed.data.email,
      password,
      options: {
        data: { full_name: parsed.data.name },
        emailRedirectTo: `${siteUrl()}/${locale}/auth/callback?next=${encodeURIComponent(
          `/${locale}/store/${storefront.store.slug}/account`,
        )}`,
      },
    });

    if (auth.session) {
      await authClient.rpc("link_order_to_customer", {
        p_token: result.token,
      });
      await authClient.rpc("claim_guest_orders");
    }
  }

  (await cookies()).delete("pashove_cart");
  redirect(`/${locale}/store/${storefront.store.slug}/checkout/success/${result.token}`);
}
