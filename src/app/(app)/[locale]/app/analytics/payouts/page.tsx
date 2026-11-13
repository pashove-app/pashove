import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PayoutsReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("payouts")
    .select("amount, status, requested_at")
    .eq("store_id", store.id)
    .order("requested_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as { amount: number; status: string }[];
  const sum = (statuses: string[]) =>
    rows.filter((row) => statuses.includes(row.status)).reduce((total, row) => total + row.amount, 0);
  const completed = sum(["completed", "sent"]);
  const pending = sum(["requested", "security_check", "processing"]);
  const failed = sum(["failed", "reversed", "cancelled"]);
  const money = (amount: number) => formatMoney(amount, store.currency, "fr-FR");

  return (
    <ReportShell locale={locale} active="payouts" title="Retraits" subtitle="Ce qui est parti, ce qui attend et ce qui a échoué.">
      <ReportStats stats={[
        { label: "Versé", value: money(completed) },
        { label: "En attente", value: money(pending) },
        { label: "Échoué ou annulé", value: money(failed) },
        { label: "Demandes", value: String(rows.length) },
      ]} />
      <ReportPanel title="Lecture">
        <p className="text-[0.8125rem] leading-relaxed text-muted">
          Un retrait reste réservé jusqu’à sa confirmation par Pashove. La réserve de remboursement de 5 % n’apparaît pas ici : elle réduit le montant retirable affiché dans Finance.
        </p>
      </ReportPanel>
    </ReportShell>
  );
}
