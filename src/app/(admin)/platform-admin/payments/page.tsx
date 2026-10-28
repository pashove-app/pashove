import { AdminHero } from "@/components/platform/admin-hero";
import { RefundPaymentButton } from "@/components/platform/refund-payment-button";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { adminPaymentTransactions } from "@/lib/payments/queries";
import type { PaymentMethod } from "@/lib/payments/types";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Paiement à la livraison",
  orange_money: "Orange Money",
  wave: "Wave",
  card: "Carte bancaire",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  authorized: "Autorisé",
  captured: "Encaissé",
  failed: "Échoué",
  refunded: "Remboursé",
};

function statusTone(status: string): string {
  if (status === "captured") return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400";
  if (status === "refunded") return "bg-violet-500/12 text-violet-600 dark:text-violet-400";
  if (status === "failed") return "bg-red-500/12 text-red-600 dark:text-red-400";
  return "bg-amber-500/12 text-amber-600 dark:text-amber-400";
}

export default async function AdminPaymentsPage() {
  const transactions = await adminPaymentTransactions();

  return (
    <div>
      <AdminHero subtitle="Tous les encaissements COD et Mock, leur statut et les remboursements compensatoires.">
        <ButtonLink href="/platform-admin/payment-providers" variant="light" size="pill">
          <Icon path={icons.settings} className="h-4 w-4" strokeWidth={1.8} />
          Fournisseurs
        </ButtonLink>
      </AdminHero>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem] font-medium tracking-[-0.03em] text-fg">
            Transactions
          </h1>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            {transactions.length} transaction{transactions.length === 1 ? "" : "s"} enregistrée{transactions.length === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/[0.1] text-accent">
            <Icon path={icons.wallet} className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">Aucune transaction</p>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            Les paiements COD et Mock apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                <th className="px-5 py-3 text-start">Commande</th>
                <th className="px-4 py-3 text-start">Boutique</th>
                <th className="px-4 py-3 text-start">Moyen</th>
                <th className="px-4 py-3 text-end">Montant</th>
                <th className="px-4 py-3 text-start">Statut</th>
                <th className="px-4 py-3 text-start">Date</th>
                <th className="px-5 py-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.paymentId} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <p className="text-[0.875rem] font-medium text-fg">#{transaction.orderNumber}</p>
                    <p className="text-[0.6875rem] text-faint">{transaction.customerName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[0.8125rem] text-body">{transaction.storeName}</p>
                    <p className="font-mono text-[0.6875rem] text-faint">/{transaction.storeSlug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[0.8125rem] text-body">{METHOD_LABEL[transaction.method]}</p>
                    <p className="text-[0.6875rem] text-faint">{transaction.provider}</p>
                  </td>
                  <td className="px-4 py-3 text-end text-[0.8125rem] font-medium tabular-nums text-fg">
                    {formatMoney(transaction.amount, transaction.currency, "fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${statusTone(transaction.status)}`}>
                      {STATUS_LABEL[transaction.status] ?? transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[0.75rem] text-muted">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(transaction.createdAt))}
                  </td>
                  <td className="px-5 py-3 text-end">
                    <RefundPaymentButton
                      orderId={transaction.orderId}
                      disabled={transaction.status === "refunded" || transaction.status !== "captured"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-border md:hidden">
            {transactions.map((transaction) => (
              <li key={transaction.paymentId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.875rem] font-medium text-fg">#{transaction.orderNumber}</p>
                    <p className="mt-0.5 text-[0.75rem] text-subtle">{transaction.storeName}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-faint">
                      {METHOD_LABEL[transaction.method]} · {transaction.provider}
                    </p>
                  </div>
                  <p className="text-[0.875rem] font-medium tabular-nums text-fg">
                    {formatMoney(transaction.amount, transaction.currency, "fr-FR")}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${statusTone(transaction.status)}`}>
                    {STATUS_LABEL[transaction.status] ?? transaction.status}
                  </span>
                  <RefundPaymentButton
                    orderId={transaction.orderId}
                    disabled={transaction.status === "refunded" || transaction.status !== "captured"}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
