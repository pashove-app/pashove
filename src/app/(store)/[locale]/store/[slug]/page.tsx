import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import {
  BundlesSection,
  CollectionsSection,
} from "@/components/storefront/storefront-sections";
import { Reveal } from "@/components/storefront/reveal";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontHero } from "@/components/storefront/storefront-hero";
import { ThemeBlocks } from "@/components/storefront/theme-blocks";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { TrustStrip } from "@/components/storefront/trust-strip";
import { LOCALE_META, isLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import { listStoreProducts } from "@/lib/storefront/products";
import { listPublicBundles } from "@/lib/storefront/bundles";
import { listPublicCollections } from "@/lib/storefront/collections";
import { loadStorefront } from "@/lib/storefront/queries";
import { getPublicStoreTheme } from "@/lib/theme/queries";

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
    store.hero_subtitle?.trim() ||
    store.description?.trim() ||
    interpolate(t.storefront.metaFallback, { name: store.name });

  return {
    title: store.hero_title ? `${store.hero_title} · ${store.name}` : store.name,
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

  const [products, collections, bundles, theme] = await Promise.all([
    listStoreProducts(store.id),
    listPublicCollections(store.id),
    listPublicBundles(store.id, store.currency, LOCALE_META[locale].tag),
    getPublicStoreTheme(store.slug),
  ]);
  const sections = theme.sections.filter((section) => section.enabled);
  const bannerUrl = store.banner ? publicUrl(store.banner.object_key) : null;

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />

      <main>
        <StorefrontHero
          store={store}
          bannerUrl={bannerUrl}
          labels={t.storefront}
        />

        <TrustStrip store={store} locale={locale} t={t} />

        <Container className="mt-16 space-y-16 sm:mt-20 sm:space-y-24">
          {sections.map((section) => {
            if (section.key === "products") {
              return (
                <Reveal key={section.key}>
                  <ProductGrid
                    t={t}
                    locale={locale}
                    slug={slug}
                    products={products.slice(0, 8)}
                    currency={store.currency}
                    localeTag={LOCALE_META[locale].tag}
                  />
                </Reveal>
              );
            }

            if (section.key === "collections" && collections.length > 0) {
              return (
                <Reveal key={section.key}>
                  <CollectionsSection
                    collections={collections}
                    storeSlug={slug}
                    locale={locale}
                    labels={t.storefront}
                  />
                </Reveal>
              );
            }

            if (section.key === "bundles" && bundles.length > 0) {
              return (
                <Reveal key={section.key}>
                  <BundlesSection
                    bundles={bundles}
                    storeSlug={slug}
                    locale={locale}
                    labels={t.storefront}
                  />
                </Reveal>
              );
            }

            return null;
          })}

          <ThemeBlocks blocks={theme.blocks} />
        </Container>
      </main>
    </StorefrontShell>
  );
}
