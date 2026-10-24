"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { TextField } from "@/components/ui/field";
import { Icon, icons, Spinner, buttonClass } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { requestPayoutAction } from "@/lib/finance/payout-actions";
import {
  PROVIDER_LABELS,
  type PayoutProvider,
} from "@/lib/finance/providers";
import type { PayoutMethod } from "@/lib/finance/queries";
import {
  INITIAL_PAYOUT_FORM_STATE,
  type PayoutFormState,
} from "@/lib/finance/types";

/** Formulaire de demande de retrait. */
export function PayoutForm({
  t,
  locale,
  availableLabel,
  minLabel,
  methods,
  idempotencyKey,
}: {
  t: Dictionary;
  locale: Locale;
  availableLabel: string;
  minLabel: string;
  methods: PayoutMethod[];
  idempotencyKey: string;
}) {
  const labels = t.dashboard.finance;

  const [state, formAction, pending] = useActionState<PayoutFormState, FormData>(
    requestPayoutAction,
    INITIAL_PAYOUT_FORM_STATE,
  );

  const [methodId, setMethodId] = useState(
    methods.find((method) => method.is_default)?.id ?? methods[0]?.id ?? "",
  );
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? labels.errors[messageKey as keyof typeof labels.errors] ?? messageKey
      : undefined;
  };

  const serverMessage = state.messageKey
    ? labels.errors[state.messageKey as keyof typeof labels.errors] ?? null
    : null;

  return (
    <form
      action={formAction}
      noValidate
      className="mt-7 space-y-5 rounded-3xl border border-border bg-surface p-6 sm:p-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="methodId" value={methodId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-brand-500/[0.08] px-4 py-3.5">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
            {labels.availableLabel}
          </p>
          <p className="mt-1 text-[1.25rem] font-semibold tabular-nums text-fg">
            {availableLabel}
          </p>
        </div>
        <p className="text-[0.75rem] text-subtle">
          {labels.payoutMinimum.replace("{min}", minLabel)}
        </p>
      </div>

      <TextField
        name="amount"
        label={labels.payoutAmountLabel}
        hint="0"
        inputMode="decimal"
        dir="ltr"
        value={amount}
        autoComplete="off"
        error={fieldError("amount")}
        help={labels.payoutAmountHelp
          .replace("{min}", minLabel)
          .replace("{available}", availableLabel)}
        onChange={(event) => setAmount(event.target.value)}
      />

      <div>
        <p className="text-[0.8125rem] font-medium text-body">
          {labels.payoutMethodLabel}
        </p>
        <p className="mt-0.5 text-[0.75rem] text-subtle">
          {labels.payoutMethodHelp}
        </p>

        <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
          {methods.map((method) => {
            const active = methodId === method.id;

            return (
              <button
                key={method.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMethodId(method.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3.5 text-start transition-colors",
                  active
                    ? "border-brand-500 bg-brand-500/[0.08]"
                    : "border-border bg-bg-soft hover:border-border-strong",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    active
                      ? "bg-brand-500 text-white"
                      : "bg-hairline text-faint",
                  )}
                >
                  <Icon path={icons.wallet} className="h-4 w-4" strokeWidth={1.8} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-medium text-fg">
                    {PROVIDER_LABELS[method.provider as PayoutProvider] ??
                      method.provider}
                  </span>
                  <span className="mt-0.5 block font-mono text-[0.6875rem] text-faint" dir="ltr">
                    •••• {method.account_last4}
                  </span>
                </span>

                {method.is_default ? (
                  <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[0.625rem] font-semibold text-accent">
                    {labels.defaultBadge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {methods.length === 0 ? (
          <p className="mt-2 text-[0.75rem] text-red-500">
            {labels.errors.payoutMethodMissing}
          </p>
        ) : null}
      </div>

      <TextField
        name="pin"
        type="password"
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        dir="ltr"
        label={labels.payoutPinField}
        value={pin}
        autoComplete="off"
        error={fieldError("pin")}
        help={labels.payoutPinHelp}
        onChange={(event) =>
          setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
        }
      />

      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-bg-soft px-4 py-3.5">
        <Icon path={icons.lock} className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
        <p className="text-[0.75rem] leading-relaxed text-subtle">
          {labels.payoutNoticeText}
        </p>
      </div>

      {serverMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-500 dark:text-red-400"
        >
          {serverMessage}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Link
          href={path(locale, "/app/finance/payouts")}
          className={buttonClass({ variant: "ghost" })}
        >
          {labels.cancel}
        </Link>
        <button
          type="submit"
          disabled={pending || methods.length === 0}
          className={buttonClass({ variant: "primary" })}
        >
          {pending ? <Spinner /> : <Icon path={icons.wallet} className="h-4 w-4" strokeWidth={2} />}
          {pending ? labels.payoutSubmitting : labels.payoutSubmit}
        </button>
      </div>
    </form>
  );
}
