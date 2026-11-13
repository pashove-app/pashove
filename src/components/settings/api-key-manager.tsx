"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  type ApiKeyState,
} from "@/lib/api-keys/actions";
import type { ApiKeyRecord } from "@/lib/api-keys/queries";

const INITIAL: ApiKeyState = { status: "idle" };

export function ApiKeyManager({ keys }: { keys: ApiKeyRecord[] }) {
  const [state, action, pending] = useActionState(createApiKeyAction, INITIAL);

  return (
    <div className="space-y-5">
      <form action={action} className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Nouvelle clé</h2>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
          Une clé donne un accès en lecture à tes produits, commandes et informations de boutique. Elle n’est affichée qu’une fois.
        </p>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-[14rem] flex-1">
            <span className="block text-[0.6875rem] text-subtle">Nom</span>
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              placeholder="Ex. Intégration WMS"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[0.8125rem] font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            Créer la clé
          </button>
        </div>

        {state.status === "error" ? (
          <p role="alert" className="mt-3 text-[0.75rem] font-medium text-red-500 dark:text-red-400">
            {state.message}
          </p>
        ) : null}

        {state.status === "saved" && state.key ? (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4">
            <p className="text-[0.75rem] font-medium text-amber-700 dark:text-amber-300">
              Copie cette clé maintenant. Elle ne sera plus affichée.
            </p>
            <code
              dir="ltr"
              className="mt-2 block break-all rounded-lg bg-surface px-3 py-2 font-mono text-[0.75rem] text-fg"
            >
              {state.key}
            </code>
          </div>
        ) : null}
      </form>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="text-[0.9375rem] font-medium text-fg">Clés existantes</h2>
        </div>

        {keys.length === 0 ? (
          <p className="px-5 py-8 text-center text-[0.8125rem] text-subtle">
            Aucune clé pour l’instant.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {keys.map((key) => (
              <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className={cn("text-[0.8125rem] font-medium", key.revoked_at ? "text-faint line-through" : "text-fg")}>
                    {key.name}
                  </p>
                  <p dir="ltr" className="font-mono text-[0.6875rem] text-subtle">
                    {key.prefix}…
                  </p>
                  <p className="mt-0.5 text-[0.625rem] text-faint">
                    Créée le {new Date(key.created_at).toLocaleDateString("fr-FR")}
                    {key.last_used_at
                      ? ` · dernière utilisation ${new Date(key.last_used_at).toLocaleDateString("fr-FR")}`
                      : " · jamais utilisée"}
                  </p>
                </div>

                {key.revoked_at ? (
                  <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[0.625rem] font-medium text-red-600 dark:text-red-400">
                    Révoquée
                  </span>
                ) : (
                  <form action={revokeApiKeyAction}>
                    <input type="hidden" name="id" value={key.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-border bg-surface px-3 py-1 text-[0.6875rem] font-medium text-body hover:border-border-strong"
                    >
                      Révoquer
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
