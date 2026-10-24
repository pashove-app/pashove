"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import type { BundleItemOption } from "@/lib/bundles/queries";

const MAX_ITEMS = 3;

const ROW_BUTTON =
  "flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg disabled:pointer-events-none disabled:opacity-30";

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Sélection et ordre des articles d'un paquet.
 *
 * Chaque entrée est un produit, ou une variante précise. Les clés retenues
 * partent en champs cachés `item`, dans l'ordre affiché.
 */
export function BundleItemPicker({
  labels,
  options,
  value,
  onChange,
}: {
  labels: Dictionary["dashboard"]["bundles"];
  options: BundleItemOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const byKey = useMemo(
    () => new Map(options.map((option) => [option.key, option])),
    [options],
  );

  const selected = value
    .map((key) => byKey.get(key))
    .filter((option): option is BundleItemOption => Boolean(option));

  const needle = fold(query.trim());
  const atMax = value.length >= MAX_ITEMS;

  const available = options.filter(
    (option) =>
      !value.includes(option.key) &&
      (needle === "" ||
        fold(option.name).includes(needle) ||
        fold(option.variantLabel ?? "").includes(needle)),
  );

  function add(key: string) {
    if (atMax || value.includes(key)) return;
    onChange([...value, key]);
  }

  function remove(key: string) {
    onChange(value.filter((entry) => entry !== key));
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
      {value.map((key) => (
        <input key={key} type="hidden" name="item" value={key} />
      ))}

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[0.8125rem] font-medium text-body">
          {labels.selectedTitle}
          <span className="ms-1.5 font-normal tabular-nums text-faint">
            {selected.length} / {MAX_ITEMS}
          </span>
        </h3>
        {atMax ? (
          <span className="text-[0.6875rem] text-faint">{labels.maxItems}</span>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-5 text-center text-[0.8125rem] text-faint">
          {labels.selectedEmpty}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-hairline overflow-hidden rounded-xl border border-border">
          {selected.map((option, index) => (
            <li key={option.key} className="flex items-center gap-2.5 bg-surface px-2.5 py-2">
              <span className="w-5 shrink-0 text-center text-[0.6875rem] font-semibold tabular-nums text-faint">
                {index + 1}
              </span>

              <Thumb option={option} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-fg">
                  {option.name}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[0.6875rem] text-faint">
                  {option.variantLabel ? <span>{option.variantLabel}</span> : null}
                  <span className="tabular-nums">{option.priceLabel}</span>
                  {option.status === "draft" ? (
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
                  <Icon path={icons.arrowUp} className="h-4 w-4 rotate-180" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(option.key)}
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

      {selected.length < 2 ? (
        <p className="mt-2 text-[0.6875rem] text-amber-600 dark:text-amber-400">
          {labels.minItemsHint}
        </p>
      ) : null}

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

        {options.length === 0 ? (
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
            {available.map((option) => (
              <li key={option.key} className="flex items-center gap-2.5 bg-surface px-2.5 py-2">
                <Thumb option={option} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-body">
                    {option.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] text-faint">
                    {option.variantLabel ? (
                      <span className="truncate">{option.variantLabel}</span>
                    ) : null}
                    <span className="tabular-nums">{option.priceLabel}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => add(option.key)}
                  disabled={atMax}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 text-[0.75rem] font-medium text-subtle transition-colors hover:border-brand-500 hover:text-accent disabled:pointer-events-none disabled:opacity-40"
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

function Thumb({ option }: { option: BundleItemOption }) {
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-hairline bg-hairline">
      {option.imageUrl ? (
        <Image src={option.imageUrl} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-faint">
          <Icon path={icons.tag} className="h-4 w-4" strokeWidth={1.6} />
        </span>
      )}
    </span>
  );
}
