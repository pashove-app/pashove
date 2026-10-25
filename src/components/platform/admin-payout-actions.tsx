"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { transitionPayoutAction } from "@/lib/platform/actions";
import {
  INITIAL_ADMIN_ACTION_STATE,
  type AdminActionState,
} from "@/lib/platform/types";

export function AdminPayoutActions({
  payoutId,
  status,
  kycApproved,
}: {
  payoutId: string;
  status: string;
  kycApproved: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    AdminActionState,
    FormData
  >(transitionPayoutAction, INITIAL_ADMIN_ACTION_STATE);

  const canProcess = ["requested", "security_check"].includes(status);
  const canSend = status === "processing";
  const canComplete = status === "sent";
  const canFail = !["completed", "failed", "reversed", "cancelled"].includes(
    status,
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="payoutId" value={payoutId} />

      {!kycApproved ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
          Le KYC du marchand doit être approuvé avant de traiter ou d’envoyer
          ce retrait.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="payout-reference" className="text-[0.75rem] font-medium text-body">
            Référence du virement
          </label>
          <input
            id="payout-reference"
            name="reference"
            dir="ltr"
            maxLength={120}
            className="mt-1.5 h-10 w-full rounded-full border border-border bg-surface px-4 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
            placeholder="Ex. : FLW-123456"
          />
        </div>
        <div>
          <label htmlFor="payout-reason" className="text-[0.75rem] font-medium text-body">
            Motif d’échec
          </label>
          <input
            id="payout-reason"
            name="reason"
            maxLength={300}
            className="mt-1.5 h-10 w-full rounded-full border border-border bg-surface px-4 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
            placeholder="Numéro invalide, bénéficiaire introuvable…"
          />
        </div>
      </div>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-[0.75rem] font-medium text-red-500"
              : "text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canProcess ? (
          <button
            type="submit"
            name="action"
            value="processing"
            disabled={pending || !kycApproved}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.75rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {pending ? <Spinner /> : null}
            Passer en traitement
          </button>
        ) : null}

        {canSend ? (
          <button
            type="submit"
            name="action"
            value="sent"
            disabled={pending || !kycApproved}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.75rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {pending ? <Spinner /> : null}
            Marquer envoyé
          </button>
        ) : null}

        {canComplete ? (
          <button
            type="submit"
            name="action"
            value="completed"
            disabled={pending || !kycApproved}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[0.75rem] font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? <Spinner /> : null}
            Marquer terminé
          </button>
        ) : null}

        {canFail ? (
          <button
            type="submit"
            name="action"
            value="failed"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-red-400/30 bg-red-400/[0.06] px-5 text-[0.75rem] font-medium text-red-600 transition-colors hover:bg-red-400/10 disabled:opacity-50 dark:text-red-400"
          >
            Échouer et libérer
          </button>
        ) : null}
      </div>
    </form>
  );
}
