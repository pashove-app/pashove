import Image from "next/image";
import Link from "next/link";
import { QuickAdd } from "@/components/storefront/quick-add";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import type { StoreProduct } from "@/lib/storefront/products";

/**
 * Grille éditoriale : image 4/5, zoom léger, ajout rapide au survol.
 */
export function ProductGrid({
  t,
  locale,
  slug,
  products,
  currency,
  localeTag,
  id = "products",
  title,
  eyebrow,
  className,
  hideHeader = false,
}: {
  t: Dictionary;
  locale: Locale;
  slug: string;
  products: StoreProduct[];
  currency: string;
  localeTag: string;
  id?: string;
  title?: string;
  eyebrow?: string;
  className?: string;
  hideHeader?: boolean;
}) {
  const labels = t.storefront;
  const price = (amount: number) => formatMoney(amount, currency, localeTag);

  return (
    <section id={id} className={className ?? "scroll-mt-24"}>
      {hideHeader ? null : (
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
              {eyebrow ?? labels.featuredEyebrow}
            </p>
            <h2 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
              {title ?? labels.productsTitle}
            </h2>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface text-faint">
            <Icon path={icons.box} className="h-5 w-5" strokeWidth={1.7} />
          </span>

          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            {labels.emptyTitle}
          </p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
            {labels.emptyText}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
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
            const href = path(
              locale,
              `/store/${slug}/products/${product.slug}`,
            );

            return (
              <article key={product.id} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-hairline">
                  <Link href={href} className="absolute inset-0 z-0">
                    {image ? (
                      <Image
                        src={publicUrl(image.object_key)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-faint">
                        <Icon path={icons.tag} className="h-7 w-7" strokeWidth={1.5} />
                      </span>
                    )}
                  </Link>

                  {soldOut ? (
                    <span className="absolute start-3 top-3 z-10 rounded-full bg-fg/85 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-bg backdrop-blur-sm">
                      {labels.outOfStock}
                    </span>
                  ) : null}

                  <div className="absolute end-3 top-3 z-10">
                    <WishlistButton productId={product.id} />
                  </div>

                  <QuickAdd
                    productId={product.id}
                    productSlug={product.slug}
                    productType={product.product_type}
                    hasOptions={product.options.length > 0}
                    soldOut={soldOut}
                  />
                </div>

                <h3 className="mt-3 line-clamp-2 min-h-[2.4rem] text-[0.875rem] font-medium leading-snug text-fg">
                  <Link href={href} className="transition-colors hover:text-accent">
                    {product.name}
                  </Link>
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
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
