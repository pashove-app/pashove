"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { FormNotice, PasswordField, TextField } from "@/components/ui/field";
import { buttonClass, Icon, icons, Ltr, Spinner } from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import {
  changeEmailAction,
  changePasswordAction,
  signOutAction,
} from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/types";

type Props = SectionProps & {
  email: string;
  lastSignIn: string | null;
  twoFactorOn: boolean;
};

export function SecurityPanel({ t, locale, email, lastSignIn, twoFactorOn }: Props) {
  return (
    <div>
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.auth.securityTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.auth.securitySubtitle}</p>

      <PasswordCard t={t} locale={locale} />
      <EmailCard t={t} locale={locale} email={email} />
      <SessionsCard
        t={t}
        locale={locale}
        lastSignIn={lastSignIn}
        twoFactorOn={twoFactorOn}
      />
      <SignOutCard t={t} locale={locale} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Éléments communs
 * ------------------------------------------------------------------ */

function Card({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-7 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-[0.9375rem] font-medium text-fg">{title}</h2>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-subtle">{text}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Success({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
    >
      <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
      {children}
    </p>
  );
}

/** Lit les messages d'un état d'action, en les réservant aux soumissions réelles. */

/* ------------------------------------------------------------------ *
 *  Mot de passe
 * ------------------------------------------------------------------ */

function PasswordCard({ t, locale }: SectionProps) {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    INITIAL_AUTH_STATE,
  );
  const [submitted, setSubmitted] = useState(false);

  const errors = t.auth.errors as Record<string, string>;
  const fieldError = (name: string) => {
    const key = state.fieldErrors?.[name];
    return key ? errors[key] : undefined;
  };
  const message = submitted && state.messageKey ? errors[state.messageKey] : undefined;
  const done = submitted && state.status === "password-changed";

  return (
    <Card title={t.auth.securityPasswordTitle} text={t.auth.securityPasswordText}>
      <form
        action={formAction}
        onSubmit={() => setSubmitted(true)}
        noValidate
        className="space-y-5"
      >
        <input type="hidden" name="locale" value={locale} />

        <PasswordField
          name="current"
          label={t.auth.securityCurrentPassword}
          hint="••••••••"
          autoComplete="current-password"
          revealLabel={t.auth.showPassword}
          concealLabel={t.auth.hidePassword}
          error={fieldError("current")}
        />

        <PasswordField
          name="password"
          label={t.auth.newPassword}
          hint="••••••••"
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

        {done ? <Success>{t.auth.securityPasswordChanged}</Success> : null}
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
            t.auth.securityPasswordCta
          )}
        </button>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 *  Adresse e-mail
 * ------------------------------------------------------------------ */

function EmailCard({ t, locale, email }: SectionProps & { email: string }) {
  const [state, formAction, pending] = useActionState(
    changeEmailAction,
    INITIAL_AUTH_STATE,
  );
  const [submitted, setSubmitted] = useState(false);

  const errors = t.auth.errors as Record<string, string>;
  const fieldError = state.fieldErrors?.email ? errors[state.fieldErrors.email] : undefined;
  const message = submitted && state.messageKey ? errors[state.messageKey] : undefined;
  const done = submitted && state.status === "email-change-sent";

  return (
    <Card title={t.auth.securityEmailTitle} text={t.auth.securityEmailText}>
      <p className="flex items-baseline justify-between gap-4 rounded-xl border border-border px-4 py-3">
        <span className="shrink-0 text-[0.8125rem] text-subtle">
          {t.auth.email}
        </span>
        <span className="min-w-0 truncate text-[0.8125rem] text-body">
          <Ltr>{email}</Ltr>
        </span>
      </p>

      <form
        action={formAction}
        onSubmit={() => setSubmitted(true)}
        noValidate
        className="mt-5 space-y-5"
      >
        <input type="hidden" name="locale" value={locale} />

        <TextField
          name="email"
          type="email"
          label={t.auth.securityNewEmail}
          hint={t.auth.emailHint}
          icon="mail"
          autoComplete="email"
          inputMode="email"
          error={fieldError}
        />

        {done ? <Success>{t.auth.securityEmailSent}</Success> : null}
        {message ? <FormNotice tone="error">{message}</FormNotice> : null}

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
            t.auth.securityEmailCta
          )}
        </button>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 *  Aperçu des sessions
 * ------------------------------------------------------------------ */

function SessionsCard({
  t,
  locale,
  lastSignIn,
  twoFactorOn,
}: SectionProps & { lastSignIn: string | null; twoFactorOn: boolean }) {
  return (
    <Card title={t.auth.sessionsTitle} text={t.auth.securitySessionsText}>
      <dl className="divide-y divide-border rounded-xl border border-border">
        {lastSignIn ? (
          <Row label={t.auth.sessionsLastSignIn} value={lastSignIn} />
        ) : null}
        <Row
          label={t.auth.sessionsTwoFactor}
          value={twoFactorOn ? t.auth.sessionsTwoFactorOn : t.auth.sessionsTwoFactorOff}
        />
      </dl>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={path(locale, "/auth/sessions")}
          className={buttonClass({ variant: "outline" })}
        >
          {t.auth.securitySessionsManage}
        </Link>
        <Link
          href={path(locale, "/auth/2fa/setup")}
          className={buttonClass({ variant: "ghost" })}
        >
          {t.auth.totpSetupTitle}
        </Link>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-[0.8125rem] text-subtle">{label}</dt>
      <dd className="min-w-0 truncate text-[0.8125rem] text-body">
        <Ltr>{value}</Ltr>
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Déconnexion globale
 * ------------------------------------------------------------------ */

function SignOutCard({ t, locale }: SectionProps) {
  return (
    <Card title={t.auth.securitySignOutTitle} text={t.auth.sessionsSignOutAllHint}>
      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className={buttonClass({ variant: "outline", size: "lg", className: "w-full" })}
        >
          {t.auth.sessionsSignOutAll}
        </button>
      </form>
    </Card>
  );
}
