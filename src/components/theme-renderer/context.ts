import type { Locale } from "@/i18n/config";
import type { PricedStoreProduct } from "@/lib/storefront/products";
import type { ServiceSlot } from "@/lib/storefront/service-slots";

export type ThemeNavItem = {
  label: string;
  href: string;
};

export type ThemeProductCard = {
  id: string;
  name: string;
  slug: string;
  priceLabel: string;
  compareAtLabel: string | null;
  imageUrl: string | null;
  vendor?: string | null;
  badge?: string | null;
  discountPercent?: number | null;
  createdAt?: string;
  soldCount?: number;
};

export type ThemeCollectionCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};

export type ThemePostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  author: string | null;
};

export type ThemePageData = {
  title: string;
  content: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  author?: string | null;
};

export type ThemeCartLine = {
  id: string;
  name: string;
  quantity: number;
  priceLabel: string;
  imageUrl: string | null;
};

export type ThemeCartData = {
  lines: ThemeCartLine[];
  subtotalLabel: string;
  count: number;
};

export type ThemeRenderContext = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  homePath: string;
  locale: Locale;
  localeTag: string;
  currency: string;
  country: string;
  description: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  codEnabled: boolean;
  shippingLabel: string | null;
  paymentMethods: string[];
  nav: ThemeNavItem[];
  products: ThemeProductCard[];
  collections: ThemeCollectionCard[];
  product?: PricedStoreProduct;
  productImages?: string[];
  serviceSlots?: ServiceSlot[];
  collection?: {
    name: string;
    description: string | null;
    imageUrl: string | null;
    products: ThemeProductCard[];
  };
  page?: ThemePageData;
  posts?: ThemePostCard[];
  article?: ThemePageData;
  search?: {
    query: string;
    results: ThemeProductCard[];
    emptyText: string;
  };
  cart?: ThemeCartData;
  metafields?: Record<string, Record<string, unknown>>;
  appEmbeds?: { appId: string; name: string; settings: Record<string, unknown> }[];
};

export type ThemeRenderFlags = {
  editable?: boolean;
  selectedSectionId?: string | null;
  selectedBlockId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  onSelectBlock?: (sectionId: string, blockId: string) => void;
  device?: "desktop" | "tablet" | "mobile";
  market?: string;
  loggedIn?: boolean;
  showChrome?: boolean;
};
