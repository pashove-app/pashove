import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { LOCALE_META, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listStoreProducts } from "@/lib/storefront/products";
import { loadStorefront } from "@/lib/storefront/queries";

export const revalidate = 60;
export const metadata: Metadata = { robots: { index: true, follow: true } };

export default async function StoreServicesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const { store } = await loadStorefront(slug);
  if (!store) notFound();

  const [t, products] = await Promise.all([
    getDictionary(locale),
    listStoreProducts(store.id),
  ]);
  const services = products.filter((product) => product.product_type === "service");

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <Container className="py-12 sm:py-16">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
          Prestations
        </p>
        <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.03em] text-fg sm:text-[2.5rem]">
          Services
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          Prestations et rendez-vous proposés par {store.name}.
        </p>

        <div className="mt-8">
          <ProductGrid
            t={t}
            locale={locale}
            slug={store.slug}
            products={services}
            currency={store.currency}
            localeTag={LOCALE_META[locale].tag}
            hideHeader
          />
        </div>
      </Container>
    </StorefrontShell>
  );
}
