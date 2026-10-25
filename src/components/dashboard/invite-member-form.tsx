"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SelectField, TextField } from "@/components/ui/field";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { inviteMemberAction } from "@/lib/team/actions";
import {
  INITIAL_INVITE_STATE,
  type InviteMemberState,
} from "@/lib/team/types";

/** Invitation d'un collaborateur, avec lien copiable. */
export function InviteMemberForm({
  t,
  locale,
}: {
  t: Dictionary;
  locale: Locale;
}) {
  const labels = t.dashboard.team;
  const [state, formAction, pending] = useActionState<
    InviteMemberState,
    FormData
  >(inviteMemberAction, INITIAL_INVITE_STATE);
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Le lien complet n'existe que côté navigateur (origine du site) : on
    // complète le champ après le montage, sans provoquer de rendu React.
    if (linkRef.current && state.invitePath) {
      linkRef.current.value = `${window.location.origin}${state.invitePath}`;
    }
  }, [state.invitePath]);

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    return messageKey
      ? labels.errors[messageKey as keyof typeof labels.errors] ?? messageKey
      : undefined;
  };

  const message = state.messageKey
    ? (labels[state.messageKey as keyof typeof labels] as string | undefined) ??
      labels.errors[state.messageKey as keyof typeof labels.errors] ??
      null
    : null;

  const invitePath = state.invitePath ?? "";

  async function copy() {
    const value = linkRef.current?.value;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Certains navigateurs refusent le presse-papiers : le lien reste
      // sélectionnable dans le champ.
    }
  }

  return (
    <div>
      <form action={formAction} noValidate>
        <input type="hidden" name="locale" value={locale} />

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <TextField
            name="email"
            label={labels.emailLabel}
            type="email"
            placeholder={labels.emailPlaceholder}
            maxLength={254}
            autoComplete="off"
            dir="ltr"
            error={fieldError("email")}
          />

          <SelectField
            name="role"
            label={labels.roleLabel}
            defaultValue="product_manager"
            error={fieldError("role")}
          >
            <option value="product_manager">{labels.roleProductManager}</option>
            <option value="admin">{labels.roleAdmin}</option>
          </SelectField>
        </div>

        {message ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-500 px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? <Spinner /> : <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />}
            {pending ? labels.inviting : labels.invite}
          </button>
        </div>
      </form>

      {state.status === "sent" && invitePath ? (
        <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5">
          <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-emerald-700 dark:text-emerald-300">
            <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.4} />
            {labels.inviteSent}
          </p>

          <label className="mt-3 block text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
            {labels.inviteLinkLabel}
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              ref={linkRef}
              readOnly
              defaultValue={invitePath}
              onFocus={(event) => event.currentTarget.select()}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 text-[0.75rem] text-body"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-10 shrink-0 items-center rounded-full border border-border px-3.5 text-[0.75rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
            >
              {copied ? labels.copied : labels.copy}
            </button>
          </div>

          <p className="mt-2 text-[0.6875rem] leading-relaxed text-subtle">
            {labels.emailNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}
