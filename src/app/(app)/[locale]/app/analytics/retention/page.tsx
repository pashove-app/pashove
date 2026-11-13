import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function RetentionReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const supabase = await createClient();
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("customer_email, total_amount, payment_status")
    .eq("store_id", store.id)
    .gte("created_at", since)
    .eq("payment_status", "paid");

  const rows = (data ?? []) as { customer_email: string; total_amount: number }[];
  const byCustomer = new Map<string, { orders: number; revenue: number }>();
  for (const row of rows) {
    const key = (row.customer_email ?? "").toLowerCase();
    const current = byCustomer.get(key) ?? { orders: 0, revenue: 0 };
    byCustomer.set(key, { orders: current.orders + 1, revenue: current.revenue + row.total_amount });
  }
  const repeat = [...byCustomer.values()].filter((entry) => entry.orders > 1);
  const revenue = repeat.reduce((total, entry) => total + entry.revenue, 0);
  const money = (amount: number) => formatMoney(amount, store.currency, "fr-FR");

  return (
    <ReportShell locale={locale} active="retention" title="Fidélité" subtitle="Clients revenus au moins deux fois sur 90 jours.">
      <ReportStats stats={[
        { label: "Clients fidèles", value: String(repeat.length) },
        { label: "Clients uniques", value: String(byCustomer.size) },
        { label: "Taux de retour", value: byCustomer.size > 0 ? `${Math.round((repeat.length / byCustomer.size) * 100)} %` : "0 %" },
        { label: "CA fidèles", value: money(revenue) },
      ]} />
      <ReportPanel title="Lecture">
        <p className="text-[0.8125rem] leading-relaxed text-muted">
          {repeat.length === 0
            ? "Aucun client n’a encore repassé commande. Une relance e-mail après livraison peut enclencher le second achat."
            : "Les clients fidèles sont ton meilleur canal. Cible-les en priorité dans Marketing."}
        </p>
      </ReportPanel>
    </ReportShell>
  );
}
