import { createPublicClient } from "@/lib/supabase/public";
import { sendEmail, sendStoreEmail } from "./service";
import type { EmailData, EmailItem, EmailOrder } from "./types";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function normalizedLocale(value?: string | null): "fr" | "en" {
  return value?.toLowerCase().startsWith("en") ? "en" : "fr";
}

export type StoreRef = {
  id: string;
  name: string;
  slug: string;
};

export type OrderEmailContext = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  orderId: string;
  orderNumber: number;
  currency: string;
  total: number;
  subtotal?: number | null;
  discount?: number | null;
  shipping?: number | null;
  customerName: string;
  customerEmail: string;
  paymentMethod?: string | null;
  trackingNumber?: string | null;
  address?: string | null;
  items: EmailItem[];
  hasDigital: boolean;
  hasService: boolean;
};

/** Construit l'adresse postale affichée dans l'e-mail, si elle existe. */
export function formatAddress(input: {
  address?: string | null;
  city?: string | null;
  country?: string | null;
}): string | null {
  const parts = [input.address, input.city, input.country].filter(
    (part): part is string => Boolean(part && part.trim() && part !== "—"),
  );

  return parts.length > 0 ? parts.join(", ") : null;
}

function orderEmailUrl(context: OrderEmailContext, locale: string): string {
  return `${siteUrl()}/${normalizedLocale(locale)}/store/${context.storeSlug}/account/orders/${context.orderId}`;
}

function accountUrl(
  context: OrderEmailContext,
  locale: string,
  page: string,
): string {
  return `${siteUrl()}/${normalizedLocale(locale)}/store/${context.storeSlug}/account/${page}`;
}

function orderData(context: OrderEmailContext): EmailOrder {
  return {
    number: context.orderNumber,
    currency: context.currency,
    total: context.total,
    subtotal: context.subtotal ?? null,
    discount: context.discount ?? null,
    shipping: context.shipping ?? null,
    items: context.items,
    trackingNumber: context.trackingNumber ?? null,
    paymentMethod: context.paymentMethod ?? null,
    address: context.address ?? null,
  };
}

function baseData(
  context: OrderEmailContext,
  locale: string,
): EmailData {
  return {
    storeName: context.storeName,
    storeUrl: `${siteUrl()}/${normalizedLocale(locale)}/store/${context.storeSlug}`,
    customerName: context.customerName,
    order: orderData(context),
    currency: context.currency,
    amount: context.total,
    orderUrl: orderEmailUrl(context, locale),
  };
}

/* ------------------------------------------------------------------ *
 *  Compte
 * ------------------------------------------------------------------ */

export async function emailWelcome(input: {
  email: string;
  name?: string | null;
  locale?: string | null;
}): Promise<void> {
  const locale = normalizedLocale(input.locale);

  await sendEmail({
    template: "welcome",
    to: input.email,
    toName: input.name ?? null,
    locale,
    data: {
      customerName: input.name ?? null,
      ctaUrl: `${siteUrl()}/${locale}/app`,
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Commandes
 * ------------------------------------------------------------------ */

/** Confirmation d'achat : client, marchand, accès numérique. */
export async function emailOrderPlaced(
  context: OrderEmailContext,
  locale?: string | null,
  booking?: { service: string; startsAt: string } | null,
): Promise<void> {
  const tag = normalizedLocale(locale);

  await sendEmail({
    template: "order_confirmation",
    to: context.customerEmail,
    toName: context.customerName,
    locale: tag,
    storeId: context.storeId,
    data: baseData(context, tag),
  });

  await sendStoreEmail({
    kind: "new_order",
    template: "new_order",
    to: "", // remplacé par le destinataire marchand
    storeId: context.storeId,
    locale: tag,
    data: {
      ...baseData(context, tag),
      // Le marchand voit la commande depuis son espace, pas depuis la vitrine.
      orderUrl: `${siteUrl()}/${tag}/app/orders/${context.orderId}`,
    },
  });

  if (context.hasDigital) {
    await sendEmail({
      template: "digital_access",
      to: context.customerEmail,
      toName: context.customerName,
      locale: tag,
      storeId: context.storeId,
      data: {
        ...baseData(context, tag),
        downloadsUrl: accountUrl(context, tag, "downloads"),
      },
    });
  }

  if (booking) {
    await sendEmail({
      template: "booking_confirmation",
      to: context.customerEmail,
      toName: context.customerName,
      locale: tag,
      storeId: context.storeId,
      data: {
        ...baseData(context, tag),
        bookingService: booking.service,
        bookingAt: booking.startsAt,
        orderUrl: accountUrl(context, tag, "bookings"),
      },
    });
  }
}

export async function emailOrderShipped(
  context: OrderEmailContext,
  locale?: string | null,
): Promise<void> {
  const tag = normalizedLocale(locale);

  await sendEmail({
    template: "order_shipped",
    to: context.customerEmail,
    toName: context.customerName,
    locale: tag,
    storeId: context.storeId,
    data: baseData(context, tag),
  });
}

export async function emailOrderDelivered(
  context: OrderEmailContext,
  locale?: string | null,
): Promise<void> {
  const tag = normalizedLocale(locale);

  await sendEmail({
    template: "order_delivered",
    to: context.customerEmail,
    toName: context.customerName,
    locale: tag,
    storeId: context.storeId,
    data: baseData(context, tag),
  });
}

export async function emailOrderCancelled(
  context: OrderEmailContext,
  locale?: string | null,
  reason?: string | null,
): Promise<void> {
  const tag = normalizedLocale(locale);
  const data = { ...baseData(context, tag), reason: reason ?? null };

  await sendEmail({
    template: "order_cancelled",
    to: context.customerEmail,
    toName: context.customerName,
    locale: tag,
    storeId: context.storeId,
    data,
  });

  await sendStoreEmail({
    kind: "order_cancelled",
    template: "order_cancelled",
    to: "",
    storeId: context.storeId,
    locale: tag,
    data: {
      ...data,
      orderUrl: `${siteUrl()}/${tag}/app/orders/${context.orderId}`,
    },
  });
}

export async function emailOrderRefunded(
  context: OrderEmailContext,
  locale?: string | null,
): Promise<void> {
  const tag = normalizedLocale(locale);
  const data = baseData(context, tag);

  await sendEmail({
    template: "order_refunded",
    to: context.customerEmail,
    toName: context.customerName,
    locale: tag,
    storeId: context.storeId,
    data,
  });

  await sendStoreEmail({
    kind: "order_cancelled",
    template: "order_refunded",
    to: "",
    storeId: context.storeId,
    locale: tag,
    data: {
      ...data,
      orderUrl: `${siteUrl()}/${tag}/app/orders/${context.orderId}`,
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Équipe, vérification, retraits
 * ------------------------------------------------------------------ */

export async function emailTeamInvitation(input: {
  to: string;
  storeName: string;
  inviterName?: string | null;
  role: string;
  inviteUrl: string;
  locale?: string | null;
}): Promise<void> {
  await sendEmail({
    template: "team_invitation",
    to: input.to,
    locale: normalizedLocale(input.locale),
    data: {
      storeName: input.storeName,
      inviter: input.inviterName ?? "Pashove",
      role: input.role,
      inviteUrl: input.inviteUrl,
    },
  });
}

export async function emailKycDecision(input: {
  storeId: string;
  storeName: string;
  approved: boolean;
  reason?: string | null;
  locale?: string | null;
}): Promise<void> {
  const tag = normalizedLocale(input.locale);

  await sendStoreEmail({
    kind: "kyc",
    template: input.approved ? "kyc_approved" : "kyc_rejected",
    to: "",
    storeId: input.storeId,
    locale: tag,
    data: {
      storeName: input.storeName,
      reason: input.reason ?? null,
      ctaUrl: `${siteUrl()}/${tag}/app/finance/kyc`,
    },
  });
}

export async function emailPayoutRequested(input: {
  storeId: string;
  storeName: string;
  amount: number;
  currency: string;
  provider: string;
  last4: string;
  locale?: string | null;
}): Promise<void> {
  const tag = normalizedLocale(input.locale);

  await sendStoreEmail({
    kind: "payout",
    template: "payout_requested",
    to: "",
    storeId: input.storeId,
    locale: tag,
    data: {
      storeName: input.storeName,
      amount: input.amount,
      currency: input.currency,
      payoutProvider: input.provider,
      payoutLast4: input.last4,
      ctaUrl: `${siteUrl()}/${tag}/app/finance/payouts`,
    },
  });
}

export async function emailPayoutProcessed(input: {
  storeId: string;
  storeName: string;
  amount: number;
  currency: string;
  statusLabel: string;
  reference?: string | null;
  reason?: string | null;
  locale?: string | null;
}): Promise<void> {
  const tag = normalizedLocale(input.locale);

  await sendStoreEmail({
    kind: "payout",
    template: "payout_processed",
    to: "",
    storeId: input.storeId,
    locale: tag,
    data: {
      storeName: input.storeName,
      amount: input.amount,
      currency: input.currency,
      statusLabel: input.statusLabel,
      reference: input.reference ?? null,
      reason: input.reason ?? null,
      ctaUrl: `${siteUrl()}/${tag}/app/finance/payouts`,
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Lecture d'une commande publique (checkout)
 * ------------------------------------------------------------------ */

type PublicOrderRow = {
  id: string;
  number: number;
  paymentStatus: string;
  paymentMethod: string | null;
  currency: string;
  subtotal: number;
  discount: number | null;
  shipping: number;
  total: number;
  customerName: string;
  country: string | null;
  city: string | null;
  address: string | null;
  items: {
    name: string;
    variantLabel: string | null;
    productType: string;
    quantity: number;
    lineTotal: number;
  }[];
  customerEmail?: string | null;
};

/**
 * Reconstruit le contexte d'e-mail après un checkout.
 *
 * `public_order` ne renvoie pas l'e-mail du client : il est déjà en mémoire
 * dans l'action de commande, on le passe donc explicitement.
 */
export async function loadOrderEmailContext(input: {
  slug: string;
  token: string;
  customerEmail: string;
}): Promise<OrderEmailContext | null> {
  const supabase = createPublicClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("slug", input.slug)
    .maybeSingle();

  const storeRow = store as StoreRef | null;
  if (!storeRow?.id) return null;

  const { data } = await supabase.rpc("public_order", {
    p_slug: input.slug,
    p_token: input.token,
  });

  const order = data as PublicOrderRow | null;
  if (!order) return null;

  const items: EmailItem[] = order.items.map((item) => ({
    name: item.name,
    variantLabel: item.variantLabel,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }));

  return {
    storeId: storeRow.id,
    storeName: storeRow.name,
    storeSlug: storeRow.slug,
    orderId: order.id,
    orderNumber: order.number,
    currency: order.currency,
    total: order.total,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    customerName: order.customerName,
    customerEmail: input.customerEmail,
    paymentMethod: order.paymentMethod,
    address: formatAddress({
      address: order.address,
      city: order.city,
      country: order.country,
    }),
    items,
    hasDigital: order.items.some((item) => item.productType === "digital"),
    hasService: order.items.some((item) => item.productType === "service"),
  };
}
