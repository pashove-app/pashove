"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import type { JoinState } from "@/lib/delivery-partners/actions";

type Action = (state: JoinState, formData: FormData) => Promise<JoinState>;

const INPUT =
  "mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-[0.875rem] text-fg focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12";

export function PartnerJoinForm({
  token,
  email,
  company,
  action,
}: {
  token: string;
  email: string;
  company: string;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="rounded-2xl border border-border bg-bg-soft px-4 py-3 text-[0.8125rem] text-body">
        <p className="font-medium text-fg">{company}</p>
        <p className="mt-0.5 text-[0.75rem] text-subtle">{email}</p>
      </div>
      <label className="block text-[0.8125rem] font-medium text-body">
        Votre nom
        <input name="fullName" required maxLength={120} className={INPUT} />
      </label>
      <label className="block text-[0.8125rem] font-medium text-body">
        Mot de passe
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={INPUT}
        />
        <span className="mt-1 block text-[0.6875rem] text-faint">
          8 caractères minimum.
        </span>
      </label>
      {state.message ? (
        <p className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[0.75rem] text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        Créer mon espace partenaire
      </button>
    </form>
  );
}

export function DriverJoinForm({
  code,
  name,
  email,
  phone,
  company,
  action,
}: {
  code: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="code" value={code} />
      <div className="rounded-2xl border border-border bg-bg-soft px-4 py-3 text-[0.8125rem] text-body">
        <p className="font-medium text-fg">{company}</p>
        <p className="mt-0.5 text-[0.75rem] text-subtle">
          {name} · {email}
        </p>
      </div>
      <label className="block text-[0.8125rem] font-medium text-body">
        Nom complet
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={name}
          className={INPUT}
        />
      </label>
      <label className="block text-[0.8125rem] font-medium text-body">
        Téléphone
        <input
          name="phone"
          type="tel"
          required
          maxLength={40}
          defaultValue={phone}
          className={INPUT}
        />
      </label>
      <label className="block text-[0.8125rem] font-medium text-body">
        Mot de passe
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={INPUT}
        />
        <span className="mt-1 block text-[0.6875rem] text-faint">
          8 caractères minimum.
        </span>
      </label>
      {state.message ? (
        <p className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[0.75rem] text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        Créer mon compte livreur
      </button>
    </form>
  );
}
