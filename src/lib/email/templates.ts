import { EMAIL_COPY } from "./copy";
import type { EmailData, EmailLocale, EmailTemplate, RenderedEmail } from "./types";

const BRAND = "#2F5CFF";
const INK = "#0A0E1A";
const MUTED = "#6B7280";
const LINE = "#E6E8EF";
const BG = "#F4F5F8";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const LOCALE_TAG: Record<EmailLocale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

const PAYMENT_LABELS: Record<EmailLocale, Record<string, string>> = {
  fr: {
    cod: "Paiement à la livraison",
    orange_money: "Orange Money",
    wave: "Wave",
    card: "Carte bancaire",
  },
  en: {
    cod: "Cash on delivery",
    orange_money: "Orange Money",
    wave: "Wave",
    card: "Bank card",
  },
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key] : match,
  );
}

function money(
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: EmailLocale,
): string {
  if (typeof amount !== "number") return "";
  const code = currency || "XOF";

  try {
    return new Intl.NumberFormat(LOCALE_TAG[locale], {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "XOF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

function formatDate(value: string | null | undefined, locale: EmailLocale): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

/** Bouton principal. Table plutôt qu'un `<a>` stylé : Outlook ignore le padding. */
function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
  <tr>
    <td style="background:${BRAND};border-radius:999px;">
      <a href="${esc(url)}" style="display:inline-block;padding:14px 28px;font:600 14px/1 ${FONT};color:#ffffff;text-decoration:none;">${esc(label)}</a>
    </td>
  </tr>
</table>`;
}

function detailRows(rows: [string, string][]): string {
  if (rows.length === 0) return "";

  const cells = rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:7px 0;font:400 13px/1.5 ${FONT};color:${MUTED};">${esc(label)}</td>
        <td style="padding:7px 0;font:500 13px/1.5 ${FONT};color:${INK};text-align:right;">${esc(value)}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">
    ${cells}
  </table>`;
}

function orderBlock(data: EmailData, locale: EmailLocale): string {
  const order = data.order;
  if (!order) return "";

  const copy = EMAIL_COPY[locale].common;

  const items = order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;font:400 13px/1.45 ${FONT};color:${INK};">
          ${esc(item.name)}
          ${item.variantLabel ? `<span style="color:${MUTED};"> · ${esc(item.variantLabel)}</span>` : ""}
          <span style="color:${MUTED};"> × ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;font:500 13px/1.45 ${FONT};color:${INK};text-align:right;white-space:nowrap;">
          ${esc(money(item.lineTotal, order.currency, locale))}
        </td>
      </tr>`,
    )
    .join("");

  const totals: string[] = [];
  if (typeof order.subtotal === "number") {
    totals.push(
      `<tr><td style="padding:4px 0;font:400 13px/1.5 ${FONT};color:${MUTED};">${esc(copy.subtotalLabel)}</td><td style="padding:4px 0;font:400 13px/1.5 ${FONT};color:${INK};text-align:right;">${esc(money(order.subtotal, order.currency, locale))}</td></tr>`,
    );
  }
  if (order.discount && order.discount > 0) {
    totals.push(
      `<tr><td style="padding:4px 0;font:400 13px/1.5 ${FONT};color:${MUTED};">${esc(copy.discountLabel)}</td><td style="padding:4px 0;font:400 13px/1.5 ${FONT};color:#047857;text-align:right;">− ${esc(money(order.discount, order.currency, locale))}</td></tr>`,
    );
  }
  if (typeof order.shipping === "number") {
    totals.push(
      `<tr><td style="padding:4px 0;font:400 13px/1.5 ${FONT};color:${MUTED};">${esc(copy.shippingLabel)}</td><td style="padding:4px 0;font:400 13px/1.5 ${FONT};color:${INK};text-align:right;">${order.shipping === 0 ? "—" : esc(money(order.shipping, order.currency, locale))}</td></tr>`,
    );
  }
  totals.push(
    `<tr><td style="padding:10px 0 0;font:600 14px/1.5 ${FONT};color:${INK};border-top:1px solid ${LINE};">${esc(copy.totalLabel)}</td><td style="padding:10px 0 0;font:600 14px/1.5 ${FONT};color:${INK};text-align:right;border-top:1px solid ${LINE};">${esc(money(order.total, order.currency, locale))}</td></tr>`,
  );

  const details: [string, string][] = [];
  if (order.paymentMethod) {
    details.push([
      copy.paymentLabel,
      PAYMENT_LABELS[locale][order.paymentMethod] ?? order.paymentMethod,
    ]);
  }
  if (order.trackingNumber) {
    details.push([copy.trackingLabel, order.trackingNumber]);
  }
  if (order.address) {
    details.push([copy.addressLabel, order.address]);
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;background:${BG};border-radius:14px;">
    <tr><td style="padding:14px 18px 2px;font:600 11px/1.4 ${FONT};letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">${esc(copy.itemsLabel)}</td></tr>
    <tr><td style="padding:0 18px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">${totals.join("")}</table>
    </td></tr>
  </table>
  ${detailRows(details)}`;
}

function giftNotice(data: EmailData, locale: EmailLocale): string {
  if (!data.giftRecipientName) return "";
  const copy = EMAIL_COPY[locale].common;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#EEF2FF;border:1px solid #C7D2FE;border-radius:12px;">
    <tr><td style="padding:14px 16px;font:400 13px/1.6 ${FONT};color:#3730A3;">
      <strong style="display:block;margin-bottom:4px;">${esc(copy.giftFor)} ${esc(data.giftRecipientName)}</strong>
      ${data.giftMessage ? esc(data.giftMessage) : ""}
      ${data.giftScheduledAt ? `<span style="display:block;margin-top:4px;color:#4F46E5;">${esc(copy.giftScheduled)} ${esc(formatDate(data.giftScheduledAt, locale))}</span>` : ""}
    </td></tr>
  </table>`;
}

function giftBlock(data: EmailData, locale: EmailLocale): string {
  const copy = EMAIL_COPY[locale].common;
  const order = data.order;

  const items = (order?.items ?? [])
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;font:400 13px/1.45 ${FONT};color:${INK};">
          ${esc(item.name)}
          ${item.variantLabel ? `<span style="color:${MUTED};"> · ${esc(item.variantLabel)}</span>` : ""}
          <span style="color:${MUTED};"> × ${item.quantity}</span>
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:${BG};border-radius:14px;">
    <tr><td style="padding:14px 18px 2px;font:600 11px/1.4 ${FONT};letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">${esc(copy.giftItems)}</td></tr>
    <tr><td style="padding:0 18px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
    </td></tr>
  </table>
  ${data.giftMessage ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border-left:3px solid ${BRAND};">
    <tr><td style="padding:2px 0 2px 14px;font:400 14px/1.65 ${FONT};color:${INK};font-style:italic;">${esc(data.giftMessage)}</td></tr>
  </table>` : ""}
  ${detailRows([
    ...(data.giftRecipientName ? ([[copy.giftFor, data.giftRecipientName]] as [string, string][]) : []),
    ...(data.giftScheduledAt ? ([[copy.giftScheduled, formatDate(data.giftScheduledAt, locale)]] as [string, string][]) : []),
  ])}`;
}

function reasonBlock(data: EmailData, locale: EmailLocale): string {
  if (!data.reason) return "";
  const label = EMAIL_COPY[locale].common.reasonLabel;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;">
    <tr><td style="padding:14px 16px;font:400 13px/1.6 ${FONT};color:#7C2D12;">
      <strong style="display:block;margin-bottom:4px;">${esc(label)}</strong>
      ${esc(data.reason)}
    </td></tr>
  </table>`;
}

function bodyFor(
  template: EmailTemplate,
  data: EmailData,
  locale: EmailLocale,
): string {
  const copy = EMAIL_COPY[locale].common;

  switch (template) {
    case "contact_message":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:${BG};border-radius:14px;">
        <tr><td style="padding:16px 18px;font:400 14px/1.7 ${FONT};color:${INK};white-space:pre-wrap;">${esc(data.contactBody)}</td></tr>
      </table>
      ${detailRows([
        [copy.emailLabel, data.contactEmail ?? "—"],
      ])}`;

    case "gift_received":
      return giftBlock(data, locale);

    case "gift_claimed":
      return giftBlock(data, locale);

    case "order_confirmation":
    case "new_order":
    case "order_shipped":
    case "order_delivered":
    case "order_cancelled":
    case "order_refunded":
      return orderBlock(data, locale) + (template === "new_order" ? giftNotice(data, locale) : "");

    case "digital_access":
      return orderBlock(data, locale);

    case "booking_confirmation":
      return detailRows(
        [
          [copy.serviceLabel, data.bookingService ?? "—"],
          [copy.dateLabel, formatDate(data.bookingAt, locale)],
          [
            copy.orderLabel,
            data.order ? `#${data.order.number}` : "—",
          ],
        ],
      );

    case "team_invitation":
      return detailRows(
        [
          [copy.roleLabel, data.role ?? "—"],
          [copy.dateLabel, formatDate(new Date().toISOString(), locale)],
        ],
      );

    case "kyc_approved":
      return "";

    case "kyc_rejected":
      return reasonBlock(data, locale);

    case "payout_requested":
    case "payout_processed":
      return detailRows(
        [
          [copy.amountLabel, money(data.amount, data.currency, locale)],
          ...(data.payoutProvider
            ? ([[copy.paymentLabel, `${data.payoutProvider} ···· ${data.payoutLast4 ?? ""}`]] as [string, string][])
            : []),
          ...(data.reference ? ([[copy.referenceLabel, data.reference]] as [string, string][]) : []),
          ...(data.reason ? ([[copy.reasonLabel, data.reason]] as [string, string][]) : []),
        ],
      );

    default:
      return "";
  }
}

function ctaUrl(template: EmailTemplate, data: EmailData): string | null {
  switch (template) {
    case "welcome":
      return data.ctaUrl ?? null;
    case "contact_message":
      return data.contactEmail ? `mailto:${data.contactEmail}` : null;
    case "gift_received":
      return data.giftClaimUrl ?? null;
    case "digital_access":
      return data.downloadsUrl ?? data.orderUrl ?? data.ctaUrl ?? null;
    case "team_invitation":
      return data.inviteUrl ?? null;
    default:
      return data.orderUrl ?? data.ctaUrl ?? null;
  }
}

function layout(input: {
  locale: EmailLocale;
  preheader: string;
  storeName?: string | null;
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  ctaHtml: string;
  footerNote: string;
  questions: string;
}): string {
  const store = input.storeName?.trim();
  const brandLine =
    store && store.toLowerCase() !== "pashove"
      ? `<span style="font:600 15px/1.2 ${FONT};color:${INK};">Pashove</span><span style="font:400 15px/1.2 ${FONT};color:${MUTED};"> · ${esc(store)}</span>`
      : `<span style="font:600 15px/1.2 ${FONT};color:${INK};">Pashove</span>`;

  return `<div style="margin:0;padding:0;background:${BG};">
  <div style="display:none;font-size:1px;color:${BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:0 6px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:10px;">
              <span style="display:inline-block;width:30px;height:30px;border-radius:9px;background:${BRAND};color:#ffffff;font:700 15px/30px ${FONT};text-align:center;">P</span>
            </td>
            <td>${brandLine}</td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:20px;padding:32px 28px;">
          <p style="margin:0 0 10px;font:600 11px/1.4 ${FONT};letter-spacing:0.1em;text-transform:uppercase;color:${BRAND};">${esc(input.eyebrow)}</p>
          <h1 style="margin:0;font:600 24px/1.25 ${FONT};letter-spacing:-0.02em;color:${INK};">${esc(input.title)}</h1>
          <p style="margin:12px 0 0;font:400 14px/1.65 ${FONT};color:#4B5563;">${esc(input.lead)}</p>
          ${input.body}
          ${input.ctaHtml}
        </td></tr>

        <tr><td style="padding:18px 8px 4px;font:400 11.5px/1.6 ${FONT};color:#8A90A2;">
          ${esc(input.footerNote)}
          <br />${esc(input.questions)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`;
}

export function renderEmail(
  template: EmailTemplate,
  data: EmailData,
  locale: EmailLocale,
): RenderedEmail {
  const copy = EMAIL_COPY[locale];
  const t = copy.templates[template];

  const vars: Record<string, string> = {
    name: data.customerName?.trim() ?? "",
    contact: data.contactName?.trim() ?? data.customerName?.trim() ?? "",
    buyer: data.giftBuyerName?.trim() ?? data.customerName?.trim() ?? "",
    recipient: data.giftRecipientName?.trim() ?? data.customerName?.trim() ?? "",
    number: data.order ? String(data.order.number) : "",
    store: data.storeName?.trim() ?? "Pashove",
    amount: money(data.amount ?? data.order?.total, data.currency ?? data.order?.currency, locale),
    customer: data.customerName?.trim() ?? "",
    service: data.bookingService?.trim() ?? "",
    inviter: data.inviter?.trim() ?? "Pashove",
    status: data.statusLabel ?? "",
  };

  const subject = fill(t.subject, vars).replace(/\s+/g, " ").trim();
  const title = fill(t.title, vars).trim();
  const lead = fill(t.lead, vars).trim();
  const url = ctaUrl(template, data);
  const ctaLabel = t.cta ? fill(t.cta, vars) : null;

  const body = bodyFor(template, data, locale);
  const ctaHtml = ctaLabel && url ? button(url, ctaLabel) : "";

  const footerNote = fill(copy.common.footerNote, {
    store: data.storeName?.trim() ?? "Pashove",
  });

  const html = layout({
    locale,
    preheader: lead,
    storeName: data.storeName,
    eyebrow: t.eyebrow,
    title,
    lead,
    body,
    ctaHtml,
    footerNote,
    questions: copy.common.questions,
  });

  const textLines = [
    title,
    "",
    lead,
    "",
    ...plainBody(template, data, locale),
    ...(ctaLabel && url ? ["", `${ctaLabel}: ${url}`] : []),
    "",
    "—",
    footerNote,
    copy.common.questions,
  ];

  return { subject, html, text: textLines.join("\n") };
}

function plainBody(
  template: EmailTemplate,
  data: EmailData,
  locale: EmailLocale,
): string[] {
  const copy = EMAIL_COPY[locale].common;
  const lines: string[] = [];

  if (
    template === "order_confirmation" ||
    template === "new_order" ||
    template === "order_shipped" ||
    template === "order_delivered" ||
    template === "order_cancelled" ||
    template === "order_refunded" ||
    template === "digital_access" ||
    template === "gift_received" ||
    template === "gift_claimed"
  ) {
    const order = data.order;
    if (order) {
      lines.push(`${copy.orderLabel} #${order.number}`);
      for (const item of order.items) {
        lines.push(`- ${item.name} × ${item.quantity} — ${money(item.lineTotal, order.currency, locale)}`);
      }
      lines.push(`${copy.totalLabel}: ${money(order.total, order.currency, locale)}`);
      if (order.trackingNumber) {
        lines.push(`${copy.trackingLabel}: ${order.trackingNumber}`);
      }
    }
  }

  if (template === "booking_confirmation") {
    lines.push(`${copy.serviceLabel}: ${data.bookingService ?? "—"}`);
    lines.push(`${copy.dateLabel}: ${formatDate(data.bookingAt, locale)}`);
  }

  if (template === "kyc_rejected" && data.reason) {
    lines.push(`${copy.reasonLabel}: ${data.reason}`);
  }

  if (template === "contact_message") {
    if (data.contactName) lines.push(`${copy.emailLabel}: ${data.contactEmail ?? ""}`);
    if (data.contactBody) lines.push("", data.contactBody);
  }

  if (template === "payout_requested" || template === "payout_processed") {
    lines.push(`${copy.amountLabel}: ${money(data.amount, data.currency, locale)}`);
    if (data.reference) lines.push(`${copy.referenceLabel}: ${data.reference}`);
  }

  return lines;
}
