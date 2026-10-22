import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartPage } from "@/components/storefront/cart-page";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadStorefront } from "@/lib/storefront/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return { title: "Panier" };

  const { status, store } = await loadStorefront(slug);
  const t = await getDictionary(locale);

  return {
    title: store ? `${t.storefront.cartTitle} · ${store.name}` : t.storefront.cartTitle,
    robots: status === "active" ? undefined : { index: false, follow: false },
  };
}

export default async function CartRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  return (
    <StorefrontShell footerLabel={t.storefront.poweredBy}>
      <StorefrontHeader store={store} />
      <main>
        <CartPage />
      </main>
    </StorefrontShell>
  );
}
