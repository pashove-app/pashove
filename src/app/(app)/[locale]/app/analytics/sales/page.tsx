import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { getStoreAnalytics } from "@/lib/analytics/queries";
import { formatMoney } from "@/lib/money";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SalesReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);
  const data = await getStoreAnalytics(store.id);
  if (!data) return null;
  const money = (amount: number) => formatMoney(amount, store.currency, "fr-FR");
  const max = Math.max(...data.series.map((point) => point.amount), 1);
  const best = [...data.series].sort((a, b) => b.amount - a.amount)[0];

  return (
    <ReportShell locale={locale} active="sales" title="Ventes" subtitle="Chiffre d’affaires et rythme des commandes sur 30 jours.">
      <ReportStats stats={[
        { label: "Chiffre d’affaires", value: money(data.revenue), hint: "30 jours" },
        { label: "Commandes payées", value: String(data.orders) },
        { label: "Panier moyen", value: money(data.averageOrder) },
        { label: "Meilleur jour", value: best ? money(best.amount) : "—", hint: best?.date },
      ]} />
      <ReportPanel title="Ventes par jour">
        <div className="flex h-40 items-end gap-1">
          {data.series.map((point) => (
            <div key={point.date} className="flex-1" title={`${point.date} · ${money(point.amount)}`}>
              <div className="w-full rounded-t bg-brand-500/35 hover:bg-brand-500" style={{ height: `${Math.max(2, (point.amount / max) * 150)}px` }} />
            </div>
          ))}
        </div>
      </ReportPanel>
    </ReportShell>
  );
}
