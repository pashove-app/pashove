"use client";

import Link from "next/link";
import { useState } from "react";
import { FormNotice, PasswordField, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { loginSchema, toFieldErrors } from "@/lib/validation";

export function LoginForm({ t, locale }: SectionProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState(false);

  const messageFor = (key?: string) =>
    key ? ((t.auth.errors as Record<string, string>)[key] ?? key) : undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const parsed = loginSchema.safeParse({
      email: data.get("email"),
      password: data.get("password"),
    });

    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      setNotice(false);
      return;
    }

    setErrors({});
    // Le branchement sur Supabase Auth arrive au lot suivant. Tant qu'il n'est
    // pas là, on le dit clairement plutôt que de simuler une connexion réussie.
    setNotice(true);
  }

  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.loginTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.loginSubtitle}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
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

        <div>
          <PasswordField
            name="password"
            label={t.auth.password}
            hint="••••••••"
            autoComplete="current-password"
            revealLabel={t.auth.showPassword}
            concealLabel={t.auth.hidePassword}
            error={messageFor(errors.password)}
          />
          <div className="mt-2 text-end">
            <Link
              href={path(locale, "/auth/forgot-password")}
              prefetch={false}
              className="text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
            >
              {t.auth.forgot}
            </Link>
          </div>
        </div>

        {notice ? <FormNotice>{t.auth.notConfigured}</FormNotice> : null}

        <button type="submit" className={buttonClass({ size: "lg", className: "w-full" })}>
          <Icon path={icons.arrowRight} className="h-4 w-4 rtl:rotate-180" />
          {t.auth.loginCta}
        </button>
      </form>

      <p className="mt-7 text-center text-[0.875rem] text-muted">
        {t.auth.noAccount}{" "}
        <Link
          href={path(locale, "/auth/register")}
          className="font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.switchToRegister}
        </Link>
      </p>
    </div>
  );
}
