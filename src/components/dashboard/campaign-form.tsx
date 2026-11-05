"use client";

import { useActionState } from "react";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import {
  sendCampaignAction,
  type CampaignState,
} from "@/lib/marketing/campaign-actions";

const INITIAL: CampaignState = { status: "idle" };

export function CampaignForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState(sendCampaignAction, INITIAL);

  return (
    <form
      action={action}
      className="rounded-3xl border border-border bg-surface p-5 sm:p-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <h2 className="text-[0.9375rem] font-medium text-fg">
        Nouvelle campagne
      </h2>
      <p className="mt-1 text-[0.75rem] text-subtle">
        Envoi aux contacts existants, 200 destinataires maximum par campagne.
      </p>

      <div className="mt-4 space-y-3">
        <TextField
          name="subject"
          label="Objet"
          placeholder="Les nouveautés de la semaine"
          maxLength={140}
        />
        <TextAreaField
          name="body"
          label="Message"
          placeholder="Écris ton message…"
          rows={7}
          maxLength={10000}
        />
        <SelectField name="segment" label="Audience" defaultValue="buyers">
          <option value="buyers">Clients ayant payé</option>
          <option value="all">Tous les contacts</option>
          <option value="digital">Acheteurs de produits numériques</option>
        </SelectField>
      </div>

      {state.status === "error" ? (
        <p className="mt-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[0.75rem] text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}
      {state.status === "queued" ? (
        <p className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3 py-2 text-[0.75rem] text-emerald-700 dark:text-emerald-300">
          Campagne en cours d’envoi vers {state.count} contact
          {state.count === 1 ? "" : "s"}.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Envoi…" : "Lancer la campagne"}
      </button>
    </form>
  );
}
