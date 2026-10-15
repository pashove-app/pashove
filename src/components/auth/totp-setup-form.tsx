"use client";

import { useActionState } from "react";
import { FormNotice, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import type { SectionProps } from "@/components/ui/types";
import {
  disableTotpAction,
  startTotpEnrollmentAction,
  verifyTotpEnrollmentAction,
} from "@/lib/auth/actions";
import {
  INITIAL_AUTH_STATE,
  INITIAL_TOTP_ENROLLMENT_STATE,
  type AuthState,
  type TotpEnrollmentState,
} from "@/lib/auth/types";

type Props = SectionProps & { verifiedFactorId?: string };

export function TotpSetupForm({ t, locale, verifiedFactorId }: Props) {
  const [enrollState, startAction, starting] = useActionState(
    startTotpEnrollmentAction,
    INITIAL_TOTP_ENROLLMENT_STATE,
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyTotpEnrollmentAction,
    INITIAL_TOTP_ENROLLMENT_STATE,
  );
  const [disableState, disableAction, disabling] = useActionState(
    disableTotpAction,
    INITIAL_AUTH_STATE,
  );

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const codeError = (state: AuthState) => {
    const key = state.fieldErrors?.code;
    return key ? dictionaryErrors[key] : undefined;
  };
  const message = (state: AuthState) =>
    state.messageKey ? dictionaryErrors[state.messageKey] : undefined;

  // Déjà configurée : on ne propose plus que de la retirer.
  if (verifiedFactorId) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
          <Icon path={icons.check} className="h-6 w-6" strokeWidth={2} />
        </span>

        <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
          {t.auth.totpActiveTitle}
        </h1>

        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          {t.auth.totpActiveText}
        </p>

        <form action={disableAction} className="mt-8 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="factorId" value={verifiedFactorId} />

          {message(disableState) ? (
            <FormNotice tone="error">{message(disableState)}</FormNotice>
          ) : null}

          <button
            type="submit"
            disabled={disabling}
            className={buttonClass({ variant: "outline", size: "lg", className: "w-full" })}
          >
            {disabling ? (
              <>
                <Spinner />
                {t.auth.pending}
              </>
            ) : (
              t.auth.totpDisableCta
            )}
          </button>
        </form>
      </div>
    );
  }

  // Enrôlement ouvert : on montre le QR code et on attend le premier code.
  if (enrollState.status === "enrolling") {
    return (
      <div>
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {t.auth.totpScanTitle}
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.totpScanText}</p>

        <div className="mx-auto mt-7 w-full max-w-[13rem] rounded-2xl border border-border bg-white p-3">
          {/* Supabase renvoie le QR code sous forme de data URI SVG, pas de balisage
              brut : il s'affiche comme une image. Fond blanc imposé, le QR étant
              noir sur transparent et donc illisible sur le thème sombre. */}
          {enrollState.qrCode ? (
            <img src={enrollState.qrCode} alt="" className="h-auto w-full" />
          ) : null}
        </div>

        <div className="mt-6">
          <p className="text-[0.8125rem] font-medium text-body">
            {t.auth.totpSecretLabel}
          </p>
          <p
            dir="ltr"
            className="mt-2 rounded-xl border border-border bg-surface px-4 py-3 text-center font-mono text-[0.8125rem] break-all text-muted select-all"
          >
            {enrollState.secret}
          </p>
        </div>

        <form action={verifyAction} noValidate className="mt-7 space-y-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="factorId" value={enrollState.factorId ?? ""} />

          <TextField
            name="code"
            label={t.auth.totpCodeLabel}
            hint={t.auth.totpCodeHint}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            error={codeError(verifyState)}
            className="text-center tracking-[0.4em]"
          />

          {message(verifyState) ? (
            <FormNotice tone="error">{message(verifyState)}</FormNotice>
          ) : null}

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
                <Icon path={icons.shield} className="h-4 w-4" />
                {t.auth.totpVerifyCta}
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // Rien d'engagé : on explique avant de créer quoi que ce soit.
  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.totpSetupTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.totpSetupSubtitle}</p>

      <form action={startAction} className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={locale} />

        {enrollState.status === "unconfigured" ? (
          <FormNotice>{t.auth.notConfigured}</FormNotice>
        ) : null}

        {message(enrollState) ? (
          <FormNotice tone="error">{message(enrollState)}</FormNotice>
        ) : null}

        <button
          type="submit"
          disabled={starting}
          className={buttonClass({ size: "lg", className: "w-full" })}
        >
          {starting ? (
            <>
              <Spinner />
              {t.auth.pending}
            </>
          ) : (
            <>
              <Icon path={icons.shield} className="h-4 w-4" />
              {t.auth.totpStartCta}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
