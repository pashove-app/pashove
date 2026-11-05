export type GiftStatus = "pending" | "claimed" | "expired" | "cancelled";

export type GiftItem = {
  name: string;
  variantLabel: string | null;
  productType: "physical" | "digital" | "service" | "bundle";
  quantity: number;
  imageKey: string | null;
  lineTotal: number;
};

export type GiftDigitalItem = {
  entitlementId: string;
  productName: string;
  fileName: string | null;
  remaining: number;
  status: string;
};

export type GiftInfo = {
  token: string;
  status: GiftStatus;
  recipientName: string;
  message: string | null;
  scheduledAt: string;
  claimedAt: string | null;
  expiresAt: string;
  buyerName: string;
  orderNumber: number;
  currency: string;
  total: number;
  storeName: string;
  storeSlug: string;
  storeLogoKey: string | null;
  canClaim: boolean;
  items: GiftItem[];
  hasPhysical: boolean;
  hasDigital: boolean;
  hasService: boolean;
  serviceProductId: string | null;
  serviceDuration: number;
  bookedSlots: string[];
  digitalItems: GiftDigitalItem[];
};

export type MerchantGift = {
  id: string;
  token: string;
  status: GiftStatus;
  recipientName: string;
  recipientEmail: string;
  message: string | null;
  scheduledAt: string;
  claimedAt: string | null;
  createdAt: string;
  orderId: string | null;
  orderNumber: number | null;
  buyerName: string | null;
  total: number | null;
  currency: string | null;
  items: GiftItem[];
};

export type ReceivedGift = {
  id: string;
  token: string;
  status: GiftStatus;
  recipientName: string;
  message: string | null;
  scheduledAt: string;
  claimedAt: string | null;
  createdAt: string;
  orderNumber: number | null;
  storeName: string;
  storeSlug: string;
  items: GiftItem[];
};

export type GiftClaimState = {
  status: "idle" | "error";
  messageKey?: string;
};
