export type StudioBalance = {
  balanceFcfa: number;
  totalRecharged: number;
  totalSpent: number;
};

export type StudioPrice = {
  actionType: string;
  priceFcfa: number;
  label: string;
  description: string | null;
};

export type StudioGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type StudioGeneration = {
  id: string;
  actionType: string;
  prompt: string;
  pricePaidFcfa: number;
  status: StudioGenerationStatus;
  resultText: string | null;
  videoUrl: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type StudioPendingTopup = {
  id: string;
  amountFcfa: number;
  createdAt: string;
};

export type StudioTopup = {
  id: string;
  amountFcfa: number;
  status: "pending" | "initiated" | "paid" | "failed";
  provider: "saspay" | "manual" | "welcome";
  note: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type StudioSnapshot = {
  /** Faux tant que la migration Studio n'est pas appliquée. */
  ready: boolean;
  balance: StudioBalance;
  prices: StudioPrice[];
  generations: StudioGeneration[];
  pendingTopup: StudioPendingTopup | null;
};
