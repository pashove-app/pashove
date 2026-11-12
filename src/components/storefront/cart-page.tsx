"use client";

import Link from "next/link";
import {
  CartThumb,
  QuantityStepper,
  useCart,
} from "@/components/storefront/cart-provider";
import { DiscountField } from "@/components/storefront/discount-field";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";

/** Page panier : mêmes données que le tiroir, en pleine largeur. */
export function CartPage() {
  const {
    cart,
    labels,
    locale,
    slug,
    mediaBase,
    pending,
    error,
    update,
    remove,
  } = useCart();

  const items = cart?.items ?? [];
  const hasUnavailable = items.some((item) => !item.available);
  const instantOnly =
    items.length > 0 &&
    items.every(
      (item) =>
        item.productType === "digital" || item.productType === "service",
    );
  // Le COD est une option de paiement, pas une condition pour ouvrir le
  // checkout : une boutique en Pashove Delivery n'a jamais de COD et doit
  // pourtant pouvoir encaisser en ligne.
  const canCheckout = items.length > 0 && !hasUnavailable;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface text-faint">
          <Icon path={icons.bag} className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <h1 className="mt-5 text-[1.5rem] font-medium tracking-[-0.02em] text-fg">
          {labels.cartEmptyTitle}
        </h1>
        <p className="mt-2 max-w-sm text-[0.875rem] leading-relaxed text-muted">
          {labels.cartEmptyText}
        </p>
        <Link
          href={path(locale, `/store/${slug}`)}
          className="mt-6 rounded-xl bg-brand-500 px-5 py-2.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
        >
          {labels.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.cartTitle}
        </h1>
        <Link
          href={path(locale, `/store/${slug}`)}
          className="text-[0.8125rem] font-medium text-subtle transition-colors hover:text-fg"
        >
          {labels.continueShopping}
        </Link>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/25 bg-red-400/[0.07] px-3 py-2 text-[0.75rem] text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <ul className="min-w-0 divide-y divide-border rounded-2xl border border-border bg-surface px-4 sm:px-5">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <CartThumb item={item} mediaBase={mediaBase} wide />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={path(
                        locale,
                        item.kind === "bundle"
                          ? `/store/${slug}/bundles/${item.slug}`
                          : `/store/${slug}/products/${item.slug}`,
                      )}
                      className="flex items-center gap-2 text-[0.9375rem] font-medium text-fg transition-colors hover:text-accent"
                    >
                      <span className="truncate">{item.name}</span>
                      {item.kind === "bundle" ? (
                        <span className="shrink-0 rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-accent">
                          {labels.bundleCartBadge}
                        </span>
                      ) : null}
                    </Link>
                    {item.variantLabel ? (
                      <p className="mt-0.5 text-[0.75rem] text-subtle">
                        {item.variantLabel}
                      </p>
                    ) : null}
                    {item.kind === "bundle" && item.bundleItems.length > 0 ? (
                      <p className="mt-0.5 text-[0.75rem] leading-relaxed text-subtle">
                        {labels.bundleCartContains}{" "}
                        {item.bundleItems
                          .map((entry) =>
                            entry.variantLabel
                              ? `${entry.name} (${entry.variantLabel})`
                              : entry.name,
                          )
                          .join(" · ")}
                      </p>
                    ) : null}
                    {item.serviceStartsAtLabel ? (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-subtle">
                        <Icon path={icons.calendar} className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {item.serviceStartsAtLabel}
                      </p>
                    ) : null}
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.8125rem] tabular-nums text-muted">
                      <span>{item.unitPriceLabel}</span>
                      {item.compareAtLabel ? (
                        <span className="text-faint line-through">
                          {item.compareAtLabel}
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <p className="shrink-0 text-[0.9375rem] font-medium tabular-nums text-fg">
                    {item.lineTotalLabel}
                  </p>
                </div>

                {!item.available ? (
                  <p className="mt-2 text-[0.75rem] font-medium text-red-500">
                    {labels.cartItemUnavailable}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <QuantityStepper
                    item={item}
                    pending={pending}
                    labels={labels}
                    update={update}
                    size="md"
                  />

                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    disabled={pending}
                    className="text-[0.75rem] font-medium text-subtle transition-colors hover:text-red-500"
                  >
                    {labels.remove}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="min-w-0 rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">{labels.summaryTitle}</h2>

          <div className="mt-4 border-t border-hairline pt-4">
            <DiscountField />
          </div>

          <dl className="mt-4 space-y-2 text-[0.875rem]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-subtle">{labels.subtotal}</dt>
              <dd className="font-medium tabular-nums text-fg">
                {cart?.subtotalLabel ?? "—"}
              </dd>
            </div>
            {cart?.discountAmountLabel ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-subtle">
                  {labels.discountLabel}
                  {cart.discount ? ` (${cart.discount.code})` : ""}
                </dt>
                <dd className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  −{cart.discountAmountLabel}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-subtle">{labels.shipping}</dt>
              <dd className="font-medium tabular-nums text-fg">
                {(cart?.shipping ?? 0) === 0
                  ? labels.freeShipping
                  : (cart?.shippingLabel ?? "—")}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3 text-[1rem]">
              <dt className="font-medium text-fg">{labels.total}</dt>
              <dd className="font-semibold tabular-nums text-fg">
                {cart?.totalLabel ?? "—"}
              </dd>
            </div>
          </dl>

          {hasUnavailable ? (
            <p className="mt-4 rounded-lg border border-red-400/25 bg-red-400/[0.07] px-3 py-2 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400">
              {labels.cartUnavailable}
            </p>
          ) : null}

          {canCheckout ? (
            <Link
              href={path(locale, `/store/${slug}/checkout`)}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600"
            >
              {labels.checkout}
              <Icon path={icons.arrowRight} className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />
            </Link>
          ) : (
            <span className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-hairline text-[0.875rem] font-medium text-faint">
              {labels.checkout}
            </span>
          )}

          {instantOnly || cart?.codEligible ? (
            <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-faint">
              {instantOnly ? labels.cartInstantInfo : labels.codInfo}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
