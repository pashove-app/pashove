import Image from "next/image";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import type { StoreProduct } from "@/lib/storefront/products";

/**
 * La collection de la boutique.
 *
 * Deux colonnes sur mobile, quatre sur grand écran. Chaque carte mène à la
 * fiche du produit ; une rupture est signalée sans bloquer la navigation.
 */
export function ProductGrid({
  t,
  locale,
  slug,
  products,
  currency,
  localeTag,
}: {
  t: Dictionary;
  locale: Locale;
  slug: string;
  products: StoreProduct[];
  currency: string;
  localeTag: string;
}) {
  const price = (amount: number) => formatMoney(amount, currency, localeTag);

  return (
    <section className="mt-12">
      <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
        {t.storefront.productsTitle}
      </h2>

      {products.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface text-faint">
            <Icon path={icons.box} className="h-5 w-5" strokeWidth={1.7} />
          </span>

          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            {t.storefront.emptyTitle}
          </p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
            {t.storefront.emptyText}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const image = product.images[0];
            const soldOut =
              product.product_type === "physical" &&
              (product.stock_quantity ?? 0) <= 0;
            const compareAt =
              product.compare_at_amount &&
              product.compare_at_amount > product.price_amount
                ? product.compare_at_amount
                : null;

            return (
              <Link
                key={product.id}
                href={path(locale, `/store/${slug}/products/${product.slug}`)}
                className="group"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-hairline">
                  {image ? (
                    <Image
                      src={publicUrl(image.object_key)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-faint">
                      <Icon path={icons.tag} className="h-7 w-7" strokeWidth={1.5} />
                    </span>
                  )}

                  {soldOut ? (
                    <span className="absolute start-3 top-3 rounded-full bg-fg/85 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-bg backdrop-blur-sm">
                      {t.storefront.outOfStock}
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-3 line-clamp-2 min-h-[2.4rem] text-[0.875rem] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                  {product.name}
                </h3>

                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-[0.875rem] font-medium tabular-nums text-body">
                    {price(product.price_amount)}
                  </span>
                  {compareAt ? (
                    <span className="text-[0.75rem] tabular-nums text-faint line-through">
                      {price(compareAt)}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
