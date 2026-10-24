"use client";

import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import { archivePayoutMethodAction } from "@/lib/finance/payout-actions";

/** Suppression en deux temps : le retrait est archivé, pas effacé. */
export function DeletePayoutMethodButton({
  locale,
  methodId,
  labels,
}: {
  locale: string;
  methodId: string;
  labels: {
    deleteMethod: string;
    deleteMethodConfirm: string;
    deleteMethodYes: string;
    deleteMethodNo: string;
  };
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={labels.deleteMethod}
        title={labels.deleteMethod}
        className="flex h-9 w-9 items-center justify-center rounded-full text-faint transition-colors hover:bg-red-500/10 hover:text-red-500"
      >
        <Icon path={icons.trash} className="h-4 w-4" strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <form
      action={archivePayoutMethodAction}
      className="flex flex-wrap items-center justify-end gap-1.5"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="methodId" value={methodId} />

      <span className="text-[0.6875rem] font-medium text-red-500">
        {labels.deleteMethodConfirm}
      </span>

      <button
        type="submit"
        className="rounded-full bg-red-500/10 px-3 py-1.5 text-[0.6875rem] font-semibold text-red-500 transition-colors hover:bg-red-500/15"
      >
        {labels.deleteMethodYes}
      </button>

      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full px-3 py-1.5 text-[0.6875rem] font-medium text-subtle transition-colors hover:text-fg"
      >
        {labels.deleteMethodNo}
      </button>
    </form>
  );
}
