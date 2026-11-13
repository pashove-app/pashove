import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { getStoreAnalytics } from "@/lib/analytics/queries";
import { formatMoney } from "@/lib/money";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CustomersReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);
  const data = await getStoreAnalytics(store.id);
  if (!data) return null;
  const money = (amount: number) => formatMoney(amount, store.currency, "fr-FR");

  return (
    <ReportShell locale={locale} active="customers" title="Clients" subtitle="Nouveaux acheteurs et meilleurs comptes sur 30 jours.">
      <ReportStats stats={[
        { label: "Nouveaux clients", value: String(data.newCustomers) },
        { label: "Clients actifs", value: String(data.topCustomers.length) },
        { label: "Commandes", value: String(data.orders) },
        { label: "Panier moyen", value: money(data.averageOrder) },
      ]} />
      <ReportPanel title="Top clients">
        {data.topCustomers.length === 0 ? <p className="text-[0.8125rem] text-subtle">Aucun client sur la période.</p> : (
          <ul className="divide-y divide-hairline">
            {data.topCustomers.map((customer, index) => (
              <li key={`${customer.email}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] font-medium text-fg">{customer.name}</p>
                  <p className="truncate text-[0.6875rem] text-subtle">{customer.email} · {customer.orders} commande{customer.orders > 1 ? "s" : ""}</p>
                </div>
                <span className="shrink-0 text-[0.8125rem] font-medium tabular-nums text-fg">{money(customer.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </ReportPanel>
    </ReportShell>
  );
}
