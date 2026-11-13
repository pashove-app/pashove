import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { getStoreAnalytics } from "@/lib/analytics/queries";
import { listInventoryProducts } from "@/lib/inventory/queries";
import { formatMoney } from "@/lib/money";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProductsReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);
  const [data, inventory] = await Promise.all([getStoreAnalytics(store.id), listInventoryProducts(store.id)]);
  if (!data) return null;
  const money = (amount: number) => formatMoney(amount, store.currency, "fr-FR");
  const units = data.topProducts.reduce((total, product) => total + product.quantity, 0);

  return (
    <ReportShell locale={locale} active="products" title="Produits" subtitle="Ce qui se vend, ce qui dort et ce qui manque.">
      <ReportStats stats={[
        { label: "Unités vendues", value: String(units) },
        { label: "Produits vendus", value: String(data.topProducts.length) },
        { label: "Produits physiques", value: String(inventory.length) },
        { label: "Alertes stock", value: String(inventory.filter((item) => item.low || item.out).length) },
      ]} />
      <ReportPanel title="Top produits">
        {data.topProducts.length === 0 ? <p className="text-[0.8125rem] text-subtle">Aucune vente sur la période.</p> : (
          <ul className="divide-y divide-hairline">
            {data.topProducts.map((product, index) => (
              <li key={`${product.name}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-[0.8125rem] text-fg">{index + 1}. {product.name}</span>
                <span className="shrink-0 text-[0.75rem] text-subtle">{product.quantity} × · <span className="font-medium tabular-nums text-fg">{money(product.revenue)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </ReportPanel>
    </ReportShell>
  );
}
