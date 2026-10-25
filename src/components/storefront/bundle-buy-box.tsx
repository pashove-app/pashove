"use client";

import { useState } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * Quantité et ajout au panier d'un paquet.
 *
 * Le stock affiché est le plus petit stock des produits physiques du paquet ;
 * l'ajout est revérifié côté serveur, comme pour un produit.
 */
export function BundleBuyBox({
  bundleId,
  maxQuantity,
  soldOut,
}: {
  bundleId: string;
  maxQuantity: number | null;
  soldOut: boolean;
}) {
  const { addBundle, labels } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const max = maxQuantity ?? 1;
  const canAdd = !soldOut && max > 0;

  async function handleAdd() {
    if (!canAdd || adding) return;

    setAdding(true);
    setError(null);

    const result = await addBundle(bundleId, quantity);
    setAdding(false);

    if (!result.ok) {
      if (result.error === "out_of_stock") setError(labels.stockError);
      else if (result.error === "product_unavailable") setError(labels.unavailable);
      else setError(labels.addError);
    }
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex h-12 items-center rounded-xl border border-border bg-surface">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            aria-label={`${labels.quantity} −`}
            className="flex h-full w-10 items-center justify-center text-subtle transition-colors hover:text-fg disabled:opacity-35"
          >
            <span aria-hidden="true" className="text-[1.125rem] leading-none">−</span>
          </button>
          <span className="min-w-8 text-center text-[0.875rem] font-medium tabular-nums text-fg">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuantity((current) => Math.min(max, current + 1))
            }
            disabled={quantity >= max}
            aria-label={`${labels.quantity} +`}
            className="flex h-full w-10 items-center justify-center text-subtle transition-colors hover:text-fg disabled:opacity-35"
          >
            <span aria-hidden="true" className="text-[1.125rem] leading-none">+</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd || adding}
          className={cn(
            "flex h-12 min-w-[12rem] flex-1 items-center justify-center gap-2 rounded-xl px-5 text-[0.875rem] font-medium transition-colors",
            canAdd && !adding
              ? "bg-fg text-bg hover:bg-fg/90"
              : "cursor-not-allowed bg-hairline text-faint",
          )}
        >
          {adding ? (
            <>
              <Spinner />
              {labels.adding}
            </>
          ) : soldOut ? (
            labels.outOfStock
          ) : (
            <>
              <Icon path={icons.bag} className="h-4 w-4" strokeWidth={1.9} />
              {labels.addToCart}
            </>
          )}
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 text-[0.75rem] font-medium text-red-500 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
