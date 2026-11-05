/** Locales réellement traduites dans les e-mails. Les autres retombent sur le français. */
export type EmailLocale = "fr" | "en";

export type EmailTemplate =
  | "welcome"
  | "order_confirmation"
  | "new_order"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_refunded"
  | "digital_access"
  | "booking_confirmation"
  | "team_invitation"
  | "kyc_approved"
  | "kyc_rejected"
  | "payout_requested"
  | "payout_processed";

/** Catégories de notifications que le marchand peut couper. */
export type EmailKind = "new_order" | "order_cancelled" | "kyc" | "payout";

export const EMAIL_KINDS: EmailKind[] = [
  "new_order",
  "order_cancelled",
  "kyc",
  "payout",
];

export type EmailItem = {
  name: string;
  variantLabel?: string | null;
  quantity: number;
  lineTotal: number;
};

export type EmailOrder = {
  number: number;
  currency: string;
  total: number;
  subtotal?: number | null;
  discount?: number | null;
  shipping?: number | null;
  items: EmailItem[];
  trackingNumber?: string | null;
  paymentMethod?: string | null;
  address?: string | null;
};

export type EmailData = {
  storeName?: string | null;
  storeUrl?: string | null;
  customerName?: string | null;
  order?: EmailOrder | null;
  amount?: number | null;
  currency?: string | null;
  reference?: string | null;
  statusLabel?: string | null;
  reason?: string | null;
  inviteUrl?: string | null;
  role?: string | null;
  inviter?: string | null;
  payoutProvider?: string | null;
  payoutLast4?: string | null;
  bookingAt?: string | null;
  bookingService?: string | null;
  downloadsUrl?: string | null;
  orderUrl?: string | null;
  ctaUrl?: string | null;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export type SendEmailInput = {
  template: EmailTemplate;
  to: string;
  toName?: string | null;
  locale?: string | null;
  storeId?: string | null;
  data: EmailData;
};
