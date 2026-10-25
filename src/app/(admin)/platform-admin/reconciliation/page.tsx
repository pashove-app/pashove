import { BackLink } from "@/components/ui/back-link";
import { Icon, icons } from "@/components/ui/primitives";
import { getReconciliation } from "@/lib/platform/queries";
import { formatMoney } from "@/lib/money";

export default async function ReconciliationPage() {
  const rows = await getReconciliation();
  const currencies = [...new Set(rows.map((row) => row.currency))];

  return (
    <div>
      <BackLink href="/platform-admin" label="Retour à l'administration" />

      <div className="mt-5">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-fg sm:text-[2rem]">
          Réconciliation
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          Vue théorique construite à partir du ledger : fonds marchands non
          retirés, montants réservés et commissions restant à régler. Aucun
          relevé PSP n’est encore branché.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
            <Icon path={icons.chart} className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            Aucun mouvement financier
          </p>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            La réconciliation apparaîtra dès les premières ventes.
          </p>
        </div>
      ) : (
        <>
          {currencies.map((currency) => {
            const group = rows.filter((row) => row.currency === currency);
            const available = group.reduce((sum, row) => sum + row.available, 0);
            const reserved = group.reduce((sum, row) => sum + row.reserved, 0);
            const due = group.reduce((sum, row) => sum + row.commission_due, 0);
            const theoretical = available + reserved + due;

            return (
              <section key={currency} className="mt-7">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[1.0625rem] font-medium text-fg">
                    Devise {currency}
                  </h2>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Fonds disponibles", available],
                    ["Fonds réservés", reserved],
                    ["Commissions dues", due],
                    ["Théorique plateforme", theoretical],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      className="rounded-3xl border border-border bg-surface p-5"
                    >
                      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                        {label as string}
                      </p>
                      <p className="mt-2 text-[1.25rem] font-semibold tabular-nums text-fg">
                        {formatMoney(value as number, currency, "fr-FR")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                        <th className="px-5 py-3 text-start">Marchand</th>
                        <th className="px-3 py-3 text-end">Disponible</th>
                        <th className="px-3 py-3 text-end">Réservé</th>
                        <th className="px-3 py-3 text-end">Commission due</th>
                        <th className="px-3 py-3 text-end">Théorique</th>
                        <th className="px-5 py-3 text-end">Retraits payés</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((row) => (
                        <tr
                          key={row.store_id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-5 py-3">
                            <p className="text-[0.875rem] font-medium text-fg">
                              {row.store_name}
                            </p>
                            <p className="font-mono text-[0.75rem] text-faint">
                              /{row.store_slug}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-end text-[0.8125rem] tabular-nums text-body">
                            {formatMoney(row.available, currency, "fr-FR")}
                          </td>
                          <td className="px-3 py-3 text-end text-[0.8125rem] tabular-nums text-body">
                            {formatMoney(row.reserved, currency, "fr-FR")}
                          </td>
                          <td className="px-3 py-3 text-end text-[0.8125rem] tabular-nums text-amber-600 dark:text-amber-400">
                            {formatMoney(row.commission_due, currency, "fr-FR")}
                          </td>
                          <td className="px-3 py-3 text-end text-[0.8125rem] font-medium tabular-nums text-fg">
                            {formatMoney(
                              row.available + row.reserved + row.commission_due,
                              currency,
                              "fr-FR",
                            )}
                          </td>
                          <td className="px-5 py-3 text-end text-[0.8125rem] tabular-nums text-muted">
                            {formatMoney(row.payouts, currency, "fr-FR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 text-[0.6875rem] text-faint">
                  Contrôle ledger uniquement — la réconciliation PSP
                  (Flutterwave) sera ajoutée avec les paiements en ligne.
                </p>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
