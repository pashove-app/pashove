"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Checkbox, SelectField, TextField } from "@/components/ui/field";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { saveDiscountAction } from "@/lib/discounts/actions";
import type { DiscountRow } from "@/lib/discounts/queries";
import {
  INITIAL_DISCOUNT_FORM_STATE,
  type DiscountFormState,
} from "@/lib/discounts/types";
import { formatPriceInput } from "@/lib/products/schema";
/** Création d'un code promo. Les montants sont validés côté serveur. */
export function DiscountForm({
  t,
  locale,
  currency,
  initial,
}: {
  t: Dictionary;
  locale: Locale;
  currency: string;
  initial: DiscountRow | null;
}) {
  const labels = t.dashboard.discounts;
  const [state, formAction, pending] = useActionState<
    DiscountFormState,
    FormData
  >(saveDiscountAction, INITIAL_DISCOUNT_FORM_STATE);

  const [kind, setKind] = useState<"percent" | "fixed">(
    initial?.kind ?? "percent",
  );
  const [code, setCode] = useState(initial?.code ?? "");

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? labels.errors[messageKey as keyof typeof labels.errors] ?? messageKey
      : undefined;
  };

  const serverMessage = state.messageKey
    ? (labels.errors[state.messageKey as keyof typeof labels.errors] ??
        labels[state.messageKey as keyof typeof labels] ??
        null)
    : null;

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />
      {initial ? (
        <input type="hidden" name="discountId" value={initial.id} />
      ) : null}

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="code"
            label={labels.fieldCode}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={labels.codePlaceholder}
            help={labels.codeHelp}
            maxLength={32}
            autoComplete="off"
            className="uppercase tracking-wide"
            error={fieldError("code")}
          />

          <SelectField
            name="kind"
            label={labels.fieldType}
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as "percent" | "fixed")
            }
            error={fieldError("kind")}
          >
            <option value="percent">{labels.typePercent}</option>
            <option value="fixed">{labels.typeFixed.replace("{currency}", currency)}</option>
          </SelectField>

          <TextField
            name="value"
            label={
              kind === "percent" ? labels.valuePercentLabel : labels.valueFixedLabel
            }
            inputMode="numeric"
            defaultValue={
              initial
                ? initial.kind === "percent"
                  ? String(initial.value)
                  : formatPriceInput(initial.value, currency)
                : ""
            }
            placeholder={kind === "percent" ? "10" : "5 000"}
            help={
              kind === "percent" ? labels.valuePercentHelp : labels.valueFixedHelp
            }
            maxLength={12}
            error={fieldError("value")}
          />

          <TextField
            name="minSubtotal"
            label={labels.fieldMinSubtotal}
            inputMode="numeric"
            defaultValue={
              initial && initial.min_subtotal > 0
                ? formatPriceInput(initial.min_subtotal, currency)
                : ""
            }
            placeholder="0"
            help={labels.minSubtotalHelp}
            maxLength={12}
            error={fieldError("minSubtotal")}
          />

          <TextField
            name="maxUses"
            label={labels.fieldMaxUses}
            inputMode="numeric"
            defaultValue={initial?.max_uses ?? ""}
            placeholder={labels.maxUsesPlaceholder}
            help={labels.maxUsesHelp}
            maxLength={6}
            error={fieldError("maxUses")}
          />

          <div className="hidden sm:block" aria-hidden="true" />

          <TextField
            name="startsAt"
            label={labels.fieldStartsAt}
            type="date"
            defaultValue={initial?.starts_at?.slice(0, 10) ?? ""}
            help={labels.startsAtHelp}
            error={fieldError("startsAt")}
          />

          <TextField
            name="expiresAt"
            label={labels.fieldExpiresAt}
            type="date"
            defaultValue={initial?.expires_at?.slice(0, 10) ?? ""}
            help={labels.expiresAtHelp}
            error={fieldError("expiresAt")}
          />
        </div>

        <div className="mt-5 border-t border-hairline pt-5">
          <Checkbox
            name="active"
            defaultChecked={initial?.active ?? true}
            label={
              <span>
                <span className="block font-medium text-body">
                  {labels.fieldActive}
                </span>
                <span className="mt-0.5 block text-[0.75rem] text-subtle">
                  {labels.activeHelp}
                </span>
              </span>
            }
          />
        </div>

        {serverMessage ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400"
          >
            {serverMessage}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? <Spinner /> : <Icon path={icons.percent} className="h-4 w-4" strokeWidth={2} />}
            {pending
              ? initial
                ? labels.saving
                : labels.submitting
              : initial
                ? labels.save
                : labels.submit}
          </button>

          <Link
            href={path(locale, "/app/discounts")}
            className="inline-flex h-11 items-center rounded-full border border-border px-5 text-[0.875rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
          >
            {labels.cancel}
          </Link>
        </div>
      </section>
    </form>
  );
}
