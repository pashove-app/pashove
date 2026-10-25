import Link from "next/link";
import { AdminStatusBadge } from "@/components/platform/admin-status-badge";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { listAdminPayouts } from "@/lib/platform/queries";
import { formatMoney } from "@/lib/money";

export default async function AdminPayoutsPage() {
  const payouts = await listAdminPayouts();
  const pending = payouts.filter((item) =>
    ["requested", "security_check"].includes(item.status),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-fg sm:text-[2rem]">
            Retraits
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted">
            {pending.length} demande{pending.length === 1 ? "" : "s"} en attente.
          </p>
        </div>
        <ButtonLink href="/platform-admin" variant="outline" size="pill">
          Vue d’ensemble
        </ButtonLink>
      </div>

      {payouts.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
            <Icon path={icons.wallet} className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            Aucune demande de retrait
          </p>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            Les demandes des marchands apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="mt-7 overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                <th className="px-5 py-3 text-start">Marchand</th>
                <th className="px-4 py-3 text-end">Montant</th>
                <th className="px-4 py-3 text-start">Destination</th>
                <th className="px-4 py-3 text-start">Demandé</th>
                <th className="px-4 py-3 text-start">Statut</th>
                <th className="px-5 py-3 text-end">Dossier</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <p className="text-[0.875rem] font-medium text-fg">
                      {payout.store?.name ?? "Boutique"}
                    </p>
                    <p className="font-mono text-[0.75rem] text-faint">
                      /{payout.store?.slug ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-end text-[0.875rem] font-medium tabular-nums text-fg">
                    {formatMoney(payout.amount, payout.currency, "fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-[0.8125rem] text-body">
                    {payout.provider} · •••• {payout.account_last4}
                  </td>
                  <td className="px-4 py-3 text-[0.8125rem] text-muted">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                      new Date(payout.requested_at),
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={payout.status} kind="payout" />
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Link
                      href={`/platform-admin/payouts/${payout.id}`}
                      className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-brand-500 hover:text-accent"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-border md:hidden">
            {payouts.map((payout) => (
              <li key={payout.id}>
                <Link href={`/platform-admin/payouts/${payout.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.875rem] font-medium text-fg">
                        {payout.store?.name ?? "Boutique"}
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] font-medium tabular-nums text-body">
                        {formatMoney(payout.amount, payout.currency, "fr-FR")}
                      </p>
                      <p className="mt-1 text-[0.6875rem] text-faint">
                        {payout.provider} · •••• {payout.account_last4}
                      </p>
                    </div>
                    <AdminStatusBadge status={payout.status} kind="payout" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
