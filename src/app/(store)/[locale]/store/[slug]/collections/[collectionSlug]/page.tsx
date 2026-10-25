import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { LOCALE_META, isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import { getPublicCollection } from "@/lib/storefront/collections";
import { loadStorefront } from "@/lib/storefront/queries";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; collectionSlug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug, collectionSlug } = await params;
  if (!isLocale(raw)) return {};
  const { store } = await loadStorefront(slug);
  if (!store) return {};
  const detail = await getPublicCollection(store.id, collectionSlug);
  if (!detail) return {};

  return {
    title: `${detail.collection.name} · ${store.name}`,
    description: detail.collection.description?.slice(0, 160) ?? undefined,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; collectionSlug: string }>;
}) {
  const { locale: raw, slug, collectionSlug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = resolveLocale(raw);

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();
  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const detail = await getPublicCollection(store.id, collectionSlug);
  if (!detail) notFound();

  const { collection, products } = detail;
  const coverUrl = collection.image_key ? publicUrl(collection.image_key) : null;

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-10 sm:py-14">
          <BackLink
            href={path(locale, `/store/${slug}/collections`)}
            label={t.storefront.backToCollections}
          />

          <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
            <div className="relative aspect-[16/7] bg-hairline">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[linear-gradient(135deg,rgba(47,92,255,0.18),rgba(47,92,255,0.04))]" />
              )}
            </div>
            <div className="p-6 sm:p-9">
              <h1 className="text-[1.875rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.5rem]">
                {collection.name}
              </h1>
              {collection.description ? (
                <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
                  {collection.description}
                </p>
              ) : null}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-border bg-surface px-6 py-14 text-center">
              <p className="text-[0.9375rem] font-medium text-fg">
                {t.storefront.collectionsEmpty}
              </p>
              <p className="mt-1 text-[0.8125rem] text-subtle">
                {t.storefront.collectionsEmptyText}
              </p>
            </div>
          ) : (
            <ProductGrid
              t={t}
              locale={locale}
              slug={slug}
              products={products}
              currency={store.currency}
              localeTag={LOCALE_META[locale].tag}
              hideHeader
              className="mt-10"
            />
          )}
        </Container>
      </main>
    </StorefrontShell>
  );
}
