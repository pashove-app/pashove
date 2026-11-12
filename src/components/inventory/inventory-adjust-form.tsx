"use client";

import { useActionState, useState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  adjustInventoryAction,
  type InventoryActionState,
} from "@/lib/inventory/actions";
import type {
  InventoryLocation,
  InventoryProduct,
} from "@/lib/inventory/queries";

type Labels = Dictionary["dashboard"]["inventory"];

const INITIAL: InventoryActionState = { status: "idle" };

const FIELD =
  "mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12";

export function InventoryAdjustForm({
  products,
  locations,
  labels,
}: {
  products: InventoryProduct[];
  locations: InventoryLocation[];
  labels: Labels;
}) {
  const [state, action, pending] = useActionState(adjustInventoryAction, INITIAL);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const product = products.find((item) => item.id === productId);

  const message =
    state.status !== "idle" && state.messageKey
      ? labels[state.messageKey as keyof Labels] ?? null
      : null;

  if (products.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-[0.9375rem] font-medium text-fg">{labels.adjustTitle}</h2>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
        {labels.adjustHelp}
      </p>

      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="block text-[0.75rem] font-medium text-body">
            {labels.productField}
          </span>
          <select
            name="productId"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className={FIELD}
          >
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        {product && product.variants.length > 0 ? (
          <label className="sm:col-span-2">
            <span className="block text-[0.75rem] font-medium text-body">
              {labels.variantField}
            </span>
            <select name="variantId" required className={FIELD} defaultValue="">
              <option value="">{labels.variantField}</option>
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.label}
                  {variant.sku ? ` · ${variant.sku}` : ""} ({variant.stock})
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          <span className="block text-[0.75rem] font-medium text-body">
            {labels.deltaField}
          </span>
          <input
            name="delta"
            type="number"
            required
            step={1}
            placeholder="+10"
            className={FIELD}
          />
        </label>

        <label>
          <span className="block text-[0.75rem] font-medium text-body">
            {labels.reasonField}
          </span>
          <select name="reason" className={FIELD} defaultValue="adjustment">
            <option value="adjustment">{labels.reasonAdjustment}</option>
            <option value="restock">{labels.reasonRestock}</option>
            <option value="transfer">{labels.reasonTransfer}</option>
            <option value="initial">{labels.reasonInitial}</option>
          </select>
        </label>

        <label>
          <span className="block text-[0.75rem] font-medium text-body">
            {labels.locationField}
          </span>
          <select name="locationId" className={FIELD} defaultValue="">
            <option value="">—</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block text-[0.75rem] font-medium text-body">
            {labels.noteField}
          </span>
          <input
            name="note"
            maxLength={300}
            placeholder={labels.notePlaceholder}
            className={FIELD}
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            {labels.submitAdjust}
          </button>
        </div>

        {message ? (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={cn(
              "text-[0.75rem] font-medium sm:col-span-2",
              state.status === "error"
                ? "text-red-500 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
