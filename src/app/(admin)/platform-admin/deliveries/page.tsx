import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { resolveDeliveryDisputeAction } from "@/lib/delivery/admin-actions";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Pashove · Livraisons",
  robots: { index: false, follow: false },
};

type DeliveryRow = {
  id: string;
  status: string;
  feeAmount: number;
  currency: string;
  failureReason: string | null;
  createdAt: string;
  orderNumber: number;
  productAmount: number;
  shippingAmount: number;
  storeName: string;
  courierName: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  searching: "Recherche",
  assigned: "Proposée",
  accepted: "Acceptée",
  delivered: "Livrée",
  disputed: "Litige",
  failed: "Échouée",
  cancelled: "Annulée",
};

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_deliveries");
  const rows = (Array.isArray(data) ? data : []) as DeliveryRow[];

  const disputed = rows.filter((row) => row.status === "disputed").length;
  const delivered = rows.filter((row) => row.status === "delivered").length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        Livraisons
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Courses Pashove Delivery, séquestre et litiges.
      </p>

      {ok ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          Litige résolu : {ok}.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          Résolution impossible.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-[0.8125rem]">
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-subtle">
          {rows.length} course(s)
        </span>
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-subtle">
          {delivered} livrée(s)
        </span>
        <span className="rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-3 py-1.5 text-amber-700 dark:text-amber-300">
          {disputed} litige(s)
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-8 text-center text-[0.875rem] text-subtle">
          Aucune course pour le moment.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-3xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[0.9375rem] font-medium text-fg">
                    Commande #{row.orderNumber} · {row.storeName}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] text-subtle">
                    Livreur : {row.courierName ?? "non assigné"} ·{" "}
                    {formatMoney(row.feeAmount, row.currency, "fr-FR")}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-faint">
                    Créée le{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(row.createdAt))}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${
                    row.status === "delivered"
                      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                      : row.status === "disputed" || row.status === "failed"
                        ? "bg-red-500/12 text-red-600 dark:text-red-400"
                        : "bg-amber-400/15 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </div>

              {row.failureReason ? (
                <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2 text-[0.75rem] text-amber-700 dark:text-amber-300">
                  Motif : {row.failureReason}
                </p>
              ) : null}

              {row.status === "disputed" ? (
                <div className="mt-4 border-t border-hairline pt-4">
                  <div className="flex flex-wrap gap-2">
                    <form action={resolveDeliveryDisputeAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="action" value="release" />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-full bg-emerald-600 px-4 text-[0.75rem] font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        Libérer l’argent
                      </button>
                    </form>
                    <form action={resolveDeliveryDisputeAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="action" value="refund" />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-full bg-red-600 px-4 text-[0.75rem] font-semibold text-white transition-colors hover:bg-red-700"
                      >
                        Rembourser le client ·{" "}
                        {formatMoney(row.productAmount, row.currency, "fr-FR")}
                      </button>
                    </form>
                    <form action={resolveDeliveryDisputeAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="action" value="cancel" />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
                      >
                        Annuler la course
                      </button>
                    </form>
                  </div>
                  <p className="mt-2 text-[0.6875rem] leading-relaxed text-subtle">
                    Remboursement produit uniquement : les frais de livraison et
                    les frais SasPay ne sont pas remboursables. Le remboursement
                    réel au client reste à effectuer depuis SasPay.
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
