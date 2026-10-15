"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormNotice } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { confirmEmailTokenAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

type Props = SectionProps & {
  tokenHash: string | null;
  intent: "signup" | "recovery" | "invalid";
};

export function ConfirmEmailForm({ t, locale, tokenHash, intent }: Props) {
  const [state, formAction, pending] = useActionState(
    confirmEmailTokenAction,
    INITIAL_AUTH_STATE,
  );

  // Rien ne s'affiche avant un clic : le chargement de cette page ne doit
  // produire aucun effet, c'est tout l'intérêt de l'écran.
  const [submitted, setSubmitted] = useState(false);

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const message =
    submitted && state.messageKey ? dictionaryErrors[state.messageKey] : undefined;

  const recovery = intent === "recovery";

  // Lien tronqué, ou absent : on ne peut rien tenter.
  if (intent === "invalid" || !tokenHash) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300">
          <Icon path={icons.clock} className="h-6 w-6" />
        </span>

        <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
          {t.auth.confirmInvalidTitle}
        </h1>

        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          {t.auth.confirmInvalidText}
        </p>

        <Link
          href={path(locale, "/auth/login")}
          className={buttonClass({ variant: "outline", size: "lg", className: "mt-8 w-full" })}
        >
          {t.auth.switchToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/25 bg-brand-500/[0.08] text-accent">
        <Icon
          path={recovery ? icons.lock : icons.mail}
          className="h-6 w-6"
        />
      </span>

      <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
        {recovery ? t.auth.confirmRecoveryTitle : t.auth.confirmSignupTitle}
      </h1>

      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
        {recovery ? t.auth.confirmRecoveryText : t.auth.confirmSignupText}
      </p>

      <form
        action={formAction}
        onSubmit={() => setSubmitted(true)}
        className="mt-8 space-y-5"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={recovery ? "recovery" : "signup"} />

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
              <Icon path={icons.check} className="h-4 w-4" strokeWidth={2} />
              {recovery ? t.auth.confirmRecoveryCta : t.auth.confirmSignupCta}
            </>
          )}
        </button>
      </form>

      {/* Un jeton ne sert qu'une fois : si celui-ci est mort, il faut en
          redemander un, et le chemin n'est pas le même selon le cas. */}
      {message ? (
        <p className="mt-6">
          <Link
            href={path(locale, recovery ? "/auth/forgot-password" : "/auth/resend-verification")}
            className="text-[0.875rem] font-medium text-accent transition-colors hover:text-accent-soft"
          >
            {recovery ? t.auth.resetExpiredCta : t.auth.verifyEmailResend}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
