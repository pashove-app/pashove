export type CartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  productType: "physical" | "digital" | "service";
  variantLabel: string | null;
  unitPrice: number;
  compareAt: number | null;
  imageKey: string | null;
  quantity: number;
  stock: number | null;
  available: boolean;
  lineTotal: number;
};

export type CartPayload = {
  id: string;
  storeId: string;
  checkoutKey: string;
  currency: string;
  codEligible: boolean;
  subtotal: number;
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
};

/** Panier prêt à afficher : les montants sont formatés par le serveur. */
export type CartView = Omit<CartPayload, "items"> & {
  items: CartItemView[];
  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;
};
