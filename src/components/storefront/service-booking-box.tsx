"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { ServiceSlot } from "@/lib/storefront/service-slots";

/** Choix d'un créneau puis ajout du service au panier. */
export function ServiceBookingBox({
  productId,
  slots,
}: {
  productId: string;
  slots: ServiceSlot[];
}) {
  const { addService, labels } = useCart();
  const days = useMemo(() => {
    const unique = new Map<string, string>();
    for (const slot of slots) {
      if (!unique.has(slot.dayKey)) unique.set(slot.dayKey, slot.dateLabel);
    }
    return [...unique.entries()].map(([key, label]) => ({ key, label }));
  }, [slots]);

  const [day, setDay] = useState(days[0]?.key ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daySlots = slots.filter((slot) => slot.dayKey === day);

  function chooseDay(key: string) {
    setDay(key);
    setSelected(null);
    setError(null);
  }

  async function handleAdd() {
    if (!selected || adding) return;
    setAdding(true);
    setError(null);

    const result = await addService(productId, selected);
    setAdding(false);

    if (!result.ok) {
      if (result.error === "service_slot_taken") setError(labels.serviceSlotTaken);
      else if (result.error === "service_slot_invalid") setError(labels.serviceSlotInvalid);
      else setError(labels.addError);
    }
  }

  if (slots.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <p className="text-[0.8125rem] font-medium text-fg">{labels.serviceNoSlots}</p>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
          {labels.serviceNoSlotsText}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-[0.75rem] font-medium text-body">
          {labels.serviceChooseDate}
        </p>

        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => chooseDay(entry.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition-colors",
                day === entry.key
                  ? "border-fg bg-fg text-bg"
                  : "border-border text-subtle hover:border-border-strong hover:text-fg",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-[0.75rem] font-medium text-body">
          {labels.serviceChooseTime}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {daySlots.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => {
                setSelected(slot.value);
                setError(null);
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[0.75rem] font-medium tabular-nums transition-colors",
                selected === slot.value
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border text-body hover:border-border-strong",
              )}
            >
              {slot.timeLabel}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!selected || adding}
        className={cn(
          "mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[0.875rem] font-medium transition-colors",
          selected && !adding
            ? "bg-fg text-bg hover:bg-fg/90"
            : "cursor-not-allowed bg-hairline text-faint",
        )}
      >
        {adding ? (
          <>
            <Spinner />
            {labels.adding}
          </>
        ) : (
          <>
            <Icon path={icons.calendar} className="h-4 w-4" strokeWidth={1.9} />
            {labels.serviceAdd}
          </>
        )}
      </button>

      {error ? (
        <p role="alert" className="mt-3 text-[0.75rem] font-medium text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
