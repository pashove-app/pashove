"use client";

import { useActionState, useState } from "react";
import { Checkbox, SelectField } from "@/components/ui/field";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { savePartnerOfferAction } from "@/lib/partners/actions";
import type { PartnerOffer } from "@/lib/partners/queries";
import {
  INITIAL_PARTNER_OFFER_STATE,
  type PartnerOfferState,
} from "@/lib/partners/types";

const COMMISSIONS = [500, 1000, 1500, 2000];

/** Réglage du partage d'un produit, sur la fiche produit du propriétaire. */
export function PartnerOfferCard({
  t,
  locale,
  productId,
  initial,
  eligible,
  ineligibleReason,
  isCopy,
}: {
  t: Dictionary;
  locale: Locale;
  productId: string;
  initial: PartnerOffer | null;
  eligible: boolean;
  ineligibleReason: "variants" | "physical" | null;
  isCopy: boolean;
}) {
  const labels = t.dashboard.partners;
  const [state, formAction, pending] = useActionState<
    PartnerOfferState,
    FormData
  >(savePartnerOfferAction, INITIAL_PARTNER_OFFER_STATE);
  const [commission, setCommission] = useState(
    String(initial?.commission_bps ?? 500),
  );

  const message = state.messageKey
    ? labels.errors[state.messageKey as keyof typeof labels.errors] ??
      labels.errors.serverError
    : null;

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
          <Icon path={icons.route} className="h-4 w-4" strokeWidth={1.7} />
        </span>
        <div>
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.ownerTitle}
          </h2>
          <p className="mt-1 max-w-lg text-[0.8125rem] leading-relaxed text-subtle">
            {labels.ownerSubtitle}
          </p>
        </div>
      </div>

      {isCopy ? (
        <p className="mt-4 rounded-xl border border-border bg-hairline/40 px-3 py-2.5 text-[0.75rem] text-subtle">
          {labels.ownerCopy}
        </p>
      ) : !eligible ? (
        <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
          {ineligibleReason === "variants"
            ? labels.ownerVariants
            : labels.ownerPhysical}
        </p>
      ) : (
        <form action={formAction} className="mt-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="productId" value={productId} />

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-end">
            <Checkbox
              name="active"
              defaultChecked={initial?.active ?? false}
              label={labels.ownerToggle}
            />

            <SelectField
              name="commission"
              label={labels.ownerCommission}
              value={commission}
              onChange={(event) => setCommission(event.target.value)}
            >
              {COMMISSIONS.map((bps) => (
                <option key={bps} value={bps}>
                  {labels.percent.replace("{value}", String(bps / 100))}
                </option>
              ))}
            </SelectField>
          </div>

          {message ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] text-red-600 dark:text-red-400"
            >
              {message}
            </p>
          ) : null}

          {state.status === "saved" ? (
            <p className="mt-4 flex items-center gap-2 text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400">
              <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.4} />
              {labels.ownerSaved}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-500 px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? <Spinner /> : <Icon path={icons.route} className="h-4 w-4" strokeWidth={1.8} />}
            {pending ? labels.ownerSaving : labels.ownerSave}
          </button>
        </form>
      )}
    </section>
  );
}
