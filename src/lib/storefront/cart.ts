import { cookies } from "next/headers";
import type { CartPayload, CartView } from "@/lib/storefront/cart-types";
import { formatMoney } from "@/lib/money";
import { createPublicClient } from "@/lib/supabase/public";

export const CART_COOKIE = "pashove_cart";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCartToken(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** Formate les montants côté serveur, une fois pour toutes. */
export function decorateCart(cart: CartPayload, localeTag: string): CartView {
  const price = (amount: number) => formatMoney(amount, cart.currency, localeTag);

  return {
    ...cart,
    subtotalLabel: price(cart.subtotal),
    discountAmountLabel:
      cart.discountAmount > 0 ? price(cart.discountAmount) : null,
    shippingLabel: cart.shipping === 0 ? "" : price(cart.shipping),
    totalLabel: price(cart.total),
    items: cart.items.map((item) => ({
      ...item,
      unitPriceLabel: price(item.unitPrice),
      lineTotalLabel: price(item.lineTotal),
      compareAtLabel:
        item.compareAt && item.compareAt > item.unitPrice
          ? price(item.compareAt)
          : null,
      serviceStartsAtLabel: item.serviceStartsAt
        ? new Intl.DateTimeFormat(localeTag, {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Africa/Abidjan",
          }).format(new Date(item.serviceStartsAt))
        : null,
    })),
  };
}

/** Le panier courant, sans en créer un pour un simple visiteur. */
export async function readCart(localeTag: string): Promise<CartView | null> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!isCartToken(token)) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("cart_get", { p_token: token });

  if (error) return null;

  const cart = data as CartPayload | null;
  return cart ? decorateCart(cart, localeTag) : null;
}

/**
 * Ouvre ou retrouve le panier de la boutique et repose le cookie.
 *
 * Le jeton ne quitte jamais le serveur : il est écrit dans un cookie
 * HttpOnly, jamais renvoyé au navigateur dans le JSON.
 */
export async function openCart(
  slug: string,
): Promise<CartPayload & { token: string }> {
  const jar = await cookies();
  const current = jar.get(CART_COOKIE)?.value;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("cart_open", {
    p_slug: slug,
    p_token: isCartToken(current) ? current : null,
  });

  if (error || !data) throw new Error("cart_open");

  const payload = data as CartPayload & { token: string };

  jar.set(CART_COOKIE, payload.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return payload;
}

/** Le jeton seul, pour les actions qui n'ont pas besoin d'ouvrir un panier. */
export async function readCartToken(): Promise<string | null> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  return isCartToken(token) ? token : null;
}

/** Retire le jeton avant de renvoyer un panier au navigateur. */
export function withoutToken(
  cart: CartPayload & { token?: string },
): CartPayload {
  const copy: CartPayload & { token?: string } = { ...cart };
  delete copy.token;
  return copy;
}
