import type { Metadata } from "next";
import { Icon, icons } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { completeRefundAction } from "@/lib/refunds/admin-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pashove · Remboursements",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  requested: "Demandé",
  processing: "En cours",
  completed: "Remboursé",
  failed: "Échoué",
  rejected: "Refusé",
};

function statusTone(status: string): string {
  if (status === "completed") {
    return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400";
  }
  if (status === "failed" || status === "rejected") {
    return "bg-red-500/12 text-red-600 dark:text-red-400";
  }
  return "bg-amber-500/12 text-amber-600 dark:text-amber-400";
}

export default async function AdminRefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const supabase = await createClient();

  const { data: refunds } = await supabase
    .from("refunds")
    .select(
      "id, amount, currency, status, reason, provider_reference, created_at, completed_at, order:orders(number), store:stores(name, slug)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = refunds ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Finance
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          Remboursements
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          SasPay n’expose pas d’API de remboursement. Exécute le remboursement
          dans le tableau SasPay/PayDunya, puis confirme-le ici avec sa
          référence : les écritures compensatoires du ledger seront postées.
        </p>
      </header>

      {ok ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          Remboursement confirmé et ledger mis à jour.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          Opération impossible. Vérifie la référence et réessaie.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/[0.1] text-accent">
            <Icon path={icons.wallet} className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            Aucune demande
          </p>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            Les demandes de remboursement des marchands apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-hairline overflow-hidden rounded-3xl border border-border bg-surface">
          {rows.map((refund) => {
            const store = refund.store as
              | { name?: string; slug?: string }
              | null;
            const order = refund.order as { number?: number } | null;
            const pending =
              refund.status === "requested" || refund.status === "processing";

            return (
              <div key={refund.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.875rem] font-medium text-fg">
                        Commande #{order?.number ?? "—"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.625rem] ${statusTone(refund.status)}`}
                      >
                        {STATUS_LABELS[refund.status] ?? refund.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.6875rem] text-faint">
                      {store?.name ?? "Boutique"}
                      {store?.slug ? ` · /${store.slug}` : ""}
                      {refund.reason ? ` · ${refund.reason}` : ""}
                    </p>
                    {refund.provider_reference ? (
                      <p className="mt-0.5 font-mono text-[0.625rem] text-subtle">
                        Réf. SasPay : {refund.provider_reference}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-[0.9375rem] font-medium text-fg">
                      {formatMoney(refund.amount, refund.currency, "fr-FR")}
                    </p>
                    <p className="mt-0.5 text-[0.625rem] text-faint">
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(refund.created_at))}
                    </p>
                  </div>
                </div>

                {pending ? (
                  <form
                    action={completeRefundAction}
                    className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-bg-soft p-3"
                  >
                    <input type="hidden" name="refundId" value={refund.id} />
                    <label className="min-w-[14rem] flex-1">
                      <span className="block text-[0.6875rem] text-subtle">
                        Référence SasPay du remboursement
                      </span>
                      <input
                        name="reference"
                        required
                        maxLength={120}
                        placeholder="Référence du tableau SasPay"
                        className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-[0.75rem] font-medium text-white hover:bg-brand-600"
                    >
                      <Icon
                        path={icons.check}
                        className="h-3.5 w-3.5"
                        strokeWidth={2.4}
                      />
                      Confirmer le remboursement
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
