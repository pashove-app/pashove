"use client";

import { useState } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { swatchColor } from "@/lib/colors";
import type { PricedStoreProduct } from "@/lib/storefront/products";

/**
 * Sélection des variantes, stock et ajout au panier.
 *
 * Les prix affichés sont déjà formatés par le serveur ; rien n'est additionné
 * ici. L'ajout relit le stock et le prix côté serveur.
 */
export function ProductBuyBox({
  product,
  codEnabled,
}: {
  product: PricedStoreProduct;
  codEnabled: boolean;
}) {
  const { add, labels } = useCart();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasOptions = product.options.length > 0;
  const allSelected = product.options.every((option) => selected[option.name]);
  const variant = allSelected
    ? product.variants.find((entry) =>
        product.options.every(
          (option) => entry.option_values[option.name] === selected[option.name],
        ),
      )
    : undefined;

  const physical = product.product_type === "physical";
  const digital = product.product_type === "digital";
  const purchasable = physical || digital;
  const stock = physical
    ? variant
      ? variant.stock_quantity
      : (product.stock_quantity ?? 0)
    : null;
  const soldOut = physical && (stock ?? 0) <= 0;
  const ready = !hasOptions || Boolean(variant);
  const canAdd = purchasable && (!physical || (ready && !soldOut));

  const priceLabel = variant?.priceLabel ?? product.priceLabel;
  const compareAtLabel = variant
    ? variant.compareAtLabel
    : product.compareAtLabel;

  const maxQuantity = stock ?? 1;

  function isColorOption(name: string): boolean {
    return /couleur|colou?r/i.test(name);
  }

  function choose(optionName: string, value: string) {
    setSelected((current) => ({ ...current, [optionName]: value }));
    setQuantity(1);
    setError(null);
  }

  function valueAvailable(optionName: string, value: string): boolean {
    const candidate = { ...selected, [optionName]: value };

    return product.variants.some(
      (entry) =>
        Object.entries(candidate).every(
          ([key, candidateValue]) => entry.option_values[key] === candidateValue,
        ) && entry.stock_quantity > 0,
    );
  }

  async function handleAdd() {
    if (!canAdd || adding) return;

    setAdding(true);
    setError(null);

    const result = await add(product.id, variant?.id ?? null, quantity);
    setAdding(false);

    if (!result.ok) {
      if (result.error === "out_of_stock") setError(labels.stockError);
      else if (result.error === "product_unavailable") setError(labels.unavailable);
      else if (result.error === "variant_required") setError(labels.chooseOption);
      else setError(labels.addError);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-[1.875rem] font-medium tracking-[-0.03em] tabular-nums text-fg">
          {priceLabel}
        </p>
        {compareAtLabel ? (
          <p className="text-[1rem] tabular-nums text-faint line-through">
            {compareAtLabel}
          </p>
        ) : null}
        {variant?.discountPercent ?? product.discountPercent ? (
          <span className="rounded-md bg-fg px-2 py-0.5 text-[0.6875rem] font-semibold text-bg">
            {labels.discountOff.replace(
              "{percent}",
              String(variant?.discountPercent ?? product.discountPercent ?? 0),
            )}
          </span>
        ) : null}
      </div>

      {physical && (!hasOptions || allSelected) ? (
        <p
          className={cn(
            "mt-2 text-[0.8125rem] font-medium",
            soldOut
              ? "text-red-500"
              : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {soldOut
            ? labels.outOfStock
            : labels.inStock.replace("{count}", String(stock ?? 0))}
        </p>
      ) : null}

      {hasOptions ? (
        <div className="mt-5 space-y-4">
          {product.options.map((option) => {
            const colorOption = isColorOption(option.name);
            const current = selected[option.name];

            return (
              <div key={option.name}>
                <p className="text-[0.75rem] font-medium text-body">
                  {option.name}
                  {colorOption && current ? (
                    <span className="font-normal text-subtle"> : {current}</span>
                  ) : null}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const active = selected[option.name] === value;
                    const available = valueAvailable(option.name, value);
                    const color = colorOption ? swatchColor(value) : null;

                    if (colorOption) {
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => choose(option.name, value)}
                          disabled={!available}
                          aria-pressed={active}
                          aria-label={value}
                          title={value}
                          className={cn(
                            "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform",
                            active
                              ? "scale-105 border-fg"
                              : "border-border hover:border-border-strong",
                            !available && "cursor-not-allowed opacity-40",
                            !color && "bg-hairline",
                          )}
                          style={color ? { backgroundColor: color } : undefined}
                        >
                          {!color ? (
                            <span className="text-[0.625rem] font-medium uppercase text-subtle">
                              {value.slice(0, 1)}
                            </span>
                          ) : null}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => choose(option.name, value)}
                        disabled={!available}
                        aria-pressed={active}
                        className={cn(
                          "min-w-11 rounded-md border px-3.5 py-2 text-[0.8125rem] font-medium transition-colors",
                          active
                            ? "border-fg bg-fg text-bg"
                            : "border-border text-body hover:border-border-strong",
                          !available &&
                            "cursor-not-allowed border-border/60 text-faint line-through opacity-60",
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {purchasable ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {physical ? (
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
                  setQuantity((current) => Math.min(maxQuantity, current + 1))
                }
                disabled={quantity >= maxQuantity}
                aria-label={`${labels.quantity} +`}
                className="flex h-full w-10 items-center justify-center text-subtle transition-colors hover:text-fg disabled:opacity-35"
              >
                <span aria-hidden="true" className="text-[1.125rem] leading-none">+</span>
              </button>
            </div>
          ) : null}

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
            ) : physical && !ready ? (
              labels.chooseOption
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
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <p className="text-[0.8125rem] font-medium text-fg">
            {labels.onlineSoon}
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
            {labels.onlineSoonText}
          </p>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-3 text-[0.75rem] font-medium text-red-500 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}

      {physical ? (
        <div className="mt-6 space-y-2 border-t border-hairline pt-4 text-[0.8125rem] text-muted">
          <p className="flex items-center gap-2">
            <Icon path={icons.box} className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.7} />
            {product.shippingLabel}
          </p>
          {codEnabled ? (
            <p className="flex items-center gap-2">
              <Icon path={icons.wallet} className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.7} />
              {labels.codInfo}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
