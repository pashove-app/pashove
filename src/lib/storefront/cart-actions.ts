"use server";

import type { CartPayload, CartActionResult, CartView } from "@/lib/storefront/cart-types";
import {
  decorateCart,
  openCart,
  readCartToken,
  withoutToken,
} from "@/lib/storefront/cart";
import { createPublicClient } from "@/lib/supabase/public";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

function cartError(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("out_of_stock")) return "out_of_stock";
  if (message.includes("variant_required")) return "variant_required";
  if (message.includes("invalid_variant")) return "variant_required";
  if (message.includes("bundle_unavailable")) return "product_unavailable";
  if (message.includes("product_unavailable")) return "product_unavailable";
  if (message.includes("store_unavailable")) return "store_unavailable";
  if (message.includes("cart_unavailable")) return "cart_unavailable";

  return "generic";
}

function discountError(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("discount_not_found")) return "discountNotFound";
  if (message.includes("discount_inactive")) return "discountInactive";
  if (message.includes("discount_not_started")) return "discountNotStarted";
  if (message.includes("discount_expired")) return "discountExpired";
  if (message.includes("discount_exhausted")) return "discountExhausted";
  if (message.includes("discount_min_subtotal")) return "discountMinSubtotal";

  return "discountApplyError";
}

export async function addToCartAction(input: {
  slug: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  localeTag: string;
}): Promise<CartActionResult> {
  const slug = typeof input.slug === "string" ? input.slug.trim() : "";
  const localeTag =
    typeof input.localeTag === "string" ? input.localeTag.slice(0, 20) : "fr-FR";
  const quantity = Math.min(Math.max(Math.trunc(input.quantity) || 1, 1), 99);

  if (!slug || !isUuid(input.productId)) {
    return { cart: null, error: "product_unavailable" };
  }

  if (input.variantId !== null && !isUuid(input.variantId)) {
    return { cart: null, error: "variant_required" };
  }

  try {
    const opened = await openCart(slug);
    const supabase = createPublicClient();

    const { data, error } = await supabase.rpc("cart_add", {
      p_token: opened.token,
      p_product_id: input.productId,
      p_variant_id: input.variantId,
      p_quantity: quantity,
    });

    if (error || !data) {
      return {
        cart: decorateCart(withoutToken(opened), localeTag),
        error: cartError(error ?? {}),
      };
    }

    const view: CartView = decorateCart(data as CartPayload, localeTag);
    return { cart: view };
  } catch {
    return { cart: null, error: "cart_unavailable" };
  }
}

export async function addBundleToCartAction(input: {
  slug: string;
  bundleId: string;
  quantity: number;
  localeTag: string;
}): Promise<CartActionResult> {
  const slug = typeof input.slug === "string" ? input.slug.trim() : "";
  const localeTag =
    typeof input.localeTag === "string" ? input.localeTag.slice(0, 20) : "fr-FR";
  const quantity = Math.min(Math.max(Math.trunc(input.quantity) || 1, 1), 99);

  if (!slug || !isUuid(input.bundleId)) {
    return { cart: null, error: "product_unavailable" };
  }

  try {
    const opened = await openCart(slug);
    const supabase = createPublicClient();

    const { data, error } = await supabase.rpc("cart_add_bundle", {
      p_token: opened.token,
      p_bundle_id: input.bundleId,
      p_quantity: quantity,
    });

    if (error || !data) {
      return {
        cart: decorateCart(withoutToken(opened), localeTag),
        error: cartError(error ?? {}),
      };
    }

    const view: CartView = decorateCart(data as CartPayload, localeTag);
    return { cart: view };
  } catch {
    return { cart: null, error: "cart_unavailable" };
  }
}

export async function applyDiscountAction(input: {
  code: string;
  localeTag: string;
}): Promise<CartActionResult> {
  const localeTag =
    typeof input.localeTag === "string" ? input.localeTag.slice(0, 20) : "fr-FR";
  const code =
    typeof input.code === "string" ? input.code.trim().slice(0, 32) : "";

  if (!code) return { cart: null, error: "discountNotFound" };

  const token = await readCartToken();
  if (!token) return { cart: null, error: "discountApplyError" };

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("cart_apply_discount", {
    p_token: token,
    p_code: code,
  });

  if (error || !data) {
    return { cart: null, error: discountError(error ?? {}) };
  }

  return { cart: decorateCart(data as CartPayload, localeTag) };
}

export async function removeDiscountAction(input: {
  localeTag: string;
}): Promise<CartActionResult> {
  const localeTag =
    typeof input.localeTag === "string" ? input.localeTag.slice(0, 20) : "fr-FR";
  const token = await readCartToken();
  if (!token) return { cart: null, error: "discountApplyError" };

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("cart_remove_discount", {
    p_token: token,
  });

  if (error || !data) {
    return { cart: null, error: discountError(error ?? {}) };
  }

  return { cart: decorateCart(data as CartPayload, localeTag) };
}

export async function updateCartItemAction(input: {
  itemId: string;
  quantity: number;
  localeTag: string;
}): Promise<CartActionResult> {
  const localeTag =
    typeof input.localeTag === "string" ? input.localeTag.slice(0, 20) : "fr-FR";
  const token = await readCartToken();
  if (!token) return { cart: null, error: "cart_unavailable" };
  if (!isUuid(input.itemId)) return { cart: null, error: "generic" };

  const quantity = Math.min(Math.max(Math.trunc(input.quantity) || 0, 0), 99);
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("cart_set_quantity", {
    p_token: token,
    p_item_id: input.itemId,
    p_quantity: quantity,
  });

  if (error || !data) {
    return { cart: null, error: cartError(error ?? {}) };
  }

  return { cart: decorateCart(data as CartPayload, localeTag) };
}

export async function removeCartItemAction(input: {
  itemId: string;
  localeTag: string;
}): Promise<CartActionResult> {
  const localeTag =
    typeof input.localeTag === "string" ? input.localeTag.slice(0, 20) : "fr-FR";
  const token = await readCartToken();
  if (!token) return { cart: null, error: "cart_unavailable" };
  if (!isUuid(input.itemId)) return { cart: null, error: "generic" };

  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("cart_remove", {
    p_token: token,
    p_item_id: input.itemId,
  });

  if (error || !data) {
    return { cart: null, error: cartError(error ?? {}) };
  }

  return { cart: decorateCart(data as CartPayload, localeTag) };
}
