"use client";

import { useActionState } from "react";
import {
  saveGiftSettingsAction,
  type GiftSettingsState,
} from "@/lib/gifts/actions";
import type { GiftCopy } from "@/lib/gifts/copy";

const INITIAL: GiftSettingsState = { status: "idle" };

export function GiftSettingsForm({
  locale,
  enabled,
  copy,
}: {
  locale: string;
  enabled: boolean;
  copy: GiftCopy;
}) {
  const [state, action, pending] = useActionState(
    saveGiftSettingsAction,
    INITIAL,
  );

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="locale" value={locale} />

      <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-surface p-5">
        <input
          type="checkbox"
          name="giftEnabled"
          defaultChecked={enabled}
          className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-brand-500"
        />
        <span>
          <span className="block text-[0.9375rem] font-medium text-fg">
            {copy.merchant.settingsToggle}
          </span>
          <span className="mt-1 block text-[0.8125rem] leading-relaxed text-subtle">
            {copy.merchant.settingsHint}
          </span>
        </span>
      </label>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? copy.merchant.saving : copy.merchant.save}
        </button>

        {state.status === "saved" ? (
          <span className="text-[0.8125rem] font-medium text-emerald-600 dark:text-emerald-400">
            {copy.merchant.saved}
          </span>
        ) : null}

        {state.status === "error" ? (
          <span className="text-[0.8125rem] font-medium text-red-600 dark:text-red-400">
            {copy.merchant.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
