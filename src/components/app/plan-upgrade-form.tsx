"use client";

import { useActionState, useState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { SelectField, TextField } from "@/components/ui/field";
import {
  startPlanPaymentAction,
  type PlanPaymentState,
} from "@/lib/plans/actions";

const INITIAL: PlanPaymentState = { status: "idle" };

export function PlanUpgradeForm({
  locale,
  networks,
  currentPlan,
  disabledReason,
}: {
  locale: string;
  networks: { code: string; name: string }[];
  currentPlan: string;
  disabledReason?: string;
}) {
  const [state, formAction, pending] = useActionState<
    PlanPaymentState,
    FormData
  >(startPlanPaymentAction, INITIAL);

  const [planCode, setPlanCode] = useState(
    currentPlan === "standard" ? "standard" : "pro",
  );

  if (disabledReason) {
    return (
      <p className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-700 dark:text-amber-300">
        {disabledReason}
      </p>
    );
  }

  if (networks.length === 0) {
    return (
      <p className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-700 dark:text-amber-300">
        Aucun réseau Mobile Money n’est disponible pour le pays de ta boutique.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-2 sm:grid-cols-2">
        {[
          {
            code: "standard",
            title: "Standard",
            price: "25 000",
            commission: "2 % de commission",
            detail: "5 boutiques · 15 membres",
          },
          {
            code: "pro",
            title: "Pro",
            price: "45 000",
            commission: "0 % de commission",
            detail: "10 boutiques · 50 membres",
          },
        ].map((plan) => {
          const active = planCode === plan.code;
          return (
            <button
              key={plan.code}
              type="button"
              onClick={() => setPlanCode(plan.code)}
              aria-pressed={active}
              className={`rounded-2xl border p-4 text-start transition-colors ${
                active
                  ? "border-brand-500 bg-brand-500/[0.07]"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <span className="block text-[0.875rem] font-medium text-fg">
                {plan.title}
              </span>
              <span className="mt-1 block text-[1.25rem] font-medium tabular-nums text-fg">
                {plan.price} FCFA
                <span className="text-[0.6875rem] font-normal text-subtle">
                  {" "}
                  / mois
                </span>
              </span>
              <span className="mt-1 block text-[0.75rem] text-subtle">
                {plan.commission}
              </span>
              <span className="block text-[0.6875rem] text-faint">
                {plan.detail}
              </span>
            </button>
          );
        })}
      </div>
      <input type="hidden" name="planCode" value={planCode} />

      <SelectField name="network" label="Moyen de paiement" defaultValue={networks[0]?.code}>
        {networks.map((network) => (
          <option key={network.code} value={network.code}>
            {network.name}
          </option>
        ))}
      </SelectField>

      <TextField
        name="phone"
        label="Numéro Mobile Money"
        type="tel"
        dir="ltr"
        autoComplete="tel"
        placeholder="+223 70 00 00 00"
        maxLength={40}
        help="Le numéro qui recevra la demande de paiement."
      />

      <p className="rounded-xl border border-border bg-bg px-3 py-2.5 text-[0.75rem] leading-relaxed text-subtle">
        Le plan est activé pour 30 jours après confirmation. Aucun prélèvement
        automatique : tu renouvelles toi-même chaque mois. Les frais SasPay du
        paiement d’abonnement sont ajoutés au montant.
      </p>

      {state.message ? (
        <p
          role="status"
          className={`rounded-xl border px-3 py-2.5 text-[0.75rem] ${
            state.status === "pending"
              ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-700 dark:text-emerald-300"
              : "border-red-500/25 bg-red-500/[0.06] text-red-600 dark:text-red-400"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? <Spinner /> : null}
        {currentPlan === planCode ? "Renouveler" : "Passer à " + planCode}
      </button>
    </form>
  );
}
