"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormNotice, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { verifyRecoveryCodeAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

/**
 * Entrée par code de secours, quand l'application d'authentification est
 * perdue. C'est la porte de sortie qui évite un compte définitivement fermé.
 */
export function RecoveryCodeForm({ t, locale }: SectionProps) {
  const [state, formAction, pending] = useActionState(
    verifyRecoveryCodeAction,
    INITIAL_AUTH_STATE,
  );

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const fieldError = state.fieldErrors?.code
    ? dictionaryErrors[state.fieldErrors.code]
    : undefined;
  const message = state.messageKey ? dictionaryErrors[state.messageKey] : undefined;

  return (
    <div>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/25 bg-brand-500/[0.08] text-accent">
        <Icon path={icons.key} className="h-5 w-5" />
      </span>

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.recoveryChallengeTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        {t.auth.recoveryChallengeText}
      </p>

      <form action={formAction} noValidate className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />

        <TextField
          name="code"
          label={t.auth.recoveryCodeLabel}
          icon="key"
          autoComplete="one-time-code"
          autoFocus
          error={fieldError}
        />

        {state.status === "unconfigured" ? (
          <FormNotice>{t.auth.notConfigured}</FormNotice>
        ) : null}

        {message ? <FormNotice tone="error">{message}</FormNotice> : null}

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
              {t.auth.recoveryChallengeCta}
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-[0.875rem] text-muted">
        <Link
          href={path(locale, "/auth/2fa")}
          className="font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.totpChallengeTitle}
        </Link>
      </p>
    </div>
  );
}
