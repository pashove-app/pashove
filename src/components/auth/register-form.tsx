"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Checkbox,
  FormNotice,
  PasswordField,
  SelectField,
  TextField,
} from "@/components/ui/field";
import { buttonClass, Icon, icons } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { LAUNCH_COUNTRIES, NEXT_COUNTRIES } from "@/lib/site-content";
import type { Dictionary } from "@/i18n/get-dictionary";
import { registerSchema, toFieldErrors } from "@/lib/validation";

const COUNTRY_CODES = [
  ...LAUNCH_COUNTRIES.map((country) => country.code),
  ...NEXT_COUNTRIES.map((country) => country.code),
];

export function RegisterForm({ t, locale }: SectionProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState(false);

  const messageFor = (key?: string) =>
    key ? ((t.auth.errors as Record<string, string>)[key] ?? key) : undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const parsed = registerSchema.safeParse({
      fullName: data.get("fullName") ?? "",
      storeName: data.get("storeName") ?? "",
      email: data.get("email") ?? "",
      password: data.get("password") ?? "",
      phone: data.get("phone") ?? "",
      country: data.get("country") ?? "",
      referral: data.get("referral") ?? "",
      consent: data.get("consent") === "on",
    });

    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      setNotice(false);
      return;
    }

    setErrors({});
    // Même principe que pour la connexion : on annonce l'état réel.
    setNotice(true);
  }

  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.registerTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.registerSubtitle}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <TextField
          name="fullName"
          label={t.auth.fullName}
          hint={t.auth.fullNameHint}
          icon="user"
          autoComplete="name"
          error={messageFor(errors.fullName)}
        />

        <TextField
          name="storeName"
          label={t.auth.storeName}
          hint={t.auth.storeNameHint}
          help={t.auth.storeNameHelp}
          icon="store"
          autoComplete="organization"
          error={messageFor(errors.storeName)}
        />

        <TextField
          name="email"
          type="email"
          label={t.auth.email}
          hint={t.auth.emailHint}
          icon="mail"
          autoComplete="email"
          inputMode="email"
          error={messageFor(errors.email)}
        />

        <PasswordField
          name="password"
          label={t.auth.password}
          hint="••••••••"
          help={t.auth.passwordHelp}
          autoComplete="new-password"
          revealLabel={t.auth.showPassword}
          concealLabel={t.auth.hidePassword}
          error={messageFor(errors.password)}
        />

        <TextField
          name="phone"
          type="tel"
          label={t.auth.phone}
          hint={t.auth.phoneHint}
          icon="phone"
          autoComplete="tel"
          inputMode="tel"
          error={messageFor(errors.phone)}
        />

        <SelectField
          name="country"
          label={t.auth.country}
          icon="globe"
          defaultValue=""
          error={messageFor(errors.country)}
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
          error={messageFor(errors.referral)}
        />

        <div className="rounded-2xl border border-brand-500/25 bg-brand-500/[0.06] p-4">
          <Checkbox
            name="consent"
            error={messageFor(errors.consent)}
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

        {notice ? <FormNotice>{t.auth.notConfigured}</FormNotice> : null}

        <button type="submit" className={buttonClass({ size: "lg", className: "w-full" })}>
          <Icon path={icons.user} className="h-4 w-4" />
          {t.auth.registerCta}
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
