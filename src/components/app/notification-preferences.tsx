"use client";

import { useActionState } from "react";
import {
  saveNotificationPreferencesAction,
  type NotificationPreferencesState,
} from "@/lib/email/actions";
import type { EmailKind } from "@/lib/email/types";

export type NotificationItem = {
  kind: EmailKind;
  title: string;
  text: string;
  enabled: boolean;
};

export type NotificationLabels = {
  save: string;
  saving: string;
  saved: string;
  error: string;
};

const INITIAL: NotificationPreferencesState = { status: "idle" };

export function NotificationPreferences({
  locale,
  items,
  labels,
}: {
  locale: string;
  items: NotificationItem[];
  labels: NotificationLabels;
}) {
  const [state, action, pending] = useActionState(
    saveNotificationPreferencesAction,
    INITIAL,
  );

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-3">
        {items.map((item) => (
          <label
            key={item.kind}
            className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
          >
            <input
              type="checkbox"
              name={item.kind}
              defaultChecked={item.enabled}
              className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-brand-500"
            />
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-medium text-fg">
                {item.title}
              </span>
              <span className="mt-1 block text-[0.8125rem] leading-relaxed text-subtle">
                {item.text}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>

        {state.status === "saved" ? (
          <span className="text-[0.8125rem] font-medium text-emerald-600 dark:text-emerald-400">
            {labels.saved}
          </span>
        ) : null}

        {state.status === "error" ? (
          <span className="text-[0.8125rem] font-medium text-red-600 dark:text-red-400">
            {labels.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
