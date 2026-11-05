"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { emailGiftReceived, emailOrderPlaced, loadOrderEmailContext } from "@/lib/email/events";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { buildCheckoutSchema, giftCheckoutSchema } from "@/lib/storefront/checkout-schema";
import { readCart, readCartToken } from "@/lib/storefront/cart";
import { loadStorefront } from "@/lib/storefront/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { toFieldErrors } from "@/lib/validation";
import { rememberOrderToken } from "@/lib/customer/order-cookie";
import { paymentSchema } from "@/lib/payments/schema";
import { getPaymentProvider } from "@/lib/payments/registry";
import { isPaymentMethod, type PaymentMethod } from "@/lib/payments/types";

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
  if (message.includes("payment_method_unavailable")) return "checkoutPaymentUnavailable";
  if (message.includes("payment_")) return "checkoutPaymentFailed";

  return "checkoutGeneric";
}

/** Crée la commande COD, décrémente le stock, poste le ledger et vide le panier. */
export async function placeOrderAction(
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

  const supabase = createPublicClient();

  const payment = paymentSchema.safeParse({
    paymentMethod: field(formData, "paymentMethod"),
    paymentPhone: field(formData, "paymentPhone"),
    cardNumber: field(formData, "cardNumber"),
    cardExpiry: field(formData, "cardExpiry"),
    cardCvv: field(formData, "cardCvv"),
  });

  if (!payment.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(payment.error) };
  }

  const method = payment.data.paymentMethod as PaymentMethod;
  if (!isPaymentMethod(method)) {
    return { status: "error", messageKey: "checkoutPaymentInvalid" };
  }

  const { data: methodsData } = await supabase.rpc("checkout_payment_methods", {
    p_slug: slug,
    p_has_non_physical: !requiresShipping,
    p_country: storefront.store.country,
    p_currency: cart.currency,
  });

  const allowedMethods = Array.isArray((methodsData as { methods?: unknown })?.methods)
    ? ((methodsData as { methods: PaymentMethod[] }).methods)
    : [];

  if (!allowedMethods.includes(method)) {
    return { status: "error", messageKey: "checkoutPaymentUnavailable" };
  }

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

  const giftSelected = field(formData, "isGift") === "on";
  let giftInput: {
    recipientName: string;
    recipientEmail: string;
    message: string | null;
    scheduledAt: string | null;
  } | null = null;

  if (giftSelected) {
    if (!storefront.store.gift_enabled) {
      return { status: "error", messageKey: "giftDisabled" };
    }

    if (cart.items.filter((item) => item.productType === "service").length > 1) {
      return { status: "error", messageKey: "giftMultipleServices" };
    }

    const giftParsed = giftCheckoutSchema.safeParse({
      recipientName: field(formData, "giftRecipientName"),
      recipientEmail: field(formData, "giftRecipientEmail"),
      message: field(formData, "giftMessage"),
      scheduledDate: field(formData, "giftScheduledDate"),
    });

    if (!giftParsed.success) {
      return { status: "invalid", fieldErrors: toFieldErrors(giftParsed.error) };
    }

    const date = giftParsed.data.scheduledDate
      ? new Date(`${giftParsed.data.scheduledDate}T00:00:00.000Z`)
      : null;

    giftInput = {
      recipientName: giftParsed.data.recipientName,
      recipientEmail: giftParsed.data.recipientEmail,
      message: giftParsed.data.message || null,
      scheduledAt:
        date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
    };
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

  let orderData: unknown = null;

  if (method === "cod") {
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

    orderData = data;
  } else {
    const { data, error } = await supabase.rpc("place_online_order", {
      p_token: cartToken,
      p_customer: customer,
      p_idempotency_key: cart.checkoutKey,
      p_method: method,
    });

    if (error) {
      return { status: "error", messageKey: errorKey(error) };
    }

    const online = data as {
      orderId?: string;
      token?: string;
      total?: number;
      currency?: string;
    } | null;

    if (!online?.orderId || !online.token || typeof online.total !== "number") {
      return { status: "error", messageKey: "checkoutGeneric" };
    }

    try {
      const provider = getPaymentProvider("mock");
      const intent = await provider.createIntent({
        orderId: online.orderId,
        amount: online.total,
        currency: online.currency ?? cart.currency,
        method,
        customer: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
        },
      });

      await supabase.rpc("record_payment_intent", {
        p_order_token: online.token,
        p_reference: intent.reference,
        p_provider: "mock",
        p_method: method,
      });

      const confirmation = await provider.confirm(intent);

      if (confirmation.status !== "succeeded") {
        return { status: "error", messageKey: "checkoutPaymentFailed" };
      }

      const { error: confirmError } = await supabase.rpc("confirm_mock_payment", {
        p_order_token: online.token,
        p_reference: confirmation.reference,
      });

      if (confirmError) {
        return { status: "error", messageKey: errorKey(confirmError) };
      }

      orderData = data;
    } catch {
      return { status: "error", messageKey: "checkoutPaymentFailed" };
    }
  }

  const result = orderData as { token?: string } | null;
  if (!result?.token) {
    return { status: "error", messageKey: "checkoutGeneric" };
  }

  const storeSlug = storefront.store.slug;
  const orderToken = result.token;
  await rememberOrderToken(orderToken);

  type GiftClaimResult = {
    token: string;
    scheduledAt: string;
    recipientEmail: string;
  };
  let giftResult: GiftClaimResult | null = null;

  if (giftInput) {
    const { data: giftData, error: giftError } = await supabase.rpc(
      "create_gift_claim",
      {
        p_order_token: orderToken,
        p_recipient_name: giftInput.recipientName,
        p_recipient_email: giftInput.recipientEmail,
        p_message: giftInput.message,
        p_scheduled_at: giftInput.scheduledAt,
      },
    );

    if (giftError) {
      console.error("[gift] creation failed", giftError.message);
    } else {
      giftResult = giftData as GiftClaimResult;
    }
  }

  // Les e-mails partent après la réponse : le client voit sa page de succès
  // sans attendre l'API Brevo, et un échec d'envoi ne casse pas la commande.
  after(async () => {
    try {
      const context = await loadOrderEmailContext({
        slug: storeSlug,
        token: orderToken,
        customerEmail: parsed.data.email,
      });

      if (!context) return;

      const serviceItem = cart.items.find(
        (item) => item.productType === "service" && item.serviceStartsAt,
      );

      await emailOrderPlaced(
        context,
        locale,
        serviceItem?.serviceStartsAt
          ? {
              service: serviceItem.name,
              startsAt: serviceItem.serviceStartsAt,
            }
          : null,
        giftResult && giftInput
          ? {
              recipientName: giftInput.recipientName,
              message: giftInput.message,
              scheduledAt: giftResult.scheduledAt,
            }
          : null,
      );

      if (giftResult && giftInput) {
        await emailGiftReceived({
          storeId: context.storeId,
          storeName: context.storeName,
          storeSlug: context.storeSlug,
          orderNumber: context.orderNumber,
          currency: context.currency,
          total: context.total,
          buyerName: context.customerName,
          recipientName: giftInput.recipientName,
          recipientEmail: giftInput.recipientEmail,
          message: giftInput.message,
          scheduledAt: giftResult.scheduledAt,
          token: giftResult.token,
          items: context.items,
          locale,
        });
      }
    } catch (error) {
      console.error("[email] checkout notification failed", error);
    }
  });

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
