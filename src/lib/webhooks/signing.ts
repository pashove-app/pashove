import { createHmac } from "node:crypto";

export const WEBHOOK_EVENTS = [
  "order.created",
  "order.paid",
  "order.updated",
  "order.cancelled",
  "order.refund_requested",
  "order.refunded",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function webhookSignature(
  secret: string,
  body: string,
  timestamp: string,
): string {
  return `sha256=${createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex")}`;
}

/** Les événements métier sont stables côté API, pas les types internes. */
export function eventForOrderEvent(type: string): WebhookEvent | null {
  if (type === "created") return "order.created";
  if (type === "payment_collected") return "order.paid";
  if (type === "status_changed") return "order.updated";
  if (type === "cancelled") return "order.cancelled";
  if (type === "refund_requested") return "order.refund_requested";
  if (type === "refunded") return "order.refunded";
  return null;
}

const PRIVATE_HOST =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1|\[::1\]|.*\.local$)/i;

export function isSafeWebhookUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (PRIVATE_HOST.test(url.hostname)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)) return false;

  return true;
}
