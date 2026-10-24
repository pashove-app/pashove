"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/ui/field";
import { Icon, icons, Spinner, buttonClass } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import { setPayoutPinAction } from "@/lib/finance/payout-actions";
import {
  INITIAL_PAYOUT_PIN_STATE,
  type PayoutPinFormState,
} from "@/lib/finance/types";

/** Configuration et changement du PIN de retrait. */
export function PayoutPinForm({
  t,
  hasPin,
  lockedUntilLabel,
}: {
  t: Dictionary;
  hasPin: boolean;
  lockedUntilLabel: string | null;
}) {
  const labels = t.dashboard.finance;

  const [state, formAction, pending] = useActionState<
    PayoutPinFormState,
    FormData
  >(setPayoutPinAction, INITIAL_PAYOUT_PIN_STATE);

  const [currentPassword, setCurrentPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? labels.errors[messageKey as keyof typeof labels.errors] ?? messageKey
      : undefined;
  };

  const serverMessage =
    state.status === "saved"
      ? labels.pinSaved
      : state.messageKey
        ? labels.errors[state.messageKey as keyof typeof labels.errors] ?? null
        : null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/[0.12] text-accent">
          <Icon path={icons.lock} className="h-5 w-5" strokeWidth={1.8} />
        </span>

        <div>
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.pinTitle}
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] font-medium">
            <span
              className={
                hasPin
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }
            >
              {hasPin ? labels.pinStatusSet : labels.pinStatusMissing}
            </span>
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
            {labels.pinHelp}
          </p>

          {lockedUntilLabel ? (
            <p className="mt-2 text-[0.75rem] font-medium text-amber-600 dark:text-amber-400">
              {labels.pinLocked.replace("{date}", lockedUntilLabel)}
            </p>
          ) : null}
        </div>
      </div>

      <form action={formAction} noValidate className="mt-4 space-y-4">
        <TextField
          name="currentPassword"
          type="password"
          label={labels.currentPasswordLabel}
          autoComplete="current-password"
          value={currentPassword}
          error={fieldError("currentPassword")}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            dir="ltr"
            label={labels.pinLabel}
            autoComplete="new-password"
            value={pin}
            error={fieldError("pin")}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />

          <TextField
            name="confirm"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            dir="ltr"
            label={labels.pinConfirmLabel}
            autoComplete="new-password"
            value={confirm}
            error={fieldError("confirm")}
            onChange={(event) =>
              setConfirm(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </div>

        {serverMessage ? (
          <p
            role={state.status === "saved" ? "status" : "alert"}
            className={
              state.status === "saved"
                ? "text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400"
                : "rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-500 dark:text-red-400"
            }
          >
            {serverMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "primary", size: "sm" })}
        >
          {pending ? <Spinner /> : null}
          {pending
            ? labels.saving
            : hasPin
              ? labels.changePinSubmit
              : labels.setPinSubmit}
        </button>
      </form>
    </section>
  );
}
