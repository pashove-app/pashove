import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  listStoreProductsByTag,
} from "@/lib/storefront/products";
import { loadStorefront } from "@/lib/storefront/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, slug, tag } = await params;
  if (!isLocale(locale)) return { robots: { index: false, follow: false } };

  const { status, store } = await loadStorefront(slug);
  const t = await getDictionary(locale);

  if (status !== "active" || !store) {
    return { title: t.storefront.notFoundTitle, robots: { index: false, follow: false } };
  }

  return {
    title: `${tag} · ${store.name}`,
    description: `${tag} — ${store.name}`,
    alternates: {
      canonical: `/${locale}/store/${store.slug}/collections/${encodeURIComponent(tag)}`,
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; tag: string }>;
}) {
  const { locale, slug, tag } = await params;
  if (!isLocale(locale)) notFound();

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const products = await listStoreProductsByTag(store.id, tag);
  const labels = t.storefront;
  const countLabel = (
    products.length === 1 ? labels.collectionCount : labels.collectionCountPlural
  ).replace("{count}", String(products.length));

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />

      <main>
        <Container className="pt-8 sm:pt-10">
          <Link
            href={path(locale, `/store/${slug}`)}
            className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
          >
            <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" strokeWidth={2} />
            {labels.backToShop}
          </Link>

          <p className="mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
            {labels.collectionPageTitle}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className="text-[2rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.5rem]">
              {tag}
            </h1>
            <span className="text-[0.8125rem] text-subtle">{countLabel}</span>
          </div>
        </Container>

        <Container className="mt-8">
          <ProductGrid
            t={t}
            locale={locale}
            slug={slug}
            products={products}
            currency={store.currency}
            localeTag={LOCALE_META[locale].tag}
            hideHeader
          />
        </Container>
      </main>
    </StorefrontShell>
  );
}
