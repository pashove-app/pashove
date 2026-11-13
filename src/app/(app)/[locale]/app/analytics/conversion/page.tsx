import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { getStoreAnalytics } from "@/lib/analytics/queries";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConversionReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);
  const data = await getStoreAnalytics(store.id);
  if (!data) return null;

  return (
    <ReportShell locale={locale} active="conversion" title="Conversion" subtitle="Du panier à la commande payée.">
      <ReportStats stats={[
        { label: "Paniers", value: String(data.carts) },
        { label: "Paniers convertis", value: String(data.convertedCarts) },
        { label: "Taux de conversion", value: `${data.conversionRate} %` },
        { label: "Commandes payées", value: String(data.orders) },
      ]} />
      <ReportPanel title="Lecture">
        <p className="text-[0.8125rem] leading-relaxed text-muted">
          {data.conversionRate >= 30
            ? "Le tunnel fonctionne bien. Continue à surveiller les abandons après le choix du paiement."
            : "Moins d’un panier sur trois aboutit. Vérifie les frais affichés, les délais de livraison et la disponibilité du Mobile Money."}
        </p>
      </ReportPanel>
    </ReportShell>
  );
}
