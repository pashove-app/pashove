import Image from "next/image";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { Icon, icons } from "@/components/ui/primitives";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/products/queries";
import { publicUrl } from "@/lib/r2/media";

/**
 * Les produits du marchand.
 *
 * Tableau à partir de `md`, cartes empilées en dessous. Les actions d'édition
 * et de suppression arrivent au lot suivant.
 */
export function ProductList({
  t,
  locale,
  products,
  currency,
}: {
  t: Dictionary;
  locale: Locale;
  products: Product[];
  currency: string;
}) {
  const localeTag = LOCALE_META[locale].tag;
  const price = (amount: number) => formatMoney(amount, currency, localeTag);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
            <th className="px-5 py-3 text-start font-semibold">
              {t.dashboard.products.columnProduct}
            </th>
            <th className="px-5 py-3 text-start font-semibold">
              {t.dashboard.products.columnStatus}
            </th>
            <th className="px-5 py-3 text-end font-semibold">
              {t.dashboard.products.columnPrice}
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b border-border last:border-0"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Thumb product={product} />
                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] font-medium text-fg">
                      {product.name}
                    </p>
                    <p
                      dir="ltr"
                      className="truncate font-mono text-[0.75rem] text-faint"
                    >
                      /{product.slug}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-3">
                <ProductStatusBadge t={t} status={product.status} />
              </td>

              <td className="px-5 py-3 text-end text-[0.875rem] font-medium tabular-nums text-fg">
                {price(product.price_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {products.map((product) => (
          <li key={product.id} className="p-4">
            <div className="flex items-start gap-3">
              <Thumb product={product} />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-[0.875rem] font-medium text-fg">
                    {product.name}
                  </p>
                  <ProductStatusBadge t={t} status={product.status} />
                </div>

                <p
                  dir="ltr"
                  className="mt-0.5 truncate font-mono text-[0.6875rem] text-faint"
                >
                  /{product.slug}
                </p>
                <p className="mt-1 text-[0.8125rem] font-medium tabular-nums text-body">
                  {price(product.price_amount)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Thumb({ product }: { product: Product }) {
  if (product.image) {
    return (
      <Image
        src={publicUrl(product.image.object_key)}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-lg border border-border-soft object-cover"
      />
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-soft text-faint">
      <Icon path={icons.tag} className="h-4 w-4" strokeWidth={1.7} />
    </span>
  );
}
