export type PaymentMethod =
  | "cod"
  | "orange_money"
  | "wave"
  | "mtn_money"
  | "moov_money"
  | "mobile_money"
  | "card";

export type PaymentProviderCode =
  | "saspay"
  | "mock"
  | "flutterwave"
  | "cinetpay"
  | "paydunya";

export type CheckoutBrand = {
  /** Couleur de la pastille, fournie par la plateforme. */
  color: string;
  /** Sigle court affiché dans la pastille. */
  short: string;
};

export type CheckoutPaymentOption = {
  /** Code réseau SasPay (`orange_ml`), ou `cod`. */
  code: string;
  /** Famille comptable appliquée au ledger. */
  method: PaymentMethod;
  provider: "cod" | "mock" | "saspay";
  kind: "cod" | "mobile_money" | "card";
  label: string;
  brand: CheckoutBrand;
  requiresPhone: boolean;
  requiresCard: boolean;
  requiresOtp: boolean;
  otpInstructions?: string;
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
  "mobile_money",
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
  "mobile_money",
  "card",
];

export function isOnlineMethod(value: PaymentMethod): boolean {
  return ONLINE_METHODS.includes(value);
}

/** Option minimale, utilisée seulement pour valider un code connu. */
export function methodMeta(
  method: PaymentMethod,
  provider: "mock" | "saspay" = "mock",
): CheckoutPaymentOption {
  const brand = { color: "#334155", short: method.slice(0, 2).toUpperCase() };

  if (method === "cod") {
    return {
      code: method, method, provider: "cod", kind: "cod", label: "",
      brand, requiresPhone: false, requiresCard: false, requiresOtp: false,
    };
  }

  if (method === "card") {
    return {
      code: method, method, provider, kind: "card", label: "",
      brand, requiresPhone: false, requiresCard: true, requiresOtp: false,
    };
  }

  return {
    code: method, method, provider, kind: "mobile_money", label: "",
    brand, requiresPhone: true, requiresCard: false, requiresOtp: false,
  };
}
