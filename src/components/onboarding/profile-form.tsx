"use client";

import { useActionState } from "react";
import { StepProgress } from "@/components/onboarding/step-progress";
import { FormNotice, SelectField, TextField } from "@/components/ui/field";
import {
  buttonClass,
  ButtonLink,
  Icon,
  icons,
  Spinner,
} from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { useFieldErrors } from "@/lib/forms/use-field-errors";
import { saveProfileAction } from "@/lib/profile/actions";
import type { Profile } from "@/lib/profile/queries";
import { TIMEZONES } from "@/lib/profile/schema";
import { INITIAL_PROFILE_FORM_STATE } from "@/lib/profile/types";

/**
 * Étape 2 : le profil du marchand.
 *
 * Le téléphone atterrit ici, après l'inscription : c'est une information qu'on
 * demande quand le compte existe déjà, pas avant. Le fuseau horaire fixe
 * l'heure des commandes et, plus tard, des rendez-vous.
 */
export function ProfileForm({
  t,
  locale,
  stepLabel,
  profile,
}: SectionProps & { stepLabel: string; profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    saveProfileAction,
    INITIAL_PROFILE_FORM_STATE,
  );

  const { corrected, clear } = useFieldErrors(state);

  const errors = t.onboarding.errors as Record<string, string>;
  const fieldError = (key: string) => {
    if (corrected[key]) return undefined;
    const messageKey = state.fieldErrors?.[key];
    return messageKey ? errors[messageKey] : undefined;
  };
  const formMessage = state.messageKey ? errors[state.messageKey] : undefined;

  return (
    <div>
      <StepProgress current={2} total={4} label={stepLabel} />

      <h1 className="mt-6 text-[clamp(2.05rem,1.35rem+2.4vw,2.85rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-balance text-fg">
        {t.onboarding.profileTitle}
      </h1>
      <p className="mt-4 max-w-lg text-[0.9875rem] leading-relaxed text-muted">
        {t.onboarding.profileSubtitle}
      </p>

      <form action={formAction} noValidate className="mt-10 space-y-9">
        <input type="hidden" name="locale" value={locale} />

        <TextField
          name="fullName"
          label={t.onboarding.profileNameLabel}
          hint={t.onboarding.profileNameHint}
          icon="user"
          autoComplete="name"
          defaultValue={profile.full_name}
          error={fieldError("fullName")}
          onChange={() => clear("fullName")}
        />

        <TextField
          name="phone"
          type="tel"
          label={t.onboarding.phoneLabel}
          hint={t.onboarding.phoneHint}
          help={t.onboarding.phoneHelp}
          icon="phone"
          autoComplete="tel"
          inputMode="tel"
          defaultValue={profile.phone ?? ""}
          error={fieldError("phone")}
          onChange={() => clear("phone")}
        />

        <SelectField
          name="timezone"
          label={t.onboarding.timezoneLabel}
          help={t.onboarding.timezoneHelp}
          icon="globe"
          defaultValue={profile.timezone}
          error={fieldError("timezone")}
          onChange={() => clear("timezone")}
        >
          {TIMEZONES.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone}
            </option>
          ))}
        </SelectField>

        {state.status === "unconfigured" ? (
          <FormNotice>{errors.notConfigured}</FormNotice>
        ) : null}

        {formMessage ? <FormNotice tone="error">{formMessage}</FormNotice> : null}

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink
            href={path(locale, "/onboarding/store")}
            variant="outline"
            size="lg"
          >
            <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {t.onboarding.back}
          </ButtonLink>

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
