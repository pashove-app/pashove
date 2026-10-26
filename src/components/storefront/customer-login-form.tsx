"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField, TextField } from "@/components/ui/field";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { customerSignInAction } from "@/lib/customer/actions";
import {
  INITIAL_CUSTOMER_AUTH,
  type CustomerAuthState,
} from "@/lib/customer/types";

export function CustomerLoginForm({
  t,
  locale,
  slug,
}: {
  t: Dictionary;
  locale: Locale;
  slug: string;
}) {
  const labels = t.customer;
  const [state, formAction, pending] = useActionState<
    CustomerAuthState,
    FormData
  >(customerSignInAction, INITIAL_CUSTOMER_AUTH);

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? t.auth.errors[messageKey as keyof typeof t.auth.errors] ?? messageKey
      : undefined;
  };

  const message = state.messageKey
    ? t.auth.errors[state.messageKey as keyof typeof t.auth.errors] ??
      t.auth.errors.rateLimited
    : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-accent">
          <Icon path={icons.user} className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 text-[1.5rem] font-medium tracking-[-0.03em] text-fg">
          {labels.loginTitle}
        </h1>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">
          {labels.loginSubtitle}
        </p>

        <form action={formAction} className="mt-6 space-y-4" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={slug} />

          <TextField
            name="email"
            label={t.auth.email}
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder={t.auth.emailHint}
            error={fieldError("email")}
          />
          <PasswordField
            name="password"
            label={t.auth.password}
            autoComplete="current-password"
            revealLabel={t.auth.showPassword}
            concealLabel={t.auth.hidePassword}
            error={fieldError("password")}
          />

          {message ? (
            <p
              role="alert"
              className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400"
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            {pending ? labels.signingIn : labels.signIn}
          </button>
        </form>

        <p className="mt-4 text-center text-[0.8125rem] text-subtle">
          {labels.noAccount}{" "}
          <Link
            href={path(locale, `/store/${slug}/account/register`)}
            className="font-medium text-accent hover:underline"
          >
            {labels.goRegister}
          </Link>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-4 text-[0.8125rem]">
        <Link
          href={path(locale, `/store/${slug}`)}
          className="text-subtle transition-colors hover:text-fg"
        >
          {labels.backToStore}
        </Link>
        <Link
          href={path(locale, `/store/${slug}`)}
          className="text-subtle transition-colors hover:text-fg"
        >
          {labels.continueAsGuest}
        </Link>
      </div>
    </div>
  );
}
