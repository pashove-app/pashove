"use client";

import { useActionState } from "react";
import { FormNotice, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import type { SectionProps } from "@/components/ui/types";
import { signOutAction, verifyTotpChallengeAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

export function TotpChallengeForm({ t, locale, factorId }: SectionProps & { factorId: string }) {
  const [state, formAction, pending] = useActionState(
    verifyTotpChallengeAction,
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
        <Icon path={icons.shield} className="h-5 w-5" />
      </span>

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.totpChallengeTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.totpChallengeSubtitle}</p>

      <form action={formAction} noValidate className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="factorId" value={factorId} />

        <TextField
          name="code"
          label={t.auth.totpCodeLabel}
          hint={t.auth.totpCodeHint}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          error={fieldError}
          className="text-center tracking-[0.4em]"
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
              {t.auth.totpChallengeCta}
            </>
          )}
        </button>
      </form>

      {/* Sans cette porte de sortie, un utilisateur qui a perdu son téléphone
          resterait bloqué sur cet écran sans pouvoir revenir en arrière. */}
      <form action={signOutAction} className="mt-7 text-center">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="text-[0.875rem] font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.workspaceSignOut}
        </button>
      </form>
    </div>
  );
}
