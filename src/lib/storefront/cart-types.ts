export type CartBundleEntry = {
  name: string;
  variantLabel: string | null;
};

export type CartItem = {
  id: string;
  kind: "product" | "bundle";
  productId: string | null;
  bundleId: string | null;
  bundleItems: CartBundleEntry[];
  name: string;
  slug: string;
  productType: "physical" | "digital" | "service" | "bundle";
  variantLabel: string | null;
  unitPrice: number;
  compareAt: number | null;
  imageKey: string | null;
  quantity: number;
  stock: number | null;
  available: boolean;
  lineTotal: number;
};

export type CartDiscount = {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  amount: number;
};

export type CartPayload = {
  id: string;
  storeId: string;
  checkoutKey: string;
  currency: string;
  codEligible: boolean;
  subtotal: number;
  discountAmount: number;
  discount: CartDiscount | null;
  shipping: number;
  total: number;
  items: CartItem[];
};

export type CartActionResult = {
  cart: CartView | null;
  error?: string;
};

export type CartItemView = CartItem & {
  unitPriceLabel: string;
  lineTotalLabel: string;
  compareAtLabel: string | null;
};

/** Panier prêt à afficher : les montants sont formatés par le serveur. */
export type CartView = Omit<CartPayload, "items"> & {
  items: CartItemView[];
  subtotalLabel: string;
  discountAmountLabel: string | null;
  shippingLabel: string;
  totalLabel: string;
};
