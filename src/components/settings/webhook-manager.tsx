"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import {
  createWebhookAction,
  deleteWebhookAction,
  toggleWebhookAction,
  type WebhookFormState,
} from "@/lib/webhooks/actions";
import type {
  WebhookDelivery,
  WebhookEndpoint,
} from "@/lib/webhooks/queries";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/signing";

const INITIAL: WebhookFormState = { status: "idle" };

const LABELS: Record<string, string> = {
  "order.created": "Commande créée",
  "order.paid": "Commande payée",
  "order.updated": "Commande mise à jour",
  "order.cancelled": "Commande annulée",
  "order.refund_requested": "Remboursement demandé",
  "order.refunded": "Commande remboursée",
};

export function WebhookManager({
  endpoints,
  deliveries,
}: {
  endpoints: WebhookEndpoint[];
  deliveries: WebhookDelivery[];
}) {
  const [state, action, pending] = useActionState(createWebhookAction, INITIAL);

  return (
    <div className="space-y-5">
      <form action={action} className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Nouveau webhook</h2>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
          Pashove envoie un POST JSON signé à chaque événement. Réponds 2xx pour accuser réception.
        </p>

        <label className="mt-3 block">
          <span className="block text-[0.6875rem] text-subtle">URL HTTPS</span>
          <input
            name="url"
            type="url"
            required
            placeholder="https://exemple.com/webhooks/pashove"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
        </label>

        <fieldset className="mt-3">
          <legend className="text-[0.6875rem] text-subtle">Événements</legend>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {WEBHOOK_EVENTS.map((event) => (
              <label key={event} className="flex items-center gap-2 text-[0.8125rem] text-body">
                <input
                  type="checkbox"
                  name="events"
                  value={event}
                  defaultChecked={event === "order.paid"}
                  className="h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-500/30"
                />
                {LABELS[event]}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[0.8125rem] font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? <Spinner /> : null}
          Créer le webhook
        </button>

        {state.status === "error" ? (
          <p role="alert" className="mt-3 text-[0.75rem] font-medium text-red-500 dark:text-red-400">
            {state.message}
          </p>
        ) : null}

        {state.status === "saved" && state.secret ? (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4">
            <p className="text-[0.75rem] font-medium text-amber-700 dark:text-amber-300">
              Secret de signature, affiché une seule fois. Vérifie l’en-tête <code>X-Pashove-Signature</code> = HMAC-SHA256 de <code>timestamp.body</code>.
            </p>
            <code dir="ltr" className="mt-2 block break-all rounded-lg bg-surface px-3 py-2 font-mono text-[0.75rem] text-fg">
              {state.secret}
            </code>
          </div>
        ) : null}
      </form>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="text-[0.9375rem] font-medium text-fg">Endpoints</h2>
        </div>
        {endpoints.length === 0 ? (
          <p className="px-5 py-8 text-center text-[0.8125rem] text-subtle">
            Aucun endpoint configuré.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {endpoints.map((endpoint) => (
              <li key={endpoint.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p dir="ltr" className="truncate font-mono text-[0.75rem] text-fg">
                    {endpoint.url}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-subtle">
                    {endpoint.events.map((event) => LABELS[event] ?? event).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleWebhookAction}>
                    <input type="hidden" name="id" value={endpoint.id} />
                    <input type="hidden" name="active" value={String(!endpoint.active)} />
                    <button
                      type="submit"
                      className="rounded-full border border-border bg-surface px-3 py-1 text-[0.6875rem] font-medium text-body hover:border-border-strong"
                    >
                      {endpoint.active ? "Désactiver" : "Activer"}
                    </button>
                  </form>
                  <form action={deleteWebhookAction}>
                    <input type="hidden" name="id" value={endpoint.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-400/30 bg-red-400/[0.06] px-3 py-1 text-[0.6875rem] font-medium text-red-600 dark:text-red-400"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="text-[0.9375rem] font-medium text-fg">Dernières livraisons</h2>
        </div>
        {deliveries.length === 0 ? (
          <p className="px-5 py-8 text-center text-[0.8125rem] text-subtle">
            Aucune livraison pour l’instant.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {deliveries.map((delivery) => (
              <li key={delivery.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-medium text-fg">{delivery.event}</p>
                  <p dir="ltr" className="truncate font-mono text-[0.625rem] text-subtle">
                    {delivery.endpoint_url}
                  </p>
                  {delivery.last_error ? (
                    <p className="text-[0.625rem] text-red-500 dark:text-red-400">{delivery.last_error}</p>
                  ) : null}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.625rem] font-medium ${
                    delivery.status === "success"
                      ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      : delivery.status === "failed"
                        ? "bg-red-500/12 text-red-600 dark:text-red-400"
                        : "bg-amber-500/12 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {delivery.status === "success" ? "Envoyé" : delivery.status === "failed" ? "Échec" : "En attente"} · {delivery.attempts}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
