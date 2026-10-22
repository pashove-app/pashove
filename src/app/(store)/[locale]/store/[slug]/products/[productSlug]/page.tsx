import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { ProductBuyBox } from "@/components/storefront/product-buy-box";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductTabs, type ProductTab } from "@/components/storefront/product-tabs";
import { Reveal } from "@/components/storefront/reveal";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { Icon, icons } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { path } from "@/components/ui/types";
import { LOCALE_META, isLocale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import {
  getStoreProduct,
  listStoreProducts,
  type PricedStoreProduct,
} from "@/lib/storefront/products";
import { loadStorefront } from "@/lib/storefront/queries";

export const revalidate = 30;

const percentOff = (price: number, compare: number | null): number | null =>
  compare && compare > price ? Math.round((1 - price / compare) * 100) : null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { locale, slug, productSlug } = await params;
  if (!isLocale(locale)) return { robots: { index: false, follow: false } };

  const { status, store } = await loadStorefront(slug);
  if (status !== "active" || !store) {
    return { title: "Produit", robots: { index: false, follow: false } };
  }

  const product = await getStoreProduct(store.id, productSlug);
  if (!product) {
    return { title: "Produit", robots: { index: false, follow: false } };
  }

  const description =
    product.description?.slice(0, 160) ?? `${product.name} — ${store.name}`;
  const image = product.images[0]
    ? publicUrl(product.images[0].object_key)
    : undefined;

  return {
    title: `${product.name} · ${store.name}`,
    description,
    alternates: {
      canonical: `/${locale}/store/${store.slug}/products/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; productSlug: string }>;
}) {
  const { locale, slug, productSlug } = await params;
  if (!isLocale(locale)) notFound();

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const product = await getStoreProduct(store.id, productSlug);
  if (!product) notFound();

  const labels = t.storefront;
  const localeTag = LOCALE_META[locale].tag;
  const price = (amount: number) => formatMoney(amount, store.currency, localeTag);

  const priced: PricedStoreProduct = {
    ...product,
    priceLabel: price(product.price_amount),
    compareAtLabel:
      product.compare_at_amount && product.compare_at_amount > product.price_amount
        ? price(product.compare_at_amount)
        : null,
    discountPercent: percentOff(product.price_amount, product.compare_at_amount),
    shippingLabel:
      store.shipping_flat_amount === 0
        ? labels.freeShipping
        : `${labels.shipping} : ${price(store.shipping_flat_amount)}`,
    variants: product.variants.map((variant) => ({
      ...variant,
      priceLabel: price(variant.price_amount),
      compareAtLabel:
        product.compare_at_amount && product.compare_at_amount > variant.price_amount
          ? price(product.compare_at_amount)
          : null,
      discountPercent: percentOff(variant.price_amount, product.compare_at_amount),
    })),
  };

  const images = product.images.map((image) => publicUrl(image.object_key));
  const editorialImage = product.description_image
    ? publicUrl(product.description_image.object_key)
    : null;

  const typeLabel =
    product.product_type === "digital"
      ? t.dashboard.products.typeBadgeDigital
      : product.product_type === "service"
        ? t.dashboard.products.typeBadgeService
        : null;

  const shippingCountries =
    product.shipping_countries.length === 0
      ? labels.shipsEverywhere
      : labels.shipsTo.replace(
          "{countries}",
          product.shipping_countries
            .map(
              (code) =>
                t.countries_names[code as keyof Dictionary["countries_names"]] ??
                code,
            )
            .join(", "),
        );

  const all = await listStoreProducts(store.id);
  const productTags = new Set(product.tags);
  const related = all
    .filter((entry) => entry.id !== product.id)
    .map((entry) => ({
      entry,
      score: entry.tags.filter((tag) => productTags.has(tag)).length,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((item) => item.entry);

  const physical = product.product_type === "physical";

  const tabs: ProductTab[] = [
    {
      id: "details",
      label: labels.detailsTab,
      content: (
        <div>
          <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted">
            {product.description || labels.noDescription}
          </p>
          {product.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2.5 py-1 text-[0.6875rem] text-subtle"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: "shipping",
      label: labels.shippingTab,
      content: physical ? (
        <ul className="space-y-2.5 text-[0.875rem] text-muted">
          <li>{priced.shippingLabel}</li>
          {store.cod_enabled ? <li>{labels.codInfo}</li> : null}
          <li>{shippingCountries}</li>
        </ul>
      ) : (
        <div>
          <p className="text-[0.875rem] font-medium text-fg">{labels.onlineSoon}</p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
            {labels.onlineSoonText}
          </p>
        </div>
      ),
    },
    {
      id: "specs",
      label: labels.specsTab,
      content: (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
            <dt className="text-[0.8125rem] text-subtle">{labels.specType}</dt>
            <dd className="text-[0.8125rem] font-medium text-fg">
              {typeLabel ?? t.dashboard.products.typeBadgePhysical}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
            <dt className="text-[0.8125rem] text-subtle">{labels.specStock}</dt>
            <dd className="text-[0.8125rem] font-medium text-fg">
              {physical ? (product.stock_quantity ?? 0) : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
            <dt className="text-[0.8125rem] text-subtle">{labels.specVariants}</dt>
            <dd className="text-[0.8125rem] font-medium text-fg">
              {product.variants.length || "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2">
            <dt className="text-[0.8125rem] text-subtle">{labels.specReference}</dt>
            <dd dir="ltr" className="text-[0.8125rem] font-medium text-fg">
              {product.variants.find((variant) => variant.sku)?.sku ?? "—"}
            </dd>
          </div>
        </dl>
      ),
    },
  ];

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />

      <Container className="pb-10 pt-6">
        <Link
          href={path(locale, `/store/${slug}`)}
          className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-subtle transition-colors hover:text-fg"
        >
          <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" strokeWidth={2} />
          {labels.backToShop}
        </Link>

        <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <Reveal>
            <ProductGallery images={images} name={product.name} />
          </Reveal>

          <Reveal delay={0.08} className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex min-h-12 items-center justify-between gap-3">
              {typeLabel ? (
                <span className="inline-flex rounded-full border border-hairline-strong bg-hairline px-2.5 py-1 text-[0.6875rem] font-medium text-subtle">
                  {typeLabel}
                </span>
              ) : (
                <span />
              )}

              <WishlistButton productId={product.id} variant="square" />
            </div>

            <h1 className="mt-2 text-[2rem] font-medium leading-[1.05] tracking-[-0.04em] text-fg sm:text-[2.75rem]">
              {product.name}
            </h1>

            {product.description ? (
              <p className="mt-4 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted">
                {product.description}
              </p>
            ) : null}

            <div className="mt-6">
              <ProductBuyBox product={priced} codEnabled={store.cod_enabled} />
            </div>
          </Reveal>
        </div>

        <Reveal
          className={cn(
            "mt-16 grid gap-10",
            editorialImage &&
              "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14",
          )}
        >
          <ProductTabs tabs={tabs} />

          {editorialImage ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-hairline">
              <Image
                src={editorialImage}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </Reveal>

        {related.length > 0 ? (
          <Reveal className="mt-16">
            <ProductGrid
              t={t}
              locale={locale}
              slug={slug}
              products={related}
              currency={store.currency}
              localeTag={localeTag}
              id="related"
              title={labels.relatedTitle}
              eyebrow={labels.featuredEyebrow}
            />
          </Reveal>
        ) : null}
      </Container>
    </StorefrontShell>
  );
}
