"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import type { CollectionProductOption } from "@/lib/collections/queries";

const MAX_PRODUCTS = 200;

const ROW_BUTTON =
  "flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg disabled:pointer-events-none disabled:opacity-30";

/** Recherche sans accents ni casse. */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Sélection et ordre des produits d'une collection.
 *
 * Les identifiants retenus sont émis en champs cachés `productId`, dans
 * l'ordre affiché : la position en base suit ce que le marchand voit.
 */
export function CollectionProductPicker({
  labels,
  products,
  value,
  onChange,
}: {
  labels: Dictionary["dashboard"]["collections"];
  products: CollectionProductOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const byId = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const selected = value
    .map((id) => byId.get(id))
    .filter((product): product is CollectionProductOption => Boolean(product));

  const needle = fold(query.trim());

  const available = products.filter(
    (product) =>
      !value.includes(product.id) &&
      (needle === "" ||
        fold(product.name).includes(needle) ||
        fold(product.slug).includes(needle)),
  );

  function add(id: string) {
    if (value.length >= MAX_PRODUCTS || value.includes(id)) return;
    onChange([...value, id]);
  }

  function remove(id: string) {
    onChange(value.filter((entry) => entry !== id));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;

    const next = [...value];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  }

  return (
    <div>
      {value.map((id) => (
        <input key={id} type="hidden" name="productId" value={id} />
      ))}

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[0.8125rem] font-medium text-body">
          {labels.selectedTitle}
          <span className="ms-1.5 font-normal text-faint tabular-nums">
            {selected.length}
          </span>
        </h3>
        {value.length >= MAX_PRODUCTS ? (
          <span className="text-[0.6875rem] text-faint">{labels.maxProducts}</span>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-5 text-center text-[0.8125rem] text-faint">
          {labels.selectedEmpty}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-hairline overflow-hidden rounded-xl border border-border">
          {selected.map((product, index) => (
            <li key={product.id} className="flex items-center gap-2.5 bg-surface px-2.5 py-2">
              <span className="w-5 shrink-0 text-center text-[0.6875rem] font-semibold tabular-nums text-faint">
                {index + 1}
              </span>

              <Thumb product={product} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-fg">
                  {product.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] text-faint">
                  <span className="tabular-nums">{product.priceLabel}</span>
                  {product.status === "draft" ? (
                    <span className="rounded-full bg-hairline px-1.5 py-px text-[0.625rem] font-medium text-subtle">
                      {labels.draft}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={labels.moveUp}
                  title={labels.moveUp}
                  className={ROW_BUTTON}
                >
                  <Icon path={icons.arrowUp} className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === selected.length - 1}
                  aria-label={labels.moveDown}
                  title={labels.moveDown}
                  className={ROW_BUTTON}
                >
                  <Icon
                    path={icons.arrowUp}
                    className="h-4 w-4 rotate-180"
                    strokeWidth={2}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  aria-label={labels.remove}
                  title={labels.remove}
                  className={cn(ROW_BUTTON, "hover:bg-red-500/10 hover:text-red-500")}
                >
                  <Icon path={icons.close} className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <div className="relative">
          <Icon
            path={icons.search}
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.pickerSearch}
            aria-label={labels.pickerSearch}
            autoComplete="off"
            className="h-10 w-full rounded-xl border border-border bg-surface ps-9 pe-3 text-[0.8125rem] text-fg placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
        </div>

        {products.length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-border px-4 py-5 text-center">
            <p className="text-[0.8125rem] font-medium text-body">{labels.pickerEmpty}</p>
            <p className="mt-1 text-[0.75rem] text-faint">{labels.pickerEmptyHint}</p>
          </div>
        ) : available.length === 0 ? (
          <p className="mt-3 text-center text-[0.75rem] text-faint">
            {needle ? labels.pickerNoResults : labels.selectedEmpty}
          </p>
        ) : (
          <ul className="mt-2 max-h-72 divide-y divide-hairline overflow-y-auto rounded-xl border border-border">
            {available.map((product) => (
              <li key={product.id} className="flex items-center gap-2.5 bg-surface px-2.5 py-2">
                <Thumb product={product} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-body">
                    {product.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] text-faint">
                    <span className="tabular-nums">{product.priceLabel}</span>
                    {product.status === "draft" ? (
                      <span className="rounded-full bg-hairline px-1.5 py-px text-[0.625rem] font-medium text-subtle">
                        {labels.draft}
                      </span>
                    ) : null}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => add(product.id)}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 text-[0.75rem] font-medium text-subtle transition-colors hover:border-brand-500 hover:text-accent"
                >
                  <Icon path={icons.plus} className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {labels.add}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Thumb({ product }: { product: CollectionProductOption }) {
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-hairline bg-hairline">
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-faint">
          <Icon path={icons.tag} className="h-4 w-4" strokeWidth={1.6} />
        </span>
      )}
    </span>
  );
}
