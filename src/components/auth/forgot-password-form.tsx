"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormNotice, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Ltr, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

export function ForgotPasswordForm({ t, locale }: SectionProps) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    INITIAL_AUTH_STATE,
  );

  const dictionaryErrors = t.auth.errors as Record<string, string>;
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? dictionaryErrors[key] : undefined;
  };
  const formMessage = state.messageKey ? dictionaryErrors[state.messageKey] : undefined;

  // Adresse inconnue ou adresse connue : même écran. Supabase ne dit pas
  // laquelle existe, et l'interface ne doit pas le dire non plus.
  if (state.status === "reset-sent") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
          <Icon path={icons.mail} className="h-6 w-6" />
        </span>

        <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
          {t.auth.forgotSentTitle}
        </h1>

        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          {withEmail(t.auth.forgotSentText, state.email ?? "")}
        </p>

        <p className="mt-2 text-[0.8125rem] leading-relaxed text-subtle">
          {t.auth.forgotSentHint}
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
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.forgotTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.forgotSubtitle}</p>

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
              {t.auth.forgotCta}
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

/**
 * Insère l'adresse dans la phrase traduite, en l'isolant du sens de lecture :
 * en arabe, une suite latine au milieu d'une phrase se coupe autrement en deux.
 */
function withEmail(template: string, email: string) {
  if (!template.includes("{email}")) return template;

  const [before, after = ""] = template.split("{email}");

  return (
    <>
      {before}
      <Ltr className="font-medium text-body">{email}</Ltr>
      {after}
    </>
  );
}
