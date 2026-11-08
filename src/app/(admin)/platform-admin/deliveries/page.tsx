import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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

export default async function AdminDeliveriesPage() {
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
