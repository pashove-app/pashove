"use client";

import { useActionState, useState } from "react";
import { SelectionCard } from "@/components/onboarding/selection-card";
import { StepProgress } from "@/components/onboarding/step-progress";
import { FormNotice, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import type { SectionProps } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { LAUNCH_COUNTRIES } from "@/lib/site-content";
import { createStoreAction } from "@/lib/stores/actions";
import { CURRENCIES, SLUG_MAX, STORE_DOMAIN, slugify } from "@/lib/stores/schema";
import { INITIAL_STORE_FORM_STATE } from "@/lib/stores/types";

/**
 * Étape 1 de l'onboarding : l'identité de la boutique.
 *
 * L'identifiant suit le nom tant que le marchand ne l'a pas corrigé lui-même —
 * le comportement attendu de tout formulaire d'adresse, et une saisie de moins.
 * Les pays et la devise sont des cartes à boutons radio : au clavier comme au
 * doigt, un choix se fait d'un seul geste.
 */
export function StoreForm({
  t,
  locale,
  stepLabel,
}: SectionProps & { stepLabel: string }) {
  const [state, formAction, pending] = useActionState(
    createStoreAction,
    INITIAL_STORE_FORM_STATE,
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const errors = t.onboarding.errors as Record<string, string>;
  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey ? errors[messageKey] : undefined;
  };
  const formMessage = state.messageKey ? errors[state.messageKey] : undefined;

  return (
    <div>
      <StepProgress current={1} total={4} label={stepLabel} />

      <h1 className="mt-6 text-[clamp(2.05rem,1.35rem+2.4vw,2.85rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-balance text-fg">
        {t.onboarding.storeTitle}
      </h1>
      <p className="mt-4 max-w-lg text-[0.9875rem] leading-relaxed text-muted">
        {t.onboarding.storeSubtitle}
      </p>

      <form action={formAction} noValidate className="mt-10 space-y-9">
        <input type="hidden" name="locale" value={locale} />

        <TextField
          name="name"
          label={t.onboarding.storeNameLabel}
          hint={t.onboarding.storeNameHint}
          icon="store"
          autoComplete="organization"
          value={name}
          error={fieldError("name")}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />

        <TextField
          name="slug"
          label={t.onboarding.slugLabel}
          // Un identifiant se lit de gauche à droite, même sur une page arabe.
          dir="ltr"
          maxLength={SLUG_MAX}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={slug}
          error={fieldError("slug")}
          help={t.onboarding.slugRules}
          addon={
            <span
              dir="ltr"
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-hairline-strong bg-hairline px-3 py-1.5 font-mono text-[0.75rem] text-muted"
            >
              <Icon path={icons.globe} className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} />
              <span className="truncate">
                {slug || "ta-boutique"}.{STORE_DOMAIN}
              </span>
            </span>
          }
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
        />

        <div
          role="radiogroup"
          aria-labelledby="country-label"
          className="flex flex-col gap-2.5"
        >
          <p id="country-label" className="text-sm font-medium text-body">
            {t.onboarding.sellingQuestion}
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {LAUNCH_COUNTRIES.map((country) => (
              <SelectionCard
                key={country.code}
                name="country"
                value={country.code}
                flag={country.flag}
                label={
                  t.countries_names[
                    country.code as keyof Dictionary["countries_names"]
                  ] ?? country.code
                }
                defaultChecked={country.code === "SN"}
              />
            ))}
          </div>

          {fieldError("country") ? (
            <p role="alert" className="text-[0.75rem] text-red-500 dark:text-red-400">
              {fieldError("country")}
            </p>
          ) : null}
        </div>

        <div
          role="radiogroup"
          aria-labelledby="currency-label"
          className="flex flex-col gap-2.5"
        >
          <p id="currency-label" className="text-sm font-medium text-body">
            {t.onboarding.currencyQuestion}
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {CURRENCIES.map((code) => (
              <SelectionCard
                key={code}
                name="currency"
                value={code}
                label={t.onboarding.currencies[code]}
                hint={code}
                defaultChecked={code === "XOF"}
                stacked
              />
            ))}
          </div>

          {fieldError("currency") ? (
            <p role="alert" className="text-[0.75rem] text-red-500 dark:text-red-400">
              {fieldError("currency")}
            </p>
          ) : null}
        </div>

        {state.status === "unconfigured" ? (
          <FormNotice>{errors.notConfigured}</FormNotice>
        ) : null}

        {formMessage ? <FormNotice tone="error">{formMessage}</FormNotice> : null}

        <div className="flex flex-wrap items-center gap-3">
          {/* Rien avant l'étape 1 : le bouton existe pour que la position ne
              change pas d'un écran à l'autre, mais il reste inerte. */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            className={buttonClass({ variant: "outline", size: "lg" })}
          >
            <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {t.onboarding.back}
          </button>

          <button type="submit" disabled={pending} className={buttonClass({ size: "lg" })}>
            {pending ? (
              <>
                <Spinner />
                {t.auth.pending}
              </>
            ) : (
              <>
                {t.onboarding.next}
                <Icon path={icons.arrowRight} className="h-4 w-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
