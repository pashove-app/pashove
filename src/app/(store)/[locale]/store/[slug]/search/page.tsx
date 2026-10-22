import type { Metadata } from "next";
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
import { searchStoreProducts } from "@/lib/storefront/products";
import { loadStorefront } from "@/lib/storefront/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const { q: rawQuery } = await searchParams;
  const query = typeof rawQuery === "string" ? rawQuery.slice(0, 80) : "";
  const products = query ? await searchStoreProducts(store.id, query) : [];
  const labels = t.storefront;
  const countLabel = (
    products.length === 1 ? labels.collectionCount : labels.collectionCountPlural
  ).replace("{count}", String(products.length));

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />

      <main>
        <Container className="pt-10">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
            {labels.searchTitle}
          </p>
          <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.5rem]">
            {labels.searchTitle}
          </h1>

          <form
            action={path(locale, `/store/${slug}/search`)}
            className="mt-6 flex max-w-2xl gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Icon
                path={icons.search}
                className="pointer-events-none absolute start-4 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-faint"
                strokeWidth={1.8}
              />
              <input
                name="q"
                defaultValue={query}
                placeholder={labels.searchPlaceholder}
                aria-label={labels.searchPlaceholder}
                maxLength={80}
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-border bg-surface ps-11 pe-4 text-[0.9375rem] text-fg placeholder:text-faint transition-[border-color,box-shadow] focus:border-fg focus:outline-none focus:ring-4 focus:ring-fg/10"
              />
            </div>

            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-fg px-6 text-[0.8125rem] font-medium text-bg transition-opacity hover:opacity-90"
            >
              {labels.searchTitle}
            </button>
          </form>

          <div className="mt-10">
            {!query ? (
              <p className="text-[0.875rem] text-subtle">{labels.searchPrompt}</p>
            ) : products.length === 0 ? (
              <p className="text-[0.875rem] text-subtle">{labels.searchNoResults}</p>
            ) : (
              <>
                <p className="text-[0.8125rem] text-subtle">{countLabel}</p>
                <ProductGrid
                  t={t}
                  locale={locale}
                  slug={slug}
                  products={products}
                  currency={store.currency}
                  localeTag={LOCALE_META[locale].tag}
                  hideHeader
                  className="mt-5"
                />
              </>
            )}
          </div>
        </Container>
      </main>
    </StorefrontShell>
  );
}
