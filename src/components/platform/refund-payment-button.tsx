"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/primitives";
import { refundAdminPaymentAction } from "@/lib/payments/actions";

export function RefundPaymentButton({
  orderId,
  disabled,
}: {
  orderId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function refund() {
    if (pending || disabled) return;
    const confirmed = window.confirm(
      "Rembourser cette commande ? Une écriture compensatoire sera ajoutée au ledger.",
    );
    if (!confirmed) return;

    setPending(true);
    setError(false);
    setNotice(null);
    const result = await refundAdminPaymentAction(orderId);
    setPending(false);

    if (!result.ok) {
      setError(true);
      return;
    }

    if (result.messageKey === "paymentRefundRequested") {
      setNotice("Demande enregistrée — à confirmer dans Remboursements.");
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void refund()}
        disabled={pending || disabled}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/[0.06] px-3 text-[0.6875rem] font-medium text-red-600 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400"
      >
        {pending ? <Spinner /> : null}
        Rembourser
      </button>
      {error ? (
        <span role="alert" className="text-[0.625rem] text-red-500">
          Remboursement impossible.
        </span>
      ) : null}
      {notice ? (
        <span className="text-[0.625rem] text-emerald-600 dark:text-emerald-400">
          {notice}
        </span>
      ) : null}
    </div>
  );
}
