import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { BrandedLinks } from "@/components/storefront/branded-links";
import { CartProvider } from "@/components/storefront/cart-provider";
import { WishlistProvider } from "@/components/storefront/wishlist-provider";
import { LOCALE_META, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { normalizeHost } from "@/lib/domains/hosts";
import { readCart } from "@/lib/storefront/cart";
import { loadStorefront } from "@/lib/storefront/queries";

/**
 * Sur un domaine marqué, les URLs canoniques et les images Open Graph doivent
 * pointer vers ce domaine, pas vers pashove.com.
 */
export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  if (requestHeaders.get("x-pashove-branded") !== "1") return {};

  const host = normalizeHost(requestHeaders.get("host"));
  if (!host) return {};

  return { metadataBase: new URL(`https://${host}`) };
}

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
  const [t, storedCart] = await Promise.all([
    getDictionary(raw),
    status === "active"
      ? readCart(LOCALE_META[raw].tag)
      : Promise.resolve(null),
  ]);

  // Un panier d'une autre boutique ne doit jamais s'afficher ici.
  const cart =
    storedCart && store && storedCart.storeId === store.id
      ? storedCart
      : null;

  const mediaBase = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  const branded = (await headers()).get("x-pashove-branded") === "1";

  return (
    <MotionConfig reducedMotion="user">
      {branded ? <BrandedLinks locale={raw} slug={slug} /> : null}
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
