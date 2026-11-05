import { NextResponse } from "next/server";
import { renderEmail } from "@/lib/email/templates";
import type { EmailData, EmailTemplate } from "@/lib/email/types";

export const dynamic = "force-dynamic";

function sample(template: EmailTemplate): EmailData {
  const base: EmailData = {
    storeName: "Pashove",
    storeUrl: "https://pashove.com/fr/store/maboutie",
    customerName: "Awa Traoré",
    ctaUrl: "https://pashove.com/fr/app",
    orderUrl:
      "https://pashove.com/fr/store/maboutie/account/orders/8d8a3c1e-0000-4000-8000-000000000000",
    order: {
      number: 1027,
      currency: "XOF",
      total: 9000,
      subtotal: 10000,
      discount: 1000,
      shipping: 0,
      items: [
        {
          name: "Guide Ultime du E-commerce 2026",
          variantLabel: null,
          quantity: 1,
          lineTotal: 10000,
        },
      ],
      paymentMethod: "orange_money",
      address: "Cocody, Abidjan, Côte d’Ivoire",
    },
    amount: 9000,
    currency: "XOF",
  };

  switch (template) {
    case "team_invitation":
      return {
        ...base,
        inviter: "Ibrahim Sidibé",
        role: "Administrateur",
        inviteUrl: "https://pashove.com/fr/auth/accept-invitation?token=demo",
      };
    case "booking_confirmation":
      return {
        ...base,
        bookingService: "Consultation stratégie e-commerce",
        bookingAt: "2026-11-04T10:00:00.000Z",
      };
    case "kyc_rejected":
      return {
        ...base,
        reason: "La photo du document est floue. Reprends-la à la lumière du jour.",
      };
    case "payout_requested":
      return {
        ...base,
        amount: 45000,
        payoutProvider: "Orange Money",
        payoutLast4: "0042",
      };
    case "payout_processed":
      return {
        ...base,
        amount: 45000,
        statusLabel: "payé",
        reference: "PAY-9931",
      };
    case "digital_access":
      return {
        ...base,
        downloadsUrl: "https://pashove.com/fr/store/maboutie/account/downloads",
      };
    default:
      return base;
  }
}

/** Aperçu local des gabarits d'e-mail. Inactif en production. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const template = (url.searchParams.get("template") ??
    "order_confirmation") as EmailTemplate;
  const locale = url.searchParams.get("locale") === "en" ? "en" : "fr";

  const rendered = renderEmail(template, sample(template), locale);

  return new NextResponse(rendered.html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
