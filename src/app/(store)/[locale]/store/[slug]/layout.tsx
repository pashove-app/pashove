import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { CartProvider } from "@/components/storefront/cart-provider";
import { WishlistProvider } from "@/components/storefront/wishlist-provider";
import { LOCALE_META, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { readCart } from "@/lib/storefront/cart";
import { loadStorefront } from "@/lib/storefront/queries";

/**
 * Enveloppe client commune à toutes les pages d'une boutique : le panier,
 * son tiroir et le compteur de l'en-tête restent montés entre les pages.
 */
export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;

  if (!isLocale(raw)) return children;

  const { status, store } = await loadStorefront(slug);
  const [t, cart] = await Promise.all([
    getDictionary(raw),
    status === "active"
      ? readCart(LOCALE_META[raw].tag)
      : Promise.resolve(null),
  ]);

  const mediaBase = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");

  return (
    <MotionConfig reducedMotion="user">
      <WishlistProvider storeId={store?.id ?? slug}>
        <CartProvider
          slug={slug}
          locale={raw}
          initialCart={cart}
          mediaBase={mediaBase}
          localeTag={LOCALE_META[raw].tag}
          labels={t.storefront}
        >
          {children}
        </CartProvider>
      </WishlistProvider>
    </MotionConfig>
  );
}
