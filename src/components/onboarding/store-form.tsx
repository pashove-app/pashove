"use client";

import { useActionState, useState } from "react";
import { FormNotice, SelectField, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import type { SectionProps } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { LAUNCH_COUNTRIES, NEXT_COUNTRIES } from "@/lib/site-content";
import { createStoreAction } from "@/lib/stores/actions";
import { CURRENCIES, SLUG_MAX, STORE_DOMAIN, slugify } from "@/lib/stores/schema";
import { INITIAL_STORE_FORM_STATE } from "@/lib/stores/types";

const COUNTRY_CODES = [
  ...LAUNCH_COUNTRIES.map((country) => country.code),
  ...NEXT_COUNTRIES.map((country) => country.code),
];

/**
 * Première étape de l'onboarding : l'identité de la boutique.
 *
 * L'identifiant suit le nom tant que le marchand ne l'a pas touché lui-même —
 * c'est le comportement attendu de tout formulaire d'adresse, et cela évite de
 * lui faire remplir deux fois la même chose.
 */
export function StoreForm({
  t,
  locale,
  defaultName,
  defaultCountry,
}: SectionProps & { defaultName: string; defaultCountry: string }) {
  const [state, formAction, pending] = useActionState(
    createStoreAction,
    INITIAL_STORE_FORM_STATE,
  );

  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(slugify(defaultName));
  const [slugTouched, setSlugTouched] = useState(false);

  const errors = t.onboarding.errors as Record<string, string>;
  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey ? errors[messageKey] : undefined;
  };
  const formMessage = state.messageKey ? errors[state.messageKey] : undefined;

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/[0.07] px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {t.onboarding.storeEyebrow}
      </span>

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.onboarding.storeTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {t.onboarding.storeSubtitle}
      </p>

      <form action={formAction} noValidate className="mt-8 space-y-5">
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
          // Le champ reste en écriture latine même sur une page arabe : un
          // identifiant se lit de gauche à droite, et le curseur doit suivre.
          dir="ltr"
          maxLength={SLUG_MAX}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={slug}
          error={fieldError("slug")}
          help={
            slug ? `${t.onboarding.slugHelp} ${slug}.${STORE_DOMAIN}` : t.onboarding.slugHelp
          }
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
        />

        <SelectField
          name="country"
          label={t.onboarding.countryLabel}
          icon="globe"
          defaultValue={defaultCountry}
          error={fieldError("country")}
        >
          <option value="" disabled>
            —
          </option>
          {COUNTRY_CODES.map((code) => (
            <option key={code} value={code}>
              {t.countries_names[code as keyof Dictionary["countries_names"]] ?? code}
            </option>
          ))}
        </SelectField>

        <SelectField
          name="currency"
          label={t.onboarding.currencyLabel}
          icon="wallet"
          defaultValue="XOF"
          error={fieldError("currency")}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {t.onboarding.currencies[code]}
            </option>
          ))}
        </SelectField>

        {state.status === "unconfigured" ? (
          <FormNotice>{errors.notConfigured}</FormNotice>
        ) : null}

        {formMessage ? <FormNotice tone="error">{formMessage}</FormNotice> : null}

        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ size: "lg", className: "w-full" })}
        >
          {pending ? (
            <>
              <Spinner />
              {t.auth.pending}
            </>
          ) : (
            <>
              <Icon path={icons.store} className="h-4 w-4" />
              {t.onboarding.storeCta}
            </>
          )}
        </button>

        {/* Pas de « plus tard » : sans boutique, l'espace marchand n'a rien à
            montrer, et `/app` renverrait ici. */}
      </form>
    </div>
  );
}
