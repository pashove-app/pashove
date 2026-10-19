"use client";

import { useMemo, useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import {
  MAX_PRODUCT_OPTIONS,
  MAX_PRODUCT_VARIANTS,
  type ProductOption,
} from "@/lib/products/schema";

export type VariantRow = {
  values: string[];
  /** null = prix hérité du produit. */
  price: string | null;
  stock: string;
  sku: string;
  barcode: string;
};

type RowState = Omit<VariantRow, "values">;

const EMPTY_ROW: RowState = { price: null, stock: "0", sku: "", barcode: "" };
const SEPARATOR = "\u001f";

const keyOf = (values: string[]) => values.join(SEPARATOR);

const CELL = [
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg",
  "placeholder:text-faint transition-[border-color,box-shadow] duration-200",
  "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12",
].join(" ");

/** Toutes les combinaisons, ou null tant qu'une option est incomplète. */
function combinations(options: ProductOption[]): string[][] | null {
  if (options.length === 0) return [];

  if (options.some((option) => !option.name.trim() || option.values.length === 0)) {
    return null;
  }

  let rows: string[][] = [[]];
  for (const option of options) {
    const next: string[][] = [];
    for (const row of rows) {
      for (const value of option.values) next.push([...row, value]);
    }
    rows = next;
  }

  return rows;
}

/**
 * Générateur de variantes : options, pastilles et matrice.
 *
 * Les combinaisons sont dérivées des options ; les valeurs saisies par le
 * marchand (prix, stock, SKU) sont conservées par combinaison. Tout part au
 * serveur en JSON — aucune conversion de prix ici.
 */
export function VariantsField({
  t,
  options,
  onOptionsChange,
  initialRows,
  productPrice,
  error,
}: {
  t: Dictionary;
  options: ProductOption[];
  onOptionsChange: (next: ProductOption[]) => void;
  initialRows: VariantRow[];
  productPrice: string;
  error?: string;
}) {
  const labels = t.dashboard.products;

  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const row of initialRows) {
      initial[keyOf(row.values)] = {
        price: row.price,
        stock: row.stock,
        sku: row.sku,
        barcode: row.barcode,
      };
    }
    return initial;
  });
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const combos = useMemo(() => combinations(options), [options]);
  const count = combos?.length ?? 0;
  const tooMany = count > MAX_PRODUCT_VARIANTS;

  const optionsJson = useMemo(
    () =>
      JSON.stringify(
        options.map((option) => ({
          name: option.name.trim(),
          values: option.values,
        })),
      ),
    [options],
  );

  const variantsJson = useMemo(() => {
    if (!combos || tooMany) return "[]";

    return JSON.stringify(
      combos.map((values, position) => {
        const row = rows[keyOf(values)] ?? EMPTY_ROW;

        return {
          option_values: Object.fromEntries(
            options.map((option, index) => [option.name.trim(), values[index]]),
          ),
          price: row.price,
          stock: row.stock,
          sku: row.sku,
          barcode: row.barcode,
          position,
        };
      }),
    );
  }, [combos, options, rows, tooMany]);

  function updateOption(index: number, patch: Partial<ProductOption>) {
    onOptionsChange(
      options.map((option, position) =>
        position === index ? { ...option, ...patch } : option,
      ),
    );
  }

  function addOption() {
    if (options.length >= MAX_PRODUCT_OPTIONS) return;
    onOptionsChange([...options, { name: "", values: [] }]);
  }

  function removeOption(index: number) {
    onOptionsChange(options.filter((_, position) => position !== index));
  }

  function addValues(index: number) {
    const raw = (drafts[index] ?? "").trim();
    if (!raw) return;

    const option = options[index];
    const next = [...option.values];

    for (const value of raw.split(",").map((entry) => entry.trim())) {
      if (!value || value.length > 30) continue;
      if (next.length >= 20) break;
      if (next.some((entry) => entry.toLocaleLowerCase() === value.toLocaleLowerCase())) {
        continue;
      }
      next.push(value);
    }

    updateOption(index, { values: next });
    setDrafts((current) => ({ ...current, [index]: "" }));
  }

  function removeValue(index: number, value: string) {
    updateOption(index, {
      values: options[index].values.filter((entry) => entry !== value),
    });
  }

  function setRow(key: string, patch: Partial<RowState>) {
    setRows((current) => ({
      ...current,
      [key]: { ...(current[key] ?? EMPTY_ROW), ...patch },
    }));
  }

  return (
    <div>
      <p className="text-[0.8125rem] font-medium text-body">{labels.variantsLabel}</p>
      <p className="mt-0.5 text-[0.75rem] text-subtle">{labels.variantsHelp}</p>

      <div className="mt-3 space-y-3">
        {options.map((option, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface/40 p-3"
          >
            <div className="flex items-center gap-2">
              <input
                value={option.name}
                onChange={(event) => updateOption(index, { name: event.target.value })}
                placeholder={labels.optionNamePlaceholder}
                aria-label={labels.optionNamePlaceholder}
                maxLength={30}
                className={cn(CELL, "flex-1")}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                aria-label={labels.removeOption}
                title={labels.removeOption}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
              >
                <Icon path={icons.close} className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {option.values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full border border-hairline-strong bg-hairline py-1 ps-2.5 pe-1 text-[0.75rem] text-body"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValue(index, value)}
                    aria-label={labels.removeValue}
                    title={labels.removeValue}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-faint transition-colors hover:bg-surface hover:text-fg"
                  >
                    <Icon path={icons.close} className="h-3 w-3" strokeWidth={2.4} />
                  </button>
                </span>
              ))}

              <input
                value={drafts[index] ?? ""}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [index]: event.target.value }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addValues(index);
                  }
                  if (
                    event.key === "Backspace" &&
                    !(drafts[index] ?? "") &&
                    option.values.length > 0
                  ) {
                    removeValue(index, option.values[option.values.length - 1]);
                  }
                }}
                placeholder={labels.optionValuesPlaceholder}
                aria-label={labels.optionValuesPlaceholder}
                maxLength={60}
                className={cn(CELL, "h-9 w-full sm:w-auto sm:min-w-[11rem] sm:flex-1")}
              />
            </div>
          </div>
        ))}
      </div>

      {options.length < MAX_PRODUCT_OPTIONS ? (
        <button
          type="button"
          onClick={addOption}
          className="mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
        >
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2} />
          {labels.addOption}
        </button>
      ) : null}

      {options.length > 0 && combos === null ? (
        <p className="mt-3 text-[0.75rem] text-subtle">{labels.optionEmpty}</p>
      ) : null}

      {tooMany ? (
        <p role="alert" className="mt-3 text-[0.75rem] text-red-500 dark:text-red-400">
          {labels.matrixTooMany}
        </p>
      ) : null}

      {combos && combos.length > 0 && !tooMany ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.8125rem] font-medium text-body">
              {labels.matrixTitle}
            </p>
            <span className="rounded-full border border-hairline-strong bg-hairline px-2.5 py-0.5 text-[0.6875rem] font-medium text-subtle">
              {count === 1
                ? labels.matrixCount.replace("{count}", "1")
                : labels.matrixCountPlural.replace("{count}", String(count))}
            </span>
          </div>

          <div className="mt-2 overflow-hidden rounded-xl border border-border">
            <div className="hidden gap-3 border-b border-hairline bg-hairline/50 px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-subtle sm:grid sm:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_7.5rem_8.5rem]">
              <span>{labels.columnVariant}</span>
              <span>{labels.matrixPrice}</span>
              <span>{labels.columnStock}</span>
              <span>{labels.columnSku}</span>
              <span>{labels.columnBarcode}</span>
            </div>

            {combos.map((values) => {
              const key = keyOf(values);
              const row = rows[key] ?? EMPTY_ROW;
              const label = values.join(" · ");

              return (
                <div
                  key={key}
                  className="grid gap-2 border-b border-hairline p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_7.5rem_8.5rem] sm:items-center sm:gap-3"
                >
                  <p className="text-[0.8125rem] font-medium text-fg">{label}</p>

                  <div>
                    <label className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-subtle sm:hidden">
                      {labels.matrixPrice}
                    </label>
                    <input
                      dir="ltr"
                      inputMode="decimal"
                      value={row.price ?? productPrice}
                      onChange={(event) =>
                        setRow(key, {
                          price: event.target.value === "" ? null : event.target.value,
                        })
                      }
                      aria-label={`${labels.matrixPrice} — ${label}`}
                      className={CELL}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-subtle sm:hidden">
                      {labels.columnStock}
                    </label>
                    <input
                      dir="ltr"
                      inputMode="numeric"
                      value={row.stock}
                      onChange={(event) =>
                        setRow(key, {
                          stock: event.target.value.replace(/[^\d]/g, ""),
                        })
                      }
                      aria-label={`${labels.columnStock} — ${label}`}
                      className={CELL}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-subtle sm:hidden">
                      {labels.columnSku}
                    </label>
                    <input
                      dir="ltr"
                      value={row.sku}
                      onChange={(event) => setRow(key, { sku: event.target.value })}
                      placeholder={labels.columnSku}
                      aria-label={`${labels.columnSku} — ${label}`}
                      maxLength={64}
                      className={CELL}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-subtle sm:hidden">
                      {labels.columnBarcode}
                    </label>
                    <input
                      dir="ltr"
                      value={row.barcode}
                      onChange={(event) => setRow(key, { barcode: event.target.value })}
                      placeholder={labels.columnBarcode}
                      aria-label={`${labels.columnBarcode} — ${label}`}
                      maxLength={64}
                      className={CELL}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <input type="hidden" name="optionsJson" value={optionsJson} />
      <input type="hidden" name="variantsJson" value={variantsJson} />

      {error ? (
        <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
