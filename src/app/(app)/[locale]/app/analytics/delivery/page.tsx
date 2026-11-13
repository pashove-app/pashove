import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DeliveryReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("store_id", store.id)
    .gte("created_at", since);

  const counts = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const status = row.status as string;
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const shipped = counts.shipped ?? 0;
  const delivered = counts.delivered ?? 0;
  const cancelled = counts.cancelled ?? 0;
  const total = shipped + delivered + cancelled;

  return (
    <ReportShell locale={locale} active="delivery" title="Livraison" subtitle="Expéditions, livraisons et annulations sur 30 jours.">
      <ReportStats stats={[
        { label: "Expédiées", value: String(shipped) },
        { label: "Livrées", value: String(delivered) },
        { label: "Annulées", value: String(cancelled) },
        { label: "Taux d’aboutissement", value: total > 0 ? `${Math.round((delivered / total) * 100)} %` : "—" },
      ]} />
      <ReportPanel title="Mode de livraison">
        <p className="text-[0.8125rem] leading-relaxed text-muted">
          {store.delivery_mode === "pashove"
            ? "Les commandes sont prises en charge par Pashove Delivery, avec suivi et preuve de livraison."
            : "Tu assures la livraison avec tes propres moyens. Les frais fixes sont appliqués au checkout."}
        </p>
      </ReportPanel>
    </ReportShell>
  );
}
