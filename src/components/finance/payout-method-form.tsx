"use client";

import { BackLink } from "@/components/ui/back-link";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Checkbox, SelectField, TextField } from "@/components/ui/field";
import { Spinner, buttonClass } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import {
  PROVIDER_LABELS,
  PAYOUT_COUNTRIES,
  providersForCountry,
  type PayoutCountry,
  type PayoutProvider,
} from "@/lib/finance/providers";
import { savePayoutMethodAction } from "@/lib/finance/payout-actions";
import type { PayoutMethod } from "@/lib/finance/queries";
import {
  INITIAL_PAYOUT_METHOD_STATE,
  type PayoutMethodFormState,
} from "@/lib/finance/types";
import { cn } from "@/lib/cn";

/** Ajout ou édition d'une méthode de retrait. */
export function PayoutMethodForm({
  t,
  locale,
  initial,
  defaultCountry,
  makeDefault,
}: {
  t: Dictionary;
  locale: Locale;
  initial: PayoutMethod | null;
  defaultCountry: string;
  makeDefault: boolean;
}) {
  const labels = t.dashboard.finance;

  const [state, formAction, pending] = useActionState<
    PayoutMethodFormState,
    FormData
  >(savePayoutMethodAction, INITIAL_PAYOUT_METHOD_STATE);

  const initialCountry = (
    PAYOUT_COUNTRIES.includes(initial?.country as PayoutCountry)
      ? initial?.country
      : PAYOUT_COUNTRIES.includes(defaultCountry as PayoutCountry)
        ? defaultCountry
        : "SN"
  ) as PayoutCountry;

  const [country, setCountry] = useState<PayoutCountry>(initialCountry);
  const [provider, setProvider] = useState<PayoutProvider>(
    (initial?.provider as PayoutProvider) ||
      providersForCountry(initialCountry)[0],
  );
  const [accountName, setAccountName] = useState(initial?.account_name ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [isDefault, setIsDefault] = useState(
    initial?.is_default ?? makeDefault,
  );

  const providers = providersForCountry(country);

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? labels.errors[messageKey as keyof typeof labels.errors] ?? messageKey
      : undefined;
  };

  const serverMessage = state.messageKey
    ? labels.errors[state.messageKey as keyof typeof labels.errors] ?? null
    : null;

  function changeCountry(next: PayoutCountry) {
    setCountry(next);
    const allowed = providersForCountry(next);
    if (!allowed.includes(provider)) setProvider(allowed[0]);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <BackLink
        href={path(locale, "/app/finance/methods")}
        label={labels.backToMethods}
      />

      <div className="mt-5">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {initial ? labels.editMethodTitle : labels.newMethodTitle}
        </h1>
        <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {initial ? labels.editMethodSubtitle : labels.newMethodSubtitle}
        </p>
      </div>

      <form
        action={formAction}
        noValidate
        className="mt-7 space-y-6 rounded-3xl border border-border bg-surface p-6 sm:p-8"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="methodId" value={initial?.id ?? ""} />

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="country"
            label={labels.countryLabel}
            value={country}
            onChange={(event) => changeCountry(event.target.value as PayoutCountry)}
            error={fieldError("country")}
          >
            {PAYOUT_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {t.countries_names[code as keyof Dictionary["countries_names"]] ?? code}
              </option>
            ))}
          </SelectField>

          <SelectField
            name="provider"
            label={labels.providerLabel}
            value={provider}
            onChange={(event) => setProvider(event.target.value as PayoutProvider)}
            error={fieldError("provider")}
          >
            {providers.map((code) => (
              <option key={code} value={code}>
                {PROVIDER_LABELS[code]}
              </option>
            ))}
          </SelectField>
        </div>

        <TextField
          name="accountName"
          label={labels.accountNameLabel}
          hint={labels.accountNamePlaceholder}
          value={accountName}
          maxLength={120}
          autoComplete="name"
          error={fieldError("accountName")}
          onChange={(event) => setAccountName(event.target.value)}
        />

        <TextField
          name="accountNumber"
          label={labels.numberLabel}
          hint={labels.numberPlaceholder}
          inputMode="tel"
          dir="ltr"
          value={accountNumber}
          maxLength={30}
          autoComplete="tel"
          error={fieldError("accountNumber")}
          help={
            initial
              ? labels.numberKeepHelp.replace(
                  "{last4}",
                  initial.account_last4,
                )
              : labels.numberHelp
          }
          onChange={(event) => setAccountNumber(event.target.value)}
        />

        <div className="rounded-2xl border border-border bg-bg-soft px-4 py-3.5">
          <Checkbox
            name="isDefault"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
            label={
              <span>
                <span className="font-medium text-body">{labels.defaultLabel}</span>
                <span className="mt-0.5 block text-[0.75rem] text-subtle">
                  {labels.defaultHelp}
                </span>
              </span>
            }
          />
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
            href={path(locale, "/app/finance/methods")}
            className={cn(buttonClass({ variant: "ghost" }), "sm:w-auto")}
          >
            {labels.cancel}
          </Link>

          <button
            type="submit"
            disabled={pending}
            className={buttonClass({ variant: "primary" })}
          >
            {pending ? <Spinner /> : null}
            {pending
              ? labels.saving
              : initial
                ? labels.saveMethod
                : labels.addMethodSubmit}
          </button>
        </div>
      </form>
    </div>
  );
}
