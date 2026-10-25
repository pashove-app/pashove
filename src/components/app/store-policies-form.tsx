"use client";

import { useActionState, useState } from "react";
import { Checkbox, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { Icon, icons, Spinner, buttonClass } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { PAYOUT_COUNTRIES } from "@/lib/finance/providers";
import { POLICY_PAGES, type PolicySlug } from "@/lib/policies/pages";
import { saveStorePoliciesAction } from "@/lib/policies/actions";
import type { LegalIdentity, StorePolicyPage } from "@/lib/policies/queries";
import {
  INITIAL_STORE_POLICIES_STATE,
  type StorePoliciesFormState,
} from "@/lib/policies/types";

type PolicyLabelKey =
  | "mentions"
  | "terms"
  | "privacy"
  | "shipping"
  | "returns";

const PAGE_LABEL: Record<PolicySlug, PolicyLabelKey> = {
  mentions: "mentions",
  terms: "terms",
  privacy: "privacy",
  shipping: "shipping",
  returns: "returns",
};

export function StorePoliciesForm({
  t,
  locale,
  identity,
  pages,
  storeCountry,
}: {
  t: Dictionary;
  locale: Locale;
  identity: LegalIdentity;
  pages: StorePolicyPage[];
  storeCountry: string;
}) {
  const labels = t.policies;

  const [state, formAction, pending] = useActionState<
    StorePoliciesFormState,
    FormData
  >(saveStorePoliciesAction, INITIAL_STORE_POLICIES_STATE);

  const [published, setPublished] = useState<Record<string, boolean>>(
    Object.fromEntries(pages.map((page) => [page.slug, page.is_published])),
  );

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? labels.errors[messageKey as keyof typeof labels.errors] ?? messageKey
      : undefined;
  };

  const serverMessage =
    state.status === "saved"
      ? labels.saved
      : state.messageKey
        ? labels.errors[state.messageKey as keyof typeof labels.errors] ?? null
        : null;

  return (
    <form action={formAction} noValidate className="mt-7 space-y-5">
      <input type="hidden" name="locale" value={locale} />

      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-[1.0625rem] font-medium text-fg">{labels.identityTitle}</h2>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
          {labels.identityText}
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            name="legalName"
            label={labels.legalName}
            hint={labels.legalNameHint}
            defaultValue={identity.legal_name ?? ""}
            maxLength={160}
            error={fieldError("legalName")}
          />
          <TextField
            name="legalForm"
            label={labels.legalForm}
            hint={labels.legalFormHint}
            defaultValue={identity.legal_form ?? ""}
            maxLength={80}
            error={fieldError("legalForm")}
          />
          <TextField
            name="address"
            label={labels.address}
            defaultValue={identity.address ?? ""}
            maxLength={200}
            error={fieldError("address")}
          />
          <TextField
            name="city"
            label={labels.city}
            defaultValue={identity.city ?? ""}
            maxLength={100}
            error={fieldError("city")}
          />
          <SelectField
            name="country"
            label={labels.country}
            defaultValue={
              PAYOUT_COUNTRIES.includes((identity.country ?? storeCountry) as never)
                ? identity.country ?? storeCountry
                : "SN"
            }
            error={fieldError("country")}
          >
            {PAYOUT_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {t.countries_names[code as keyof Dictionary["countries_names"]] ?? code}
              </option>
            ))}
          </SelectField>
          <TextField
            name="email"
            type="email"
            dir="ltr"
            label={labels.email}
            defaultValue={identity.email ?? ""}
            maxLength={160}
            error={fieldError("email")}
          />
          <TextField
            name="phone"
            dir="ltr"
            label={labels.phone}
            defaultValue={identity.phone ?? ""}
            maxLength={40}
            error={fieldError("phone")}
          />
          <TextField
            name="registrationNumber"
            label={labels.registrationNumber}
            hint={labels.registrationNumberHint}
            defaultValue={identity.registration_number ?? ""}
            maxLength={80}
            error={fieldError("registrationNumber")}
          />
          <TextField
            name="taxNumber"
            label={labels.taxNumber}
            defaultValue={identity.tax_number ?? ""}
            maxLength={80}
            error={fieldError("taxNumber")}
          />
        </div>

        <p className="mt-4 text-[0.75rem] text-subtle">{labels.requiredNote}</p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-[1.0625rem] font-medium text-fg">{labels.pagesTitle}</h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
            {labels.pagesText}
          </p>
        </div>

        {POLICY_PAGES.map((page) => {
          const isPublished = published[page.slug] ?? false;

          return (
            <section
              key={page.slug}
              className="rounded-3xl border border-border bg-surface p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[0.9375rem] font-medium text-fg">
                  {labels[PAGE_LABEL[page.slug]]}
                </h3>
                <span
                  className={
                    isPublished
                      ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[0.6875rem] font-medium text-emerald-600 dark:text-emerald-400"
                      : "inline-flex items-center gap-1.5 rounded-full bg-hairline px-2.5 py-1 text-[0.6875rem] font-medium text-subtle"
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {isPublished ? labels.published : labels.draft}
                </span>
              </div>

              <div className="mt-4">
                <TextAreaField
                  name={`body_${page.slug}`}
                  label={labels.bodyLabel}
                  hint={labels.bodyPlaceholder}
                  help={labels.bodyHelp}
                  defaultValue={pages.find((item) => item.slug === page.slug)?.body ?? ""}
                  maxLength={20000}
                  rows={9}
                  error={fieldError(`body_${page.slug}`)}
                />
              </div>

              <div className="mt-4">
                <Checkbox
                  name={`published_${page.slug}`}
                  defaultChecked={isPublished}
                  onChange={(event) =>
                    setPublished((current) => ({
                      ...current,
                      [page.slug]: event.target.checked,
                    }))
                  }
                  label={labels.publish}
                />
              </div>
            </section>
          );
        })}
      </section>

      {serverMessage ? (
        <p
          role={state.status === "saved" ? "status" : "alert"}
          className={
            state.status === "saved"
              ? "flex items-center gap-2 text-[0.8125rem] font-medium text-emerald-600 dark:text-emerald-400"
              : "rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-500 dark:text-red-400"
          }
        >
          {state.status === "saved" ? (
            <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.4} />
          ) : null}
          {serverMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={buttonClass({ variant: "primary" })}
      >
        {pending ? <Spinner /> : null}
        {pending ? labels.saving : labels.save}
      </button>
    </form>
  );
}
