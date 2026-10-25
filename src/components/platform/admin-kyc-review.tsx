"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { reviewKycAction } from "@/lib/platform/actions";
import {
  INITIAL_ADMIN_ACTION_STATE,
  type AdminActionState,
} from "@/lib/platform/types";

export function AdminKycReview({
  caseId,
  status,
}: {
  caseId: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState<
    AdminActionState,
    FormData
  >(reviewKycAction, INITIAL_ADMIN_ACTION_STATE);

  const closed = status === "approved";

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="caseId" value={caseId} />

      <div>
        <label
          htmlFor="kyc-reason"
          className="text-[0.75rem] font-medium text-body"
        >
          Motif (obligatoire pour un rejet ou une correction)
        </label>
        <textarea
          id="kyc-reason"
          name="reason"
          rows={3}
          className="mt-1.5 w-full resize-y rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          placeholder="Document illisible, selfie peu net, informations incohérentes…"
        />
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

      {closed ? (
        <p className="text-[0.75rem] text-subtle">
          Ce dossier est approuvé. Aucune nouvelle décision n’est nécessaire.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="decision"
            value="approved"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[0.75rem] font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            Approuver
          </button>
          <button
            type="submit"
            name="decision"
            value="rejected"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-red-600 px-5 text-[0.75rem] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            Rejeter
          </button>
          <button
            type="submit"
            name="decision"
            value="resubmission"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong disabled:opacity-60"
          >
            Demander une correction
          </button>
        </div>
      )}
    </form>
  );
}
