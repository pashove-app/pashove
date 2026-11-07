export type PaymentMethod =
  | "cod"
  | "orange_money"
  | "wave"
  | "mtn_money"
  | "moov_money"
  | "card";

export type PaymentProviderCode =
  | "saspay"
  | "mock"
  | "flutterwave"
  | "cinetpay"
  | "paydunya";

export type CheckoutPaymentOption = {
  code: PaymentMethod;
  provider: "cod" | "mock" | "saspay";
  kind: "cod" | "mobile_money" | "card";
  requiresPhone: boolean;
  requiresCard: boolean;
};

export type PaymentIntent = {
  reference: string;
  provider: PaymentProviderCode;
  method: PaymentMethod;
  amount: number;
  currency: string;
  orderId: string;
  status: "requires_action" | "pending";
  /** URL hébergée SasPay quand le réseau ne pousse pas sur le téléphone. */
  redirectUrl?: string | null;
  networkCode?: string | null;
};

export type PaymentConfirmation = {
  status: "succeeded" | "failed";
  reference: string;
  failureReason?: string;
};

export type AdminPaymentTransaction = {
  paymentId: string;
  orderId: string;
  orderNumber: number;
  storeName: string;
  storeSlug: string;
  provider: string;
  method: PaymentMethod;
  status: string;
  orderStatus: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  customerName: string;
  createdAt: string;
  reference: string | null;
};

export type AdminPaymentProvider = {
  code: PaymentProviderCode;
  name: string;
  status: "active" | "not_configured" | "disabled";
  mode: "test" | "live";
  configured: boolean;
  updatedAt: string;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  "cod",
  "orange_money",
  "wave",
  "mtn_money",
  "moov_money",
  "card",
];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && PAYMENT_METHODS.includes(value as PaymentMethod);
}

export const ONLINE_METHODS: PaymentMethod[] = [
  "orange_money",
  "wave",
  "mtn_money",
  "moov_money",
  "card",
];

export function isOnlineMethod(value: PaymentMethod): boolean {
  return ONLINE_METHODS.includes(value);
}

export function methodMeta(
  method: PaymentMethod,
  provider: "mock" | "saspay" = "mock",
): CheckoutPaymentOption {
  if (method === "cod") {
    return { code: method, provider: "cod", kind: "cod", requiresPhone: false, requiresCard: false };
  }
  if (method === "card") {
    return { code: method, provider, kind: "card", requiresPhone: false, requiresCard: true };
  }
  return { code: method, provider, kind: "mobile_money", requiresPhone: true, requiresCard: false };
}
