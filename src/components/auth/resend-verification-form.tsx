"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { withEmail } from "@/components/auth/with-email";
import { FormNotice, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { resendVerificationAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

type Props = SectionProps & { email: string | null };

export function ResendVerificationForm({ t, locale, email }: Props) {
  const [state, formAction, pending] = useActionState(
    resendVerificationAction,
    INITIAL_AUTH_STATE,
  );

  // L'écran de confirmation ne s'affiche qu'après une soumission : un état
  // d'action restauré par le navigateur ne doit pas faire croire à un envoi.
  const [submitted, setSubmitted] = useState(false);

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? dictionaryErrors[key] : undefined;
  };
  const message = state.messageKey ? dictionaryErrors[state.messageKey] : undefined;

  // Même écran que le compte existe ou non : on ne révèle pas qui est inscrit.
  if (submitted && state.status === "code-sent") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
          <Icon path={icons.mail} className="h-6 w-6" />
        </span>

        <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
          {t.auth.verifyEmailSentTitle}
        </h1>

        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          {withEmail(t.auth.verifyEmailSentText, state.email ?? "")}
        </p>

        <p className="mt-2 text-[0.8125rem] leading-relaxed text-subtle">
          {t.auth.verifyEmailSentHint}
        </p>

        <Link
          href={path(locale, "/auth/verify-email")}
          className={buttonClass({ size: "lg", className: "mt-8 w-full" })}
        >
          <Icon path={icons.check} className="h-4 w-4" strokeWidth={2} />
          {t.auth.verifyEmailVerifyCta}
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
        {t.auth.resendTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.resendSubtitle}</p>

      <form
        action={formAction}
        onSubmit={() => setSubmitted(true)}
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
          defaultValue={email ?? undefined}
          error={fieldError("email")}
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
              <Icon path={icons.mail} className="h-4 w-4" />
              {t.auth.resendCta}
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
