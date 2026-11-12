"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  createTicketAction,
  type SupportActionState,
} from "@/lib/support/actions";

const INITIAL: SupportActionState = { status: "idle" };

const FIELD =
  "mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12";

const MESSAGES: Record<string, string> = {
  tooManyTickets: "Tu as déjà 10 tickets ouverts. Attends une réponse avant d’en créer un autre.",
  subjectInvalid: "Le sujet doit contenir entre 4 et 140 caractères.",
  messageInvalid: "Le message doit contenir entre 2 et 4 000 caractères.",
  notAllowed: "Tu n’as pas accès à cette boutique.",
  actionFailed: "Le ticket n’a pas pu être créé.",
};

export function TicketForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState(createTicketAction, INITIAL);

  return (
    <form
      action={action}
      className="rounded-3xl border border-border bg-surface p-5 sm:p-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <h2 className="text-[0.9375rem] font-medium text-fg">
        Ouvrir un ticket
      </h2>
      <p className="mt-1 text-[0.8125rem] text-subtle">
        Décris le problème. L’équipe répond selon la priorité choisie.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="block text-[0.75rem] font-medium text-body">Sujet</span>
          <input
            name="subject"
            required
            minLength={4}
            maxLength={140}
            placeholder="Ex. Retrait bloqué depuis hier"
            className={FIELD}
          />
        </label>

        <label>
          <span className="block text-[0.75rem] font-medium text-body">
            Catégorie
          </span>
          <select name="category" className={FIELD} defaultValue="other">
            <option value="payments">Paiements et retraits</option>
            <option value="orders">Commandes</option>
            <option value="inventory">Stock</option>
            <option value="delivery">Livraison</option>
            <option value="account">Compte</option>
            <option value="other">Autre</option>
          </select>
        </label>

        <label>
          <span className="block text-[0.75rem] font-medium text-body">
            Priorité
          </span>
          <select name="priority" className={FIELD} defaultValue="normal">
            <option value="low">Basse — 48 h</option>
            <option value="normal">Normale — 24 h</option>
            <option value="high">Haute — 8 h</option>
            <option value="urgent">Urgente — 4 h</option>
          </select>
        </label>

        <label className="sm:col-span-2">
          <span className="block text-[0.75rem] font-medium text-body">
            Message
          </span>
          <textarea
            name="body"
            required
            minLength={2}
            maxLength={4000}
            rows={5}
            placeholder="Explique ce qui se passe, avec les références utiles…"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[0.8125rem] font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        Créer le ticket
      </button>

      {state.status === "error" && state.messageKey ? (
        <p role="alert" className="mt-3 text-[0.75rem] font-medium text-red-500 dark:text-red-400">
          {MESSAGES[state.messageKey] ?? MESSAGES.actionFailed}
        </p>
      ) : null}
    </form>
  );
}
