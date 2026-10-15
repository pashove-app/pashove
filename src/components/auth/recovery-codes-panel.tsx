"use client";

import { useActionState, useState } from "react";
import { FormNotice } from "@/components/ui/field";
import { buttonClass, Icon, icons, Ltr, Spinner } from "@/components/ui/primitives";
import type { SectionProps } from "@/components/ui/types";
import { generateRecoveryCodesAction } from "@/lib/auth/actions";
import { INITIAL_RECOVERY_CODES_STATE } from "@/lib/auth/types";
import { interpolate } from "@/i18n/get-dictionary";
import type { RecoveryCodesStatus } from "@/lib/auth/mfa";

/**
 * Codes de secours, sur la page de configuration du second facteur.
 *
 * Supabase ne montre les codes qu'une seule fois : après génération, ils
 * disparaissent pour de bon. L'écran insiste donc dessus, et prévient avant de
 * remplacer un jeu existant — l'ancien cesse aussitôt de fonctionner.
 */
export function RecoveryCodesPanel({
  t,
  status,
}: SectionProps & { status: RecoveryCodesStatus | null }) {
  const [state, formAction, pending] = useActionState(
    generateRecoveryCodesAction,
    INITIAL_RECOVERY_CODES_STATE,
  );
  const [confirming, setConfirming] = useState(false);

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const message = state.messageKey ? dictionaryErrors[state.messageKey] : undefined;
  const codes = state.status === "codes-generated" ? (state.codes ?? []) : [];

  return (
    <section className="mt-7 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-[0.9375rem] font-medium text-fg">{t.auth.recoveryTitle}</h2>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-subtle">
        {t.auth.recoveryText}
      </p>

      {status && codes.length === 0 ? (
        <p className="mt-4 text-[0.8125rem] text-body">
          {interpolate(t.auth.recoveryRemaining, {
            remaining: status.remaining,
            total: status.total,
          })}
        </p>
      ) : null}

      {/* Les codes n'existent qu'à cet instant : on les donne à lire une fois. */}
      {codes.length > 0 ? (
        <div className="mt-4 rounded-xl border border-brand-500/25 bg-brand-500/[0.06] p-4">
          <p className="text-[0.8125rem] font-medium text-fg">
            {t.auth.recoveryCodesTitle}
          </p>

          <ul className="mt-3 grid grid-cols-2 gap-2">
            {codes.map((code) => (
              <li
                key={code}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-center font-mono text-[0.8125rem] text-body select-all"
              >
                <Ltr>{code}</Ltr>
              </li>
            ))}
          </ul>

          <p className="mt-3 flex items-start gap-2 text-[0.75rem] leading-relaxed text-muted">
            <Icon path={icons.shield} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            {t.auth.recoveryWarning}
          </p>
          <p className="mt-1.5 text-[0.75rem] text-subtle">{t.auth.recoveryCodesNote}</p>
        </div>
      ) : null}

      <form
        action={formAction}
        onSubmit={() => setConfirming(false)}
        className="mt-5 space-y-3"
      >
        {message ? <FormNotice tone="error">{message}</FormNotice> : null}

        {status && !confirming ? (
          // Remplacer un jeu existant invalide l'ancien : on le demande deux fois.
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={buttonClass({ variant: "outline", size: "lg", className: "w-full" })}
          >
            {t.auth.recoveryRegenerateCta}
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className={buttonClass({ variant: "outline", size: "lg", className: "w-full" })}
          >
            {pending ? (
              <>
                <Spinner />
                {t.auth.pending}
              </>
            ) : status ? (
              t.auth.recoveryRegenerateCta
            ) : (
              t.auth.recoveryGenerateCta
            )}
          </button>
        )}
      </form>
    </section>
  );
}
