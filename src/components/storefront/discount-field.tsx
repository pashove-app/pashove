"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/storefront/cart-provider";
import { Icon, icons, Spinner } from "@/components/ui/primitives";

/**
 * Application d'un code promo au panier.
 *
 * Le code est validé par une RPC à chaque application : existence, dates,
 * quota et montant minimum. Le panier renvoyé porte la remise recalculée.
 */
export function DiscountField() {
  const { cart, labels, applyDiscount, removeDiscount } = useCart();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discount = cart?.discount ?? null;
  const errorLabel = error
    ? ((labels[error as keyof typeof labels] as string | undefined) ??
      labels.discountApplyError)
    : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !code.trim()) return;

    setBusy(true);
    setError(null);

    const result = await applyDiscount(code);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "discountApplyError");
      return;
    }

    setCode("");
    // Sur le checkout, les totaux viennent du serveur : on les rafraîchit.
    router.refresh();
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError(null);

    const result = await removeDiscount();
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "discountApplyError");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <p className="text-[0.75rem] font-medium text-body">
        {labels.discountCodeLabel}
      </p>

      {discount ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2">
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.75rem] font-medium text-emerald-700 dark:text-emerald-300">
            <Icon path={icons.percent} className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="font-semibold">{discount.code}</span>
            {cart?.discountAmountLabel ? (
              <span className="font-normal">−{cart.discountAmountLabel}</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="shrink-0 text-[0.6875rem] font-medium text-subtle transition-colors hover:text-red-500 disabled:opacity-50"
          >
            {labels.discountRemove}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-2 flex items-stretch gap-2">
          <input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError(null);
            }}
            placeholder={labels.discountPlaceholder}
            aria-label={labels.discountCodeLabel}
            maxLength={32}
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-[0.8125rem] uppercase tracking-wide text-fg placeholder:normal-case placeholder:tracking-normal placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-brand-500 px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Spinner /> : labels.discountApply}
          </button>
        </form>
      )}

      {errorLabel ? (
        <p role="alert" className="mt-2 text-[0.75rem] font-medium text-red-500 dark:text-red-400">
          {errorLabel}
        </p>
      ) : null}
    </div>
  );
}
