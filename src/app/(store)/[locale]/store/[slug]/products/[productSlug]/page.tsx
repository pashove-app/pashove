import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuyBox } from "@/components/storefront/product-buy-box";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import {
  getStoreProduct,
  type PricedStoreProduct,
} from "@/lib/storefront/products";
import { loadStorefront } from "@/lib/storefront/queries";

/** La fiche est mise en cache brièvement : le panier, lui, relit le stock. */
export const revalidate = 30;

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
    product.description?.slice(0, 160) ??
    `${product.name} — ${store.name}`;
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

  const localeTag = LOCALE_META[locale].tag;
  const price = (amount: number) => formatMoney(amount, store.currency, localeTag);

  const priced: PricedStoreProduct = {
    ...product,
    priceLabel: price(product.price_amount),
    compareAtLabel:
      product.compare_at_amount && product.compare_at_amount > product.price_amount
        ? price(product.compare_at_amount)
        : null,
    shippingLabel:
      store.shipping_flat_amount === 0
        ? t.storefront.freeShipping
        : `${t.storefront.shipping} : ${price(store.shipping_flat_amount)}`,
    variants: product.variants.map((variant) => ({
      ...variant,
      priceLabel: price(variant.price_amount),
      compareAtLabel:
        product.compare_at_amount &&
        product.compare_at_amount > variant.price_amount
          ? price(product.compare_at_amount)
          : null,
    })),
  };

  const images = product.images.map((image) => publicUrl(image.object_key));

  return (
    <StorefrontShell footerLabel={t.storefront.poweredBy}>
      <StorefrontHeader store={store} />

      <main className="pb-10 pt-5">
        <Link
          href={path(locale, `/store/${slug}`)}
          className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-subtle transition-colors hover:text-fg"
        >
          <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" strokeWidth={2} />
          {store.name}
        </Link>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <ProductGallery images={images} name={product.name} />

          <div className="lg:pt-2">
            {product.product_type !== "physical" ? (
              <span className="mb-3 inline-flex rounded-full border border-hairline-strong bg-hairline px-2.5 py-1 text-[0.6875rem] font-medium text-subtle">
                {product.product_type === "digital"
                  ? t.dashboard.products.typeBadgeDigital
                  : t.dashboard.products.typeBadgeService}
              </span>
            ) : null}

            <h1 className="text-[1.625rem] font-medium leading-tight tracking-[-0.03em] text-fg sm:text-[2rem]">
              {product.name}
            </h1>

            <div className="mt-4">
              <ProductBuyBox product={priced} codEnabled={store.cod_enabled} />
            </div>
          </div>
        </div>

        {product.description ? (
          <section className="mt-12 max-w-3xl border-t border-border pt-8">
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
              {t.storefront.descriptionTitle}
            </h2>
            <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted">
              {product.description}
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
          </section>
        ) : null}
      </main>
    </StorefrontShell>
  );
}
