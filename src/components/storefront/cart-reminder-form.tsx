"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import {
  saveCartReminderAction,
  type ReminderState,
} from "@/lib/storefront/reminder-actions";

const INITIAL: ReminderState = { status: "idle" };

export function CartReminderForm() {
  const [state, action, pending] = useActionState(
    saveCartReminderAction,
    INITIAL,
  );

  if (state.status === "saved") {
    return (
      <p className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
        C’est noté. Si ton panier est encore là dans 24 h, on te l’enverra par
        e-mail.
      </p>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-border bg-surface/60 p-4"
    >
      <p className="text-[0.8125rem] font-medium text-fg">
        Garde ton panier pour plus tard
      </p>
      <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
        Laisse ton e-mail : si tu ne termines pas, on te rappelle ton panier une
        fois, après 24 h.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ton@email.com"
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand-500 px-4 text-[0.75rem] font-medium text-white disabled:opacity-60"
        >
          {pending ? <Spinner /> : null}
          {pending ? "Enregistrement…" : "Me rappeler"}
        </button>
      </div>
      {state.status === "error" ? (
        <p className="mt-2 text-[0.6875rem] text-red-500">{state.message}</p>
      ) : null}
    </form>
  );
}
