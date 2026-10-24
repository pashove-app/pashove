"use client";

import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import { cancelPayoutAction } from "@/lib/finance/payout-actions";

export function CancelPayoutButton({
  locale,
  payoutId,
  labels,
}: {
  locale: string;
  payoutId: string;
  labels: {
    payoutCancel: string;
    payoutCancelConfirm: string;
    payoutCancelYes: string;
    payoutCancelNo: string;
  };
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-400/25 bg-red-400/[0.06] px-4 text-[0.75rem] font-medium text-red-600 transition-colors hover:bg-red-400/10 dark:text-red-400"
      >
        <Icon path={icons.close} className="h-3.5 w-3.5" strokeWidth={2.2} />
        {labels.payoutCancel}
      </button>
    );
  }

  return (
    <form action={cancelPayoutAction} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="payoutId" value={payoutId} />

      <span className="text-[0.75rem] font-medium text-red-500">
        {labels.payoutCancelConfirm}
      </span>

      <button
        type="submit"
        className="inline-flex h-9 items-center rounded-full bg-red-600 px-4 text-[0.75rem] font-medium text-white transition-colors hover:bg-red-700"
      >
        {labels.payoutCancelYes}
      </button>

      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="inline-flex h-9 items-center rounded-full px-3 text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
      >
        {labels.payoutCancelNo}
      </button>
    </form>
  );
}
