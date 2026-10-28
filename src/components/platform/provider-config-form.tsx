"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import {
  savePaymentProviderAction,
  type PaymentActionResult,
} from "@/lib/payments/actions";
import type { AdminPaymentProvider } from "@/lib/payments/types";

const INITIAL: PaymentActionResult = { ok: false };

export function ProviderConfigForm({
  provider,
}: {
  provider: AdminPaymentProvider;
}) {
  const [state, action, pending] = useActionState<
    PaymentActionResult,
    FormData
  >(savePaymentProviderAction, INITIAL);

  if (provider.code === "mock") {
    return (
      <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3 py-2.5 text-[0.75rem] text-emerald-700 dark:text-emerald-300">
        Fournisseur de test actif : les paiements sont simulés, sans argent réel.
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-hairline pt-4">
      <input type="hidden" name="code" value={provider.code} />
      <input type="hidden" name="status" value="active" />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[0.6875rem] font-medium text-body">Mode</span>
          <select
            name="mode"
            defaultValue={provider.mode}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg focus:border-brand-500 focus:outline-none"
          >
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[0.6875rem] font-medium text-body">Clé publique</span>
          <input
            name="publicKey"
            autoComplete="off"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-[0.75rem] text-fg focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[0.6875rem] font-medium text-body">Clé secrète</span>
          <input
            name="secretKey"
            type="password"
            autoComplete="new-password"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-[0.75rem] text-fg focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[0.6875rem] font-medium text-body">Secret webhook</span>
          <input
            name="webhookSecret"
            type="password"
            autoComplete="new-password"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 font-mono text-[0.75rem] text-fg focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-[0.75rem] font-medium text-white disabled:opacity-60"
        >
          {pending ? <Spinner /> : null}
          Enregistrer
        </button>
        {state.messageKey ? (
          <span
            role={state.ok ? "status" : "alert"}
            className={`text-[0.6875rem] ${
              state.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
            }`}
          >
            {state.messageKey === "paymentProviderSaved"
              ? "Clés enregistrées et chiffrées."
              : state.messageKey === "paymentProviderKeysRequired"
                ? "Renseigne les clés avant d’activer."
                : state.messageKey === "paymentProviderEncryption"
                  ? "Chiffrement indisponible : configure ENCRYPTION_KEY."
                  : "Enregistrement impossible."}
          </span>
        ) : null}
      </div>
    </form>
  );
}
