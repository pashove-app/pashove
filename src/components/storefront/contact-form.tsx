"use client";

import { useActionState } from "react";
import { TextAreaField, TextField } from "@/components/ui/field";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { sendContactAction, type ContactState } from "@/lib/storefront/contact-actions";
import type { StoreAdminCopy } from "@/lib/storefront/admin-copy";

const INITIAL: ContactState = { status: "idle" };

export function ContactForm({
  locale,
  slug,
  labels,
}: {
  locale: string;
  slug: string;
  labels: StoreAdminCopy["contact"];
}) {
  const [state, action, pending] = useActionState(sendContactAction, INITIAL);

  if (state.status === "sent") {
    return (
      <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6 text-center sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Icon path={icons.check} className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <h2 className="mt-5 text-[1.25rem] font-medium text-fg">
          {labels.sentTitle}
        </h2>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
          {labels.sentText}
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-3xl border border-border bg-surface p-5 sm:p-7"
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label={labels.name} autoComplete="name" maxLength={120} />
        <TextField
          name="email"
          label={labels.email}
          type="email"
          dir="ltr"
          autoComplete="email"
          maxLength={254}
        />
        <div className="sm:col-span-2">
          <TextAreaField
            name="message"
            label={labels.message}
            rows={6}
            maxLength={2000}
          />
        </div>
      </div>

      {state.status === "invalid" ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] text-red-600 dark:text-red-400">
          {labels.required}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] text-red-600 dark:text-red-400">
          {labels.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
      >
        {pending ? <Spinner /> : null}
        {pending ? labels.sending : labels.send}
      </button>
    </form>
  );
}
