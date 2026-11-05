"use client";

import { useActionState, useState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { saveNavAction, type NavFormState } from "@/lib/storefront/nav-actions";
import type { NavItem } from "@/lib/storefront/navigation";
import type { StoreAdminCopy } from "@/lib/storefront/admin-copy";

const INITIAL: NavFormState = { status: "idle" };

export function NavEditor({
  locale,
  initialItems,
  labels,
}: {
  locale: string;
  initialItems: NavItem[];
  labels: StoreAdminCopy["nav"];
}) {
  const [items, setItems] = useState<NavItem[]>(initialItems);
  const [state, action, pending] = useActionState(saveNavAction, INITIAL);

  function patch(index: number, value: Partial<NavItem>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...value } : item)),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {items.map((item, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
        >
          <label className="block">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-faint">
              {labels.label}
            </span>
            <input
              value={item.label}
              onChange={(event) => patch(index, { label: event.target.value })}
              maxLength={40}
              className="mt-1.5 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-faint">
              {labels.href}
            </span>
            <input
              value={item.href}
              onChange={(event) => patch(index, { href: event.target.value })}
              maxLength={300}
              dir="ltr"
              className="mt-1.5 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg outline-none focus:border-brand-500"
            />
          </label>
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={item.visible}
              onChange={(event) =>
                patch(index, { visible: event.target.checked })
              }
              aria-label={labels.visible}
              className="h-4 w-4 accent-brand-500"
            />
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-hairline hover:text-fg disabled:opacity-30"
              aria-label={labels.up}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-hairline hover:text-fg disabled:opacity-30"
              aria-label={labels.down}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() =>
                setItems((current) => current.filter((_, i) => i !== index))
              }
              className="text-[0.6875rem] font-medium text-red-500 hover:underline"
            >
              {labels.remove}
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setItems((current) => [
            ...current,
            { label: "", href: "", visible: true },
          ])
        }
        className="rounded-full border border-border px-4 py-2 text-[0.75rem] font-medium text-subtle hover:border-brand-500 hover:text-accent"
      >
        + {labels.add}
      </button>

      <p className="text-[0.75rem] leading-relaxed text-faint">{labels.hint}</p>

      {state.status === "error" ? (
        <p className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[0.75rem] text-red-600 dark:text-red-400">
          {labels.error}
        </p>
      ) : null}
      {state.status === "saved" ? (
        <p className="text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400">
          {labels.saved}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        {pending ? labels.saving : labels.save}
      </button>
    </form>
  );
}
