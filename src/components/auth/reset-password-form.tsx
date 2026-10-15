"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormNotice, PasswordField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { updatePasswordAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

export function ResetPasswordForm({
  t,
  locale,
  hasSession,
}: SectionProps & { hasSession: boolean }) {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    INITIAL_AUTH_STATE,
  );

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? dictionaryErrors[key] : undefined;
  };
  const formMessage = state.messageKey ? dictionaryErrors[state.messageKey] : undefined;

  // Sans session, aucun jeton n'a été échangé : le lien a expiré, a déjà servi,
  // ou la page a été ouverte directement.
  if (!hasSession) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300">
          <Icon path={icons.clock} className="h-6 w-6" />
        </span>

        <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
          {t.auth.resetExpiredTitle}
        </h1>

        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          {t.auth.resetExpiredText}
        </p>

        <Link
          href={path(locale, "/auth/forgot-password")}
          className={buttonClass({ size: "lg", className: "mt-8 w-full" })}
        >
          <Icon path={icons.mail} className="h-4 w-4" />
          {t.auth.resetExpiredCta}
        </Link>

        <Link
          href={path(locale, "/auth/login")}
          className="mt-6 inline-block text-[0.875rem] font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.switchToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.resetTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.resetSubtitle}</p>

      <form action={formAction} noValidate className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />

        <PasswordField
          name="password"
          label={t.auth.newPassword}
          hint="••••••••"
          help={t.auth.passwordHelp}
          autoComplete="new-password"
          revealLabel={t.auth.showPassword}
          concealLabel={t.auth.hidePassword}
          error={fieldError("password")}
        />

        <PasswordField
          name="confirm"
          label={t.auth.confirmPassword}
          hint="••••••••"
          autoComplete="new-password"
          revealLabel={t.auth.showPassword}
          concealLabel={t.auth.hidePassword}
          error={fieldError("confirm")}
        />

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
              <Icon path={icons.lock} className="h-4 w-4" />
              {t.auth.resetCta}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
