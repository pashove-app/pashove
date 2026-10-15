"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormNotice } from "@/components/ui/field";
import { buttonClass, Icon, icons, Ltr, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { signOutAction, signOutOthersAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

type Props = SectionProps & {
  email: string;
  /** Déjà mise en forme côté serveur : aucune divergence à l'hydratation. */
  lastSignIn: string | null;
  twoFactorOn: boolean;
};

export function SessionsPanel({ t, locale, email, lastSignIn, twoFactorOn }: Props) {
  const [state, formAction, pending] = useActionState(
    signOutOthersAction,
    INITIAL_AUTH_STATE,
  );

  // Un message n'apparaît qu'après une soumission, jamais au chargement.
  const [submitted, setSubmitted] = useState(false);

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const message =
    submitted && state.messageKey ? dictionaryErrors[state.messageKey] : undefined;
  const done = submitted && state.status === "others-signed-out";

  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.sessionsTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.sessionsSubtitle}</p>

      <div className="mt-8 rounded-2xl border border-border bg-surface">
        <p className="flex items-center gap-2 border-b border-border px-4 py-3.5 text-[0.8125rem] font-medium text-body">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t.auth.sessionsCurrentTitle}
        </p>

        <dl className="divide-y divide-border">
          <Row label={t.auth.workspaceSignedInAs} value={email} />
          {lastSignIn ? <Row label={t.auth.sessionsLastSignIn} value={lastSignIn} /> : null}
          <Row
            label={t.auth.sessionsTwoFactor}
            value={twoFactorOn ? t.auth.sessionsTwoFactorOn : t.auth.sessionsTwoFactorOff}
          />
        </dl>
      </div>

      <form
        action={formAction}
        onSubmit={() => setSubmitted(true)}
        className="mt-6 space-y-3"
      >
        {done ? (
          <p
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
          >
            <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
            {t.auth.sessionsOthersSignedOut}
          </p>
        ) : null}

        {message ? <FormNotice tone="error">{message}</FormNotice> : null}

        <p className="text-[0.8125rem] leading-relaxed text-subtle">
          {t.auth.sessionsSignOutOthersHint}
        </p>

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
          ) : (
            t.auth.sessionsSignOutOthers
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-[0.8125rem] leading-relaxed text-subtle">
          {t.auth.sessionsSignOutAllHint}
        </p>

        <form action={signOutAction} className="mt-3">
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className={buttonClass({ variant: "outline", size: "lg", className: "w-full" })}
          >
            {t.auth.sessionsSignOutAll}
          </button>
        </form>
      </div>

      <p className="mt-7 text-center text-[0.875rem] text-muted">
        <Link
          href={path(locale, "/app")}
          className="font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.sessionsBack}
        </Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <dt className="shrink-0 text-[0.8125rem] text-subtle">{label}</dt>
      <dd className="min-w-0 truncate text-[0.8125rem] text-body">
        {/* Adresse et date sont des suites latines : on les isole du sens de
            lecture ambiant, sinon l'arabe les coupe en deux. */}
        <Ltr>{value}</Ltr>
      </dd>
    </div>
  );
}
