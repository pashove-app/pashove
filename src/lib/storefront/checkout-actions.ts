"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { emailGiftReceived, emailOrderPlaced, loadOrderEmailContext } from "@/lib/email/events";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { buildCheckoutSchema, giftCheckoutSchema } from "@/lib/storefront/checkout-schema";
import { readCart, readCartToken } from "@/lib/storefront/cart";
import { loadStorefront } from "@/lib/storefront/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/service";
import { toFieldErrors } from "@/lib/validation";
import { rememberOrderToken } from "@/lib/customer/order-cookie";
import { paymentSchema } from "@/lib/payments/schema";
import { activeOnlineProvider, getPaymentProvider } from "@/lib/payments/registry";
import { normalizePaymentPhone } from "@/lib/payments/phone";
import { getCheckoutOptions } from "@/lib/payments/queries";
import { formatMinor } from "@/lib/fx/currency";
import { convertMinor } from "@/lib/fx/rates";
import { SasPayError } from "@/lib/payments/saspay/client";
import { afterDeliveryPush } from "@/lib/pwa/after-push";
import { classifyHost, normalizeHost } from "@/lib/domains/hosts";
import { resolveCustomDomain } from "@/lib/domains/lookup";
import type { PaymentMethod } from "@/lib/payments/types";

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

/**
 * Base du retour de paiement : le domaine marqué quand le checkout a été ouvert
 * depuis celui-ci, sinon pashove.com. Le retour SasPay doit ramener le client
 * sur la boutique qu'il a visitée, pas sur la plateforme.
 */
async function returnBase(): Promise<{ base: string; branded: boolean }> {
  const requestHeaders = await headers();
  const host = normalizeHost(requestHeaders.get("host"));
  const kind = classifyHost(host);

  if (kind.kind === "subdomain") {
    return { base: `https://${host}`, branded: true };
  }

  if (kind.kind === "custom" && (await resolveCustomDomain(kind.domain))) {
    return { base: `https://${host}`, branded: true };
  }

  return { base: siteUrl(), branded: false };
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
    paymentNetwork: field(formData, "paymentNetwork"),
    paymentPhone: field(formData, "paymentPhone"),
    paymentOtp: field(formData, "paymentOtp"),
    cardNumber: field(formData, "cardNumber"),
    cardExpiry: field(formData, "cardExpiry"),
    cardCvv: field(formData, "cardCvv"),
  });

  if (!payment.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(payment.error) };
  }

  // Le catalogue est reconstruit côté serveur : un code réseau envoyé par le
  // navigateur n'est accepté que s'il est réellement proposé par la plateforme
  // pour le pays de la boutique.
  const checkout = await getCheckoutOptions(
    slug,
    !requiresShipping,
    storefront.store.country,
    cart.currency,
    cart.total,
    requiresShipping,
    storefront.store.delivery_mode,
  );

  const market = checkout.markets.find(
    (entry) => entry.code === field(formData, "paymentMarket"),
  );

  if (!market || !market.available) {
    return { status: "error", messageKey: "checkoutPaymentUnavailable" };
  }

  const option = market.options.find(
    (entry) => entry.code === payment.data.paymentNetwork,
  );

  const feeChargeMode =
    checkout.feeIncluded || checkout.feeChargeMode !== "client"
      ? ("DEDUCTED" as const)
      : ("ADD_ON" as const);

  if (!option) {
    return { status: "error", messageKey: "checkoutPaymentUnavailable" };
  }

  const method: PaymentMethod = option.method;

  if (option.requiresPhone) {
    if (payment.data.paymentPhone.replace(/\D/g, "").length < 8) {
      return {
        status: "invalid",
        fieldErrors: { paymentPhone: "checkoutPhoneInvalid" },
      };
    }
  }

  if (option.requiresOtp) {
    if (payment.data.paymentOtp.replace(/\D/g, "").length < 4) {
      return {
        status: "invalid",
        fieldErrors: { paymentOtp: "checkoutPaymentInvalid" },
      };
    }
  }

  if (option.requiresCard) {
    const digits = payment.data.cardNumber.replace(/\D/g, "");
    if (
      digits.length < 13 ||
      digits.length > 19 ||
      !/^\d{2}\s*\/\s*\d{2}$/.test(payment.data.cardExpiry) ||
      !/^\d{3,4}$/.test(payment.data.cardCvv)
    ) {
      return {
        status: "invalid",
        fieldErrors: { cardNumber: "checkoutCardInvalid" },
      };
    }
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
  let paymentRedirect: string | null = null;

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

    if (storefront.store.delivery_mode === "pashove" && requiresShipping) {
      const zoneId = field(formData, "deliveryZone");
      const token = (data as { token?: string } | null)?.token;

      if (!zoneId || !token) {
        return { status: "error", messageKey: "checkoutDeliveryUnavailable" };
      }

      const { error: zoneError } = await supabase.rpc("apply_delivery_zone", {
        p_order_token: token,
        p_zone_id: zoneId,
      });

      if (zoneError) {
        return { status: "error", messageKey: "checkoutDeliveryUnavailable" };
      }
    }

    orderData = data;
  } else {
    const providerCode = activeOnlineProvider();

    const { data, error } = await supabase.rpc("place_online_order", {
      p_token: cartToken,
      p_customer: customer,
      p_idempotency_key: cart.checkoutKey,
      p_method: method,
      p_provider: providerCode,
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

    let paymentAmount = market.paymentAmountMinor;
    let paymentCurrency = market.paymentCurrency;
    let paymentAmountDecimal = market.paymentAmountDecimal;
    let paymentFxRate = market.fxRate;
    let paymentFxSource = market.fxSource;

    if (storefront.store.delivery_mode === "pashove" && requiresShipping) {
      const zoneId = field(formData, "deliveryZone");

      if (!zoneId) {
        return { status: "error", messageKey: "checkoutDeliveryUnavailable" };
      }

      const { data: applied, error: zoneError } = await supabase.rpc(
        "apply_delivery_zone",
        { p_order_token: online.token, p_zone_id: zoneId },
      );

      const zone = applied as { total?: number; currency?: string } | null;

      if (zoneError || !zone?.total || !zone.currency) {
        return { status: "error", messageKey: "checkoutDeliveryUnavailable" };
      }

      // `zone.total` est le total de la commande dans la devise de la boutique
      // (frais de livraison convertis). Le paiement peut être dans une autre
      // devise : on reconvertit le total complet, livraison incluse.
      if (zone.currency.toUpperCase() === market.paymentCurrency.toUpperCase()) {
        paymentAmount = Math.round(zone.total);
        paymentCurrency = market.paymentCurrency;
        paymentAmountDecimal = formatMinor(paymentAmount, paymentCurrency);
        paymentFxRate = 1;
        paymentFxSource = "identity";
      } else {
        const converted = await convertMinor(
          Math.round(zone.total),
          zone.currency,
          market.paymentCurrency,
        );

        if (!converted) {
          return { status: "error", messageKey: "checkoutDeliveryUnavailable" };
        }

        paymentAmount = converted.amountMinor;
        paymentCurrency = market.paymentCurrency;
        paymentAmountDecimal = converted.amountDecimal;
        paymentFxRate = converted.rate;
        paymentFxSource = converted.source;
      }
    }

    // Les RPC de paiement sont réservées à la clé de service : la clé anonyme
    // est publique et permettrait sinon de confirmer une commande sans argent.
    const payments = createServiceClient();

    if (!payments) {
      return { status: "error", messageKey: "checkoutPaymentFailed" };
    }

    try {
      const provider = getPaymentProvider(providerCode);
      // Taux et montant figés pour ce marché avant toute intention.
      if (providerCode === "saspay" && market.paymentCurrency) {
        await payments.rpc("set_order_fx", {
          p_order_token: online.token,
          p_payment_currency: paymentCurrency,
          p_payment_amount: Number(paymentAmountDecimal),
          p_fx_rate: paymentFxRate,
          p_fx_source: paymentFxSource,
        });
      }

      const destination = await returnBase();
      const successPath = destination.branded
        ? `/checkout/success/${online.token}`
        : `/${locale}/store/${storefront.store.slug}/checkout/success/${online.token}`;

      // Le numéro qui reçoit la demande de paiement est celui saisi dans le
      // bloc Paiement, pas le téléphone de contact. On le normalise avec
      // l'indicatif du pays payé.
      const paymentPhone =
        normalizePaymentPhone(
          payment.data.paymentPhone || parsed.data.phone,
          market.countryCode,
        ) ?? parsed.data.phone;

      const intent = await provider.createIntent({
        orderId: online.orderId,
        amount: paymentAmount,
        currency: paymentCurrency,
        country: market.countryCode,
        method,
        network: option.code,
        otp: payment.data.paymentOtp || undefined,
        feeChargeMode,
        idempotencyKey: cart.checkoutKey,
        description: `Commande ${online.orderId.slice(0, 8)} · ${storefront.store.name}`,
        returnUrl: `${destination.base}${successPath}`,
        customer: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: paymentPhone,
        },
      });

      if (providerCode === "saspay") {
        // SasPay confirme par webhook : on enregistre l'intention et on laisse
        // la commande en attente. Une URL hébergée redirige le client.
        await payments.rpc("record_saspay_intent", {
          p_order_token: online.token,
          p_reference: intent.reference,
          p_method: method,
          p_network: intent.networkCode ?? null,
          p_redirect_url: intent.redirectUrl ?? null,
          p_country: market.countryCode,
        });

        paymentRedirect = intent.redirectUrl ?? null;
      } else {
        await payments.rpc("record_payment_intent", {
          p_order_token: online.token,
          p_reference: intent.reference,
          p_provider: "mock",
          p_method: method,
        });

        const confirmation = await provider.confirm(intent);

        if (confirmation.status !== "succeeded") {
          return { status: "error", messageKey: "checkoutPaymentFailed" };
        }

        const { error: confirmError } = await payments.rpc("confirm_mock_payment", {
          p_order_token: online.token,
          p_reference: confirmation.reference,
        });

        if (confirmError) {
          return { status: "error", messageKey: errorKey(confirmError) };
        }

        afterDeliveryPush();
      }

      orderData = data;
    } catch (paymentError) {
      if (paymentError instanceof SasPayError) {
        console.error("[saspay] create payment failed", {
          code: paymentError.code,
          status: paymentError.status,
          message: paymentError.message,
        });
      }
      return { status: "error", messageKey: "checkoutPaymentFailed" };
    }
  }

  const result = orderData as { token?: string } | null;
  if (!result?.token) {
    return { status: "error", messageKey: "checkoutGeneric" };
  }

  const storeSlug = storefront.store.slug;
  const orderToken = result.token;

  // Attribution d'affiliation lue dans le cookie de 30 jours. Le code est
  // revérifié en base ; un code inconnu est simplement ignoré.
  const affiliateCode = (await cookies()).get("pashove_ref")?.value ?? "";

  if (affiliateCode && UUID_PATTERN.test(orderToken)) {
    await supabase.rpc("attach_affiliate", {
      p_order_token: orderToken,
      p_code: affiliateCode,
    });
  }

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

  // Réseaux hébergés (Wave, Orange, Djamo, cartes) : le client termine sur la
  // page SasPay, la commande reste en attente jusqu'au webhook.
  if (paymentRedirect) {
    redirect(paymentRedirect);
  }

  redirect(`/${locale}/store/${storefront.store.slug}/checkout/success/${result.token}`);
}
