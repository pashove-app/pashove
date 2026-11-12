"use client";

import { useActionState, useState } from "react";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  requestPartialRefundAction,
  type OrderActionState,
} from "@/lib/orders/actions";

type Labels = Dictionary["dashboard"]["orders"];

export type PartialRefundItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  remaining: number;
};

const INITIAL: OrderActionState = { status: "idle" };

/** Sélection de lignes à rembourser ; le montant est calculé en base. */
export function PartialRefundForm({
  orderId,
  items,
  labels,
}: {
  orderId: string;
  items: PartialRefundItem[];
  labels: Labels;
}) {
  const [state, action, pending] = useActionState(
    requestPartialRefundAction,
    INITIAL,
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});

  if (items.length === 0) return null;

  const toggle = (id: string) => {
    setSelected((current) => {
      if (id in current) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: 1 };
    });
  };

  const setQuantity = (id: string, value: string, max: number) => {
    const parsed = Number.parseInt(value, 10);
    const quantity = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), max)
      : 1;
    setSelected((current) => ({ ...current, [id]: quantity }));
  };

  const message =
    state.status !== "idle" && state.messageKey
      ? labels[state.messageKey as keyof Labels] ?? null
      : null;

  return (
    <section className="mt-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.partialRefundTitle}
          </h2>
          <p className="mt-1 max-w-xl text-[0.8125rem] leading-relaxed text-subtle">
            {labels.partialRefundHelp}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-400/[0.06] px-3.5 text-[0.75rem] font-medium text-red-600 transition-colors hover:bg-red-400/10 dark:text-red-400"
        >
          <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />
          {labels.partialRefundButton}
        </button>
      </div>

      {open ? (
        <form action={action} className="mt-4">
          <input type="hidden" name="orderId" value={orderId} />

          <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-border">
            {items.map((item) => {
              const checked = item.id in selected;
              return (
                <li key={item.id} className="p-3.5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`refund-${item.id}`}
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      className="mt-1 h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-500/30"
                    />
                    <label
                      htmlFor={`refund-${item.id}`}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="block text-[0.8125rem] font-medium text-fg">
                        {item.product_name}
                      </span>
                      {item.variant_label ? (
                        <span className="mt-0.5 block text-[0.75rem] text-subtle">
                          {item.variant_label}
                        </span>
                      ) : null}
                      <span className="mt-0.5 block text-[0.6875rem] text-faint">
                        {labels.partialRefundRemaining.replace(
                          "{count}",
                          String(item.remaining),
                        )}
                      </span>
                    </label>

                    {checked ? (
                      <label className="shrink-0 text-end">
                        <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-faint">
                          {labels.partialRefundQuantity}
                        </span>
                        <input
                          type="number"
                          name={`qty:${item.id}`}
                          min={1}
                          max={item.remaining}
                          value={selected[item.id] ?? 1}
                          onChange={(event) =>
                            setQuantity(item.id, event.target.value, item.remaining)
                          }
                          className="mt-1 h-9 w-20 rounded-lg border border-border bg-surface px-2 text-center text-[0.8125rem] tabular-nums text-fg focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
                        />
                      </label>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          <label className="mt-3 block">
            <span className="block text-[0.75rem] font-medium text-body">
              {labels.partialRefundReason}
            </span>
            <textarea
              name="reason"
              rows={2}
              maxLength={400}
              placeholder={labels.partialRefundReasonPlaceholder}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending || Object.keys(selected).length === 0}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-[0.75rem] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60",
              )}
            >
              {pending ? <Spinner /> : null}
              {labels.partialRefundSubmit}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3.5 text-[0.75rem] font-medium text-body hover:border-border-strong"
            >
              {labels.partialRefundCancel}
            </button>
          </div>

          {message ? (
            <p
              role={state.status === "error" ? "alert" : "status"}
              className={cn(
                "mt-3 text-[0.75rem] font-medium",
                state.status === "error"
                  ? "text-red-500 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {message}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
