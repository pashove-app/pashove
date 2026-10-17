import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/storefront/product-grid";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontContact } from "@/components/storefront/storefront-contact";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontHero } from "@/components/storefront/storefront-hero";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import { loadStorefront } from "@/lib/storefront/queries";

/**
 * La vitrine est publique et ne dépend d'aucune session : elle peut être mise
 * en cache. Une minute de retard au pire après une modification du marchand.
 */
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return { robots: { index: false, follow: false } };

  const { status, store } = await loadStorefront(slug);
  const t = await getDictionary(locale);

  if (status !== "active" || !store) {
    return {
      title: t.storefront.notFoundTitle,
      robots: { index: false, follow: false },
    };
  }

  const description =
    store.description?.trim() ||
    interpolate(t.storefront.metaFallback, { name: store.name });

  return {
    title: store.name,
    description,
    alternates: { canonical: `/${locale}/store/${store.slug}` },
    openGraph: {
      title: store.name,
      description,
      type: "website",
      url: `/${locale}/store/${store.slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function StorefrontPage({
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

      <main className="pb-4">
        <StorefrontHero store={store} />
        <ProductGrid t={t} />
        <StorefrontContact t={t} store={store} />
      </main>
    </StorefrontShell>
  );
}
