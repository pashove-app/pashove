"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { withEmail } from "@/components/auth/with-email";
import { FormNotice, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { resendVerificationAction, verifyEmailCodeAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE, type AuthState } from "@/lib/auth/types";

type Props = SectionProps & { email: string | null };

export function VerifyEmailForm({ t, locale, email }: Props) {
  const [resendState, resendAction, resending] = useActionState(
    resendVerificationAction,
    INITIAL_AUTH_STATE,
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmailCodeAction,
    INITIAL_AUTH_STATE,
  );

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const read = (state: AuthState) => ({
    field: (name: string) => {
      const key = state.fieldErrors?.[name];
      return key ? dictionaryErrors[key] : undefined;
    },
    message: state.messageKey ? dictionaryErrors[state.messageKey] : undefined,
  });

  const verify = read(verifyState);
  const resend = read(resendState);

  // Deux compteurs, incrémentés à chaque soumission. Un message d'action n'est
  // affiché que s'il est postérieur à l'autre action : au chargement les deux
  // valent zéro, donc aucune erreur ne peut apparaître avant une soumission, et
  // demander un nouveau code efface l'erreur du code précédent.
  const [codeTries, setCodeTries] = useState(0);
  const [resendTries, setResendTries] = useState(0);

  const codeMessage = codeTries > resendTries ? verify.message : undefined;
  const resendMessage = resendTries > codeTries ? resend.message : undefined;

  // L'adresse vient du cookie posé à l'inscription, ou du renvoi de code qui
  // vient d'aboutir.
  const address =
    resendState.status === "code-sent" ? (resendState.email ?? null) : email;

  // Adresse inconnue — cookie expiré, ou page ouverte directement.
  if (!address) {
    return (
      <div>
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {t.auth.verifyEmailTitle}
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          {t.auth.verifyEmailNoEmailText}
        </p>

        <form
          action={resendAction}
          onSubmit={() => setResendTries((count) => count + 1)}
          noValidate
          className="mt-8 space-y-5"
        >
          <input type="hidden" name="locale" value={locale} />

          <TextField
            name="email"
            type="email"
            label={t.auth.email}
            hint={t.auth.emailHint}
            icon="mail"
            autoComplete="email"
            inputMode="email"
            error={resend.field("email")}
          />

          {resendState.status === "unconfigured" ? (
            <FormNotice>{t.auth.notConfigured}</FormNotice>
          ) : null}

          {resendMessage ? <FormNotice tone="error">{resendMessage}</FormNotice> : null}

          <button
            type="submit"
            disabled={resending}
            className={buttonClass({ size: "lg", className: "w-full" })}
          >
            {resending ? (
              <>
                <Spinner />
                {t.auth.pending}
              </>
            ) : (
              <>
                <Icon path={icons.mail} className="h-4 w-4" />
                {t.auth.verifyEmailSendCta}
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

  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.verifyEmailTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        {withEmail(t.auth.verifyEmailSubtitle, address)}
      </p>

      {/* Le lien et le code consomment le même jeton : valider l'un invalide
          l'autre. Sans cet avertissement, un code refusé passe pour un bug. */}
      <div className="mt-5">
        <FormNotice>{t.auth.verifyEmailEitherOr}</FormNotice>
      </div>

      <form
        action={verifyAction}
        onSubmit={() => setCodeTries((count) => count + 1)}
        noValidate
        className="mt-8 space-y-5"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="email" value={address} />

        <TextField
          name="code"
          label={t.auth.verifyEmailCodeLabel}
          hint={t.auth.codeHint}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          error={verify.field("code")}
          className="text-center tracking-[0.4em]"
        />

        {verifyState.status === "unconfigured" ? (
          <FormNotice>{t.auth.notConfigured}</FormNotice>
        ) : null}

        {codeMessage ? <FormNotice tone="error">{codeMessage}</FormNotice> : null}

        <button
          type="submit"
          disabled={verifying}
          className={buttonClass({ size: "lg", className: "w-full" })}
        >
          {verifying ? (
            <>
              <Spinner />
              {t.auth.pending}
            </>
          ) : (
            <>
              <Icon path={icons.check} className="h-4 w-4" strokeWidth={2} />
              {t.auth.verifyEmailVerifyCta}
            </>
          )}
        </button>
      </form>

      {/* Même action que la page de renvoi, sans quitter l'écran. */}
      <form
        action={resendAction}
        onSubmit={() => setResendTries((count) => count + 1)}
        className="mt-5 text-center"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="email" value={address} />
        <button
          type="submit"
          disabled={resending}
          className="text-[0.875rem] font-medium text-accent transition-colors hover:text-accent-soft disabled:opacity-50"
        >
          {resending ? t.auth.pending : t.auth.verifyEmailResend}
        </button>
      </form>

      {resendMessage ? (
        <div className="mt-4">
          <FormNotice tone="error">{resendMessage}</FormNotice>
        </div>
      ) : null}

      <p className="mt-7 text-center text-[0.875rem] text-muted">
        <Link
          href={path(locale, "/auth/resend-verification")}
          className="font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.verifyEmailChangeEmail}
        </Link>
      </p>
    </div>
  );
}
