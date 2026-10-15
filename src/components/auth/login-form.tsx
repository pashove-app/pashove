"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormNotice, PasswordField, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { signInAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

export function LoginForm({ t, locale }: SectionProps) {
  const [state, formAction, pending] = useActionState(signInAction, INITIAL_AUTH_STATE);

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? dictionaryErrors[key] : undefined;
  };
  const formMessage = state.messageKey ? dictionaryErrors[state.messageKey] : undefined;

  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.loginTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.loginSubtitle}</p>

      {/* `noValidate` : on garde la main sur les messages, dans la bonne langue */}
      <form action={formAction} noValidate className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />

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

        <div>
          <PasswordField
            name="password"
            label={t.auth.password}
            hint="••••••••"
            autoComplete="current-password"
            revealLabel={t.auth.showPassword}
            concealLabel={t.auth.hidePassword}
            error={fieldError("password")}
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
              <Icon path={icons.arrowRight} className="h-4 w-4 rtl:rotate-180" />
              {t.auth.loginCta}
            </>
          )}
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
