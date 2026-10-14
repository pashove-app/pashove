"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Checkbox,
  FormNotice,
  PasswordField,
  SelectField,
  TextField,
} from "@/components/ui/field";
import { buttonClass, Icon, icons } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { signUpAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";
import { LAUNCH_COUNTRIES, NEXT_COUNTRIES } from "@/lib/site-content";
import type { Dictionary } from "@/i18n/get-dictionary";

const COUNTRY_CODES = [
  ...LAUNCH_COUNTRIES.map((country) => country.code),
  ...NEXT_COUNTRIES.map((country) => country.code),
];

export function RegisterForm({ t, locale }: SectionProps) {
  const [state, formAction, pending] = useActionState(signUpAction, INITIAL_AUTH_STATE);

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? dictionaryErrors[key] : undefined;
  };
  const formMessage = state.messageKey ? dictionaryErrors[state.messageKey] : undefined;

  // Confirmation d'e-mail active : le compte existe, mais la session ne
  // s'ouvrira qu'après le clic sur le lien reçu.
  if (state.status === "check-email") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
          <Icon path={icons.mail} className="h-6 w-6" />
        </span>

        <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
          {t.auth.checkEmailTitle}
        </h1>

        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          {t.auth.checkEmailText.replace("{email}", state.email ?? "")}
        </p>

        <p className="mt-2 text-[0.8125rem] leading-relaxed text-subtle">
          {t.auth.checkEmailHint}
        </p>

        <Link
          href={path(locale, "/auth/login")}
          className={buttonClass({ variant: "outline", size: "lg", className: "mt-8 w-full" })}
        >
          {t.auth.switchToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.registerTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.registerSubtitle}</p>

      <form action={formAction} noValidate className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />

        <TextField
          name="fullName"
          label={t.auth.fullName}
          hint={t.auth.fullNameHint}
          icon="user"
          autoComplete="name"
          error={fieldError("fullName")}
        />

        <TextField
          name="storeName"
          label={t.auth.storeName}
          hint={t.auth.storeNameHint}
          help={t.auth.storeNameHelp}
          icon="store"
          autoComplete="organization"
          error={fieldError("storeName")}
        />

        <TextField
          name="email"
          type="email"
          label={t.auth.email}
          hint={t.auth.emailHint}
          icon="mail"
          autoComplete="email"
          inputMode="email"
          error={fieldError("email")}
        />

        <PasswordField
          name="password"
          label={t.auth.password}
          hint="••••••••"
          help={t.auth.passwordHelp}
          autoComplete="new-password"
          revealLabel={t.auth.showPassword}
          concealLabel={t.auth.hidePassword}
          error={fieldError("password")}
        />

        <TextField
          name="phone"
          type="tel"
          label={t.auth.phone}
          hint={t.auth.phoneHint}
          icon="phone"
          autoComplete="tel"
          inputMode="tel"
          error={fieldError("phone")}
        />

        <SelectField
          name="country"
          label={t.auth.country}
          icon="globe"
          defaultValue=""
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

        <TextField
          name="referral"
          label={t.auth.referral}
          hint={t.auth.referralHint}
          help={t.auth.referralHelp}
          icon="tag"
          error={fieldError("referral")}
        />

        <div className="rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] p-4">
          <Checkbox
            name="consent"
            error={fieldError("consent")}
            label={
              <>
                {t.auth.termsBefore}{" "}
                <Link
                  href={path(locale, "/legal/cgu")}
                  prefetch={false}
                  className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                >
                  {t.auth.termsLink}
                </Link>{" "}
                {t.auth.termsAnd}{" "}
                <Link
                  href={path(locale, "/legal/confidentialite")}
                  prefetch={false}
                  className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                >
                  {t.auth.privacyLink}
                </Link>
                .
              </>
            }
          />
        </div>

        {state.status === "unconfigured" ? (
          <FormNotice>{t.auth.notConfigured}</FormNotice>
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
              <Icon path={icons.user} className="h-4 w-4" />
              {t.auth.registerCta}
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-[0.875rem] text-muted">
        {t.auth.hasAccount}{" "}
        <Link
          href={path(locale, "/auth/login")}
          className="font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.switchToLogin}
        </Link>
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="24 12"
        strokeLinecap="round"
      />
    </svg>
  );
}
