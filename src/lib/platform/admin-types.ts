export type AdminDashboard = {
  gmv30: number;
  orders30: number;
  gmvAll: number;
  commissionDue: number;
  activeMerchants: number;
  activeStores: number;
  totalStores: number;
  customers: number;
  kycPending: number;
  payoutsPending: number;
  failedPayments: number;
  series: { date: string; amount: number }[];
  topMerchants: {
    userId: string;
    name: string;
    email: string;
    plan: string;
    stores: number;
    gmv: number;
  }[];
};

export type AdminMerchant = {
  userId: string;
  name: string;
  email: string;
  plan: string;
  planName: string;
  stores: number;
  storeNames: string | null;
  gmv: number;
  currency: string;
  kyc: string;
  suspended: boolean;
  createdAt: string;
};

export type AdminMerchantDetail = {
  merchant: {
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    country: string | null;
    language: string;
    plan: string;
    planName: string;
    suspended: boolean;
    createdAt: string;
  } | null;
  stores: {
    id: string;
    name: string;
    slug: string;
    status: string;
    country: string;
    currency: string;
  }[];
  orders: {
    id: string;
    number: number;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
    createdAt: string;
    storeName: string;
  }[];
  payouts: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    requestedAt: string;
    storeName: string;
  }[];
  kyc: {
    id: string;
    status: string;
    legalName: string;
    submittedAt: string;
    storeName: string;
  }[];
};

export type AdminStore = {
  id: string;
  name: string;
  slug: string;
  status: string;
  country: string;
  currency: string;
  createdAt: string;
  ownerName: string | null;
  ownerEmail: string | null;
  plan: string;
  orders: number;
  gmv: number;
  kyc: string;
};

export type AdminStoreDetail = {
  store: {
    id: string;
    name: string;
    slug: string;
    status: string;
    country: string;
    currency: string;
    createdAt: string;
    description: string | null;
  } | null;
  owner: { userId: string; name: string; email: string } | null;
  orders: {
    id: string;
    number: number;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
    customerName: string;
    createdAt: string;
  }[];
};

export type AdminUser = {
  userId: string;
  name: string;
  email: string;
  language: string;
  createdAt: string;
  suspended: boolean;
  platformAdmin: boolean;
  merchant: boolean;
  stores: number;
  orders: number;
};

export type AdminUserDetail = {
  user: {
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    country: string | null;
    language: string;
    suspended: boolean;
    createdAt: string;
    platformAdmin: boolean;
  } | null;
  stores: { id: string; name: string; slug: string; status: string }[];
  orders: {
    id: string;
    number: number;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
    createdAt: string;
    storeName: string;
  }[];
};

export type AdminPlan = {
  code: string;
  name: string;
  commissionBps: number;
  maxStores: number;
  maxMembers: number;
  priceAmount: number;
  currency: string;
};

export type AdminPlatformAdmin = {
  userId: string;
  role: string;
  name: string;
  email: string;
};

export type AdminSettingsData = {
  settings: Record<string, boolean>;
  plans: AdminPlan[];
  admins: AdminPlatformAdmin[];
};
