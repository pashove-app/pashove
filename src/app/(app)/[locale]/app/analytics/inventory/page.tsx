import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { listInventoryProducts } from "@/lib/inventory/queries";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function InventoryReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const products = await listInventoryProducts(store.id);
  const units = products.reduce((total, product) => total + product.stock, 0);
  const low = products.filter((product) => product.low).length;
  const out = products.filter((product) => product.out).length;

  return (
    <ReportShell locale={locale} active="inventory" title="Stock" subtitle="Niveaux, seuils et ruptures.">
      <ReportStats stats={[
        { label: "Produits physiques", value: String(products.length) },
        { label: "Unités en stock", value: String(units) },
        { label: "Stocks faibles", value: String(low) },
        { label: "Ruptures", value: String(out) },
      ]} />
      <ReportPanel title="Produits à surveiller">
        {products.filter((product) => product.low || product.out).length === 0 ? (
          <p className="text-[0.8125rem] text-subtle">Aucun stock sous le seuil.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {products.filter((product) => product.low || product.out).map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-[0.8125rem] text-fg">{product.name}</span>
                <span className={`shrink-0 text-[0.75rem] font-medium tabular-nums ${product.out ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {product.stock} / seuil {product.threshold}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/${locale}/app/inventory`} className="mt-3 inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-[0.75rem] font-medium text-body hover:border-border-strong">
          Gérer l’inventaire
        </Link>
      </ReportPanel>
    </ReportShell>
  );
}
