"use client";

import { useActionState, useState } from "react";
import { Spinner } from "@/components/ui/primitives";
import {
  replyTicketAction,
  type SupportActionState,
} from "@/lib/support/actions";
import type { SupportMacro } from "@/lib/support/queries";

const INITIAL: SupportActionState = { status: "idle" };

export function ReplyForm({
  ticketId,
  closed,
  macros = [],
}: {
  ticketId: string;
  closed: boolean;
  macros?: SupportMacro[];
}) {
  const [state, action, pending] = useActionState(replyTicketAction, INITIAL);
  const [body, setBody] = useState("");

  if (closed) {
    return (
      <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-[0.8125rem] text-subtle">
        Ce ticket est fermé. Ouvre-en un nouveau si le problème persiste.
      </p>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="ticketId" value={ticketId} />

      {macros.length > 0 ? (
        <label className="mb-2 block">
          <span className="block text-[0.6875rem] text-subtle">
            Insérer une macro
          </span>
          <select
            className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg"
            defaultValue=""
            onChange={(event) => {
              const macro = macros.find((item) => item.id === event.target.value);
              if (macro) setBody(macro.body);
            }}
          >
            <option value="">—</option>
            {macros.map((macro) => (
              <option key={macro.id} value={macro.id}>
                {macro.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <textarea
        name="body"
        required
        maxLength={4000}
        rows={4}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Écris ta réponse…"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
      />

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[0.75rem] font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? <Spinner /> : null}
          Envoyer
        </button>

        {state.status === "error" ? (
          <span role="alert" className="text-[0.75rem] text-red-500 dark:text-red-400">
            La réponse n’a pas pu être envoyée.
          </span>
        ) : null}
        {state.status === "saved" ? (
          <span role="status" className="text-[0.75rem] text-emerald-600 dark:text-emerald-400">
            Réponse envoyée.
          </span>
        ) : null}
      </div>
    </form>
  );
}
