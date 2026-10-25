"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SelectField, TextField } from "@/components/ui/field";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { LAUNCH_COUNTRIES } from "@/lib/site-content";
import { createStoreAction } from "@/lib/stores/actions";
import {
  CURRENCIES,
  SLUG_MAX,
  slugify,
} from "@/lib/stores/schema";
import {
  INITIAL_STORE_FORM_STATE,
  type StoreFormState,
} from "@/lib/stores/types";

/** Création rapide d'une boutique depuis le dashboard. */
export function StoreCreateForm({
  t,
  locale,
}: {
  t: Dictionary;
  locale: Locale;
}) {
  const labels = t.dashboard.stores;
  const [state, formAction, pending] = useActionState<
    StoreFormState,
    FormData
  >(createStoreAction, INITIAL_STORE_FORM_STATE);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? t.onboarding.errors[messageKey as keyof typeof t.onboarding.errors] ??
          messageKey
      : undefined;
  };

  const serverMessage =
    state.messageKey === "limitReached"
      ? labels.limitReached
      : state.messageKey
        ? t.onboarding.errors[
            state.messageKey as keyof typeof t.onboarding.errors
          ] ?? labels.serverError
        : null;

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input
        type="hidden"
        name="slug"
        value={slugTouched ? slug : slugify(name)}
      />

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              name="name"
              label={labels.nameLabel}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={labels.namePlaceholder}
              maxLength={80}
              autoComplete="organization"
              error={fieldError("name")}
            />
          </div>

          <TextField
            name="slugDisplay"
            label={labels.slugLabel}
            value={slugTouched ? slug : slugify(name)}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value.toLowerCase());
            }}
            placeholder={labels.slugPlaceholder}
            help={labels.slugHelp.replace("{domain}", "pashove.com")}
            maxLength={SLUG_MAX}
            autoComplete="off"
            dir="ltr"
            error={fieldError("slug")}
          />

          <SelectField
            name="country"
            label={labels.countryLabel}
            defaultValue="ML"
            error={fieldError("country")}
          >
            {LAUNCH_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag}{" "}
                {t.countries_names[
                  country.code as keyof Dictionary["countries_names"]
                ] ?? country.code}
              </option>
            ))}
          </SelectField>

          <SelectField
            name="currency"
            label={labels.currencyLabel}
            defaultValue="XOF"
            error={fieldError("currency")}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {t.onboarding.currencies[code]} ({code})
              </option>
            ))}
          </SelectField>

          <div className="hidden sm:block" aria-hidden="true" />
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
            {pending ? (
              <Spinner />
            ) : (
              <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
            )}
            {pending ? labels.creating : labels.create}
          </button>

          <Link
            href={path(locale, "/app")}
            className="inline-flex h-11 items-center rounded-full border border-border px-5 text-[0.875rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
          >
            {labels.cancel}
          </Link>
        </div>
      </section>
    </form>
  );
}
