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

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "requested", label: "Demandées" },
  { value: "completed", label: "Remboursées" },
  { value: "failed", label: "Échouées" },
] as const;

export default async function AdminRefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; status?: string }>;
}) {
  const { ok, error, status } = await searchParams;
  const filter = FILTERS.some((item) => item.value === status)
    ? (status as string)
    : "all";
  const supabase = await createClient();

  const query = supabase
    .from("refunds")
    .select(
      "id, amount, currency, status, reason, provider_reference, created_at, completed_at, metadata, order:orders(number), store:stores(name, slug), refund_items(quantity, amount, order_item:order_items(product_name, variant_label))",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: refunds } =
    filter === "all" ? await query : await query.eq("status", filter);

  type RefundLine = {
    quantity: number;
    amount: number;
    order_item:
      | { product_name: string; variant_label: string | null }
      | { product_name: string; variant_label: string | null }[]
      | null;
  };

  type RefundRow = {
    id: string;
    amount: number;
    currency: string;
    status: string;
    reason: string | null;
    provider_reference: string | null;
    created_at: string;
    completed_at: string | null;
    metadata: Record<string, unknown> | null;
    order: { number: number } | { number: number }[] | null;
    store:
      | { name: string; slug: string }
      | { name: string; slug: string }[]
      | null;
    refund_items: RefundLine[] | null;
  };

  const rows = (refunds ?? []) as unknown as RefundRow[];

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

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <a
            key={item.value}
            href={`/platform-admin/refunds?status=${item.value}`}
            className={`inline-flex h-8 items-center rounded-full border px-3.5 text-[0.75rem] font-medium transition-colors ${
              filter === item.value
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-border bg-surface text-body hover:border-border-strong"
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>

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
            const store = (
              Array.isArray(refund.store) ? refund.store[0] : refund.store
            ) as { name?: string; slug?: string } | null;
            const order = (
              Array.isArray(refund.order) ? refund.order[0] : refund.order
            ) as { number?: number } | null;
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
                    {(
                      refund.refund_items as
                        | {
                            quantity: number;
                            amount: number;
                            order_item:
                              | { product_name: string; variant_label: string | null }
                              | { product_name: string; variant_label: string | null }[]
                              | null;
                          }[]
                        | null
                    )?.length ? (
                      <ul className="mt-2 space-y-1">
                        {(
                          refund.refund_items as {
                            quantity: number;
                            amount: number;
                            order_item:
                              | { product_name: string; variant_label: string | null }
                              | { product_name: string; variant_label: string | null }[]
                              | null;
                          }[]
                        ).map((line, index) => {
                          const product = Array.isArray(line.order_item)
                            ? line.order_item[0]
                            : line.order_item;
                          return (
                            <li
                              key={`${refund.id}-${index}`}
                              className="flex items-start justify-between gap-3 text-[0.75rem] text-subtle"
                            >
                              <span>
                                {product?.product_name ?? "Article"}
                                {product?.variant_label
                                  ? ` · ${product.variant_label}`
                                  : ""}
                                <span className="text-faint"> × {line.quantity}</span>
                              </span>
                              <span className="shrink-0 tabular-nums">
                                {formatMoney(line.amount, refund.currency, "fr-FR")}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[0.6875rem] text-faint">
                        Remboursement total
                      </p>
                    )}
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
