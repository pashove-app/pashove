import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionCard } from "@/components/storefront/collection-card";
import { Container } from "@/components/storefront/container";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listPublicCollections } from "@/lib/storefront/collections";
import { loadStorefront } from "@/lib/storefront/queries";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = resolveLocale(raw);
  const { store } = await loadStorefront(slug);
  if (!store) return {};
  const t = await getDictionary(locale);

  return {
    title: `${t.storefront.collectionsHomeTitle} · ${store.name}`,
    description: t.storefront.collectionsSubtitle,
  };
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = resolveLocale(raw);

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();
  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const collections = await listPublicCollections(store.id);

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-10 sm:py-14">
          <BackLink href={path(locale, `/store/${slug}`)} label={t.storefront.navHome} />
          <div className="mt-5 max-w-2xl">
            <h1 className="text-[1.875rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.5rem]">
              {t.storefront.collectionsHomeTitle}
            </h1>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              {t.storefront.collectionsSubtitle}
            </p>
          </div>

          {collections.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-border bg-surface px-6 py-14 text-center">
              <p className="text-[0.9375rem] font-medium text-fg">
                {t.storefront.collectionsEmpty}
              </p>
              <p className="mt-1 text-[0.8125rem] text-subtle">
                {t.storefront.collectionsEmptyText}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-x-4 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  storeSlug={slug}
                  locale={locale}
                  labels={t.storefront}
                />
              ))}
            </div>
          )}
        </Container>
      </main>
    </StorefrontShell>
  );
}
