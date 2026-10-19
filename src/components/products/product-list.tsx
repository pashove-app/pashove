import Image from "next/image";
import Link from "next/link";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { Icon, icons } from "@/components/ui/primitives";
import { LOCALE_META, type Locale } from "@/i18n/config";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { toggleProductStatusAction } from "@/lib/products/actions";
import type { Product } from "@/lib/products/queries";
import { publicUrl } from "@/lib/r2/media";

const TYPE_KEY = {
  physical: "typeBadgePhysical",
  digital: "typeBadgeDigital",
  service: "typeBadgeService",
} as const;

/**
 * Les produits du marchand.
 *
 * Tableau à partir de `md`, cartes empilées en dessous. Chaque ligne porte
 * ses actions : édition, bascule de statut et suppression confirmée.
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
  const labels = t.dashboard.products;
  const localeTag = LOCALE_META[locale].tag;
  const price = (amount: number) => formatMoney(amount, currency, localeTag);

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
            <th className="px-5 py-3 text-start font-semibold">
              {labels.columnProduct}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.columnType}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.columnStatus}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.stockLabel}
            </th>
            <th className="px-4 py-3 text-end font-semibold">
              {labels.columnPrice}
            </th>
            <th className="px-5 py-3 text-end font-semibold">
              {labels.columnActions}
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => {
            const stock = product.stock_quantity ?? 0;
            const published = product.status === "published";

            return (
              <tr
                key={product.id}
                className="border-b border-border align-middle last:border-0"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb product={product} />
                    <div className="min-w-0">
                      <Link
                        href={path(locale, `/app/products/${product.id}`)}
                        className="block truncate text-[0.875rem] font-medium text-fg transition-colors hover:text-accent"
                      >
                        {product.name}
                      </Link>
                      <p
                        dir="ltr"
                        className="truncate font-mono text-[0.75rem] text-faint"
                      >
                        /{product.slug}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <TypeBadge label={labels[TYPE_KEY[product.product_type]]} />
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <ProductStatusBadge t={t} status={product.status} />
                    <form action={toggleProductStatusAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="text-[0.6875rem] font-medium text-subtle transition-colors hover:text-accent"
                      >
                        {published ? labels.unpublish : labels.publish}
                      </button>
                    </form>
                  </div>
                </td>

                <td className="px-4 py-3">
                  {product.product_type === "physical" ? (
                    <span
                      className={cn(
                        "text-[0.8125rem] tabular-nums",
                        stock <= 0 ? "font-medium text-red-500" : "text-body",
                      )}
                    >
                      {stock <= 0 ? labels.outOfStock : stock}
                    </span>
                  ) : (
                    <span className="text-[0.8125rem] text-faint">—</span>
                  )}
                </td>

                <td className="px-4 py-3 text-end text-[0.875rem] font-medium tabular-nums text-fg">
                  {price(product.price_amount)}
                </td>

                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={path(locale, `/app/products/${product.id}`)}
                      aria-label={labels.edit}
                      title={labels.edit}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
                    >
                      <Icon
                        path={icons.pencil}
                        className="h-4 w-4"
                        strokeWidth={1.8}
                      />
                    </Link>

                    <DeleteProductButton
                      locale={locale}
                      productId={product.id}
                      labels={{
                        delete: labels.delete,
                        deleteConfirm: labels.deleteConfirm,
                        deleteYes: labels.deleteYes,
                        deleteNo: labels.deleteNo,
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {products.map((product) => {
          const stock = product.stock_quantity ?? 0;
          const published = product.status === "published";

          return (
            <li key={product.id} className="p-4">
              <div className="flex items-start gap-3">
                <Thumb product={product} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={path(locale, `/app/products/${product.id}`)}
                      className="min-w-0 truncate text-[0.875rem] font-medium text-fg transition-colors hover:text-accent"
                    >
                      {product.name}
                    </Link>
                    <ProductStatusBadge t={t} status={product.status} />
                  </div>

                  <p
                    dir="ltr"
                    className="mt-0.5 truncate font-mono text-[0.6875rem] text-faint"
                  >
                    /{product.slug}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-subtle">
                    <TypeBadge
                      label={labels[TYPE_KEY[product.product_type]]}
                    />
                    <span aria-hidden="true">·</span>
                    <span className="font-medium tabular-nums text-body">
                      {price(product.price_amount)}
                    </span>
                    {product.product_type === "physical" ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span
                          className={cn(
                            "tabular-nums",
                            stock <= 0 && "font-medium text-red-500",
                          )}
                        >
                          {stock <= 0
                            ? labels.outOfStock
                            : `${labels.stockLabel} ${stock}`}
                        </span>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={toggleProductStatusAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-2.5 py-1 text-[0.75rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
                      >
                        {published ? labels.unpublish : labels.publish}
                      </button>
                    </form>

                    <Link
                      href={path(locale, `/app/products/${product.id}`)}
                      className="rounded-lg border border-border px-2.5 py-1 text-[0.75rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
                    >
                      {labels.edit}
                    </Link>

                    <DeleteProductButton
                      locale={locale}
                      productId={product.id}
                      labels={{
                        delete: labels.delete,
                        deleteConfirm: labels.deleteConfirm,
                        deleteYes: labels.deleteYes,
                        deleteNo: labels.deleteNo,
                      }}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-hairline-strong bg-hairline px-2 py-0.5 text-[0.6875rem] font-medium text-subtle">
      {label}
    </span>
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
