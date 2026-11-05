import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons } from "@/components/ui/primitives";
import { resolveLocale } from "@/i18n/config";
import { getStoreAnalytics } from "@/lib/analytics/queries";
import { formatMoney } from "@/lib/money";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const data = await getStoreAnalytics(store.id);
  if (!data) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8">
        <p className="text-[0.9375rem] font-medium text-fg">
          Analyses indisponibles
        </p>
        <p className="mt-2 text-[0.8125rem] text-subtle">
          Réessaie dans un instant.
        </p>
      </div>
    );
  }

  const max = Math.max(...data.series.map((point) => point.amount), 1);
  const money = (amount: number) =>
    formatMoney(amount, store.currency, "fr-FR");

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
            Pilotage
          </p>
          <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.125rem]">
            Analyses
          </h1>
          <p className="mt-1.5 max-w-xl text-[0.875rem] leading-relaxed text-subtle">
            Tes ventes, tes clients et ta conversion sur les 30 derniers jours.
          </p>
        </div>
        <Link
          href={`/${locale}/app/orders`}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[0.8125rem] font-medium text-body hover:border-border-strong"
        >
          <Icon path={icons.box} className="h-4 w-4" strokeWidth={1.8} />
          Voir les commandes
        </Link>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Chiffre d'affaires" value={money(data.revenue)} hint="30 jours" />
        <Stat label="Commandes payées" value={String(data.orders)} hint={`Panier moyen ${money(data.averageOrder)}`} />
        <Stat
          label="Conversion"
          value={`${data.conversionRate} %`}
          hint={`${data.convertedCarts} paniers convertis sur ${data.carts}`}
        />
        <Stat label="Nouveaux clients" value={String(data.newCustomers)} hint="Première commande sur 30 jours" />
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Ventes sur 30 jours
            </h2>
            <p className="mt-1 text-[0.75rem] text-subtle">
              Commandes payées par jour.
            </p>
          </div>
          <p className="text-[1.25rem] font-medium tabular-nums text-fg">
            {money(data.revenue)}
          </p>
        </div>
        <div className="mt-6 flex h-40 items-end gap-1">
          {data.series.map((point) => (
            <div key={point.date} className="group relative flex-1" title={`${point.date} · ${money(point.amount)}`}>
              <div
                className="w-full rounded-t bg-brand-500/35 transition-colors group-hover:bg-brand-500"
                style={{ height: `${Math.max(2, (point.amount / max) * 150)}px` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[0.625rem] text-faint">
          <span>{shortDate(data.series[0]?.date)}</span>
          <span>{shortDate(data.series[data.series.length - 1]?.date)}</span>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            Top produits
          </h2>
          <div className="mt-4 divide-y divide-hairline">
            {data.topProducts.length === 0 ? (
              <p className="text-[0.8125rem] text-subtle">
                Aucune vente sur la période.
              </p>
            ) : (
              data.topProducts.map((product, index) => (
                <div key={`${product.name}-${index}`} className="flex items-center gap-3 py-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-hairline text-[0.625rem] font-semibold text-subtle">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-fg">
                      {product.name}
                    </p>
                    <p className="text-[0.6875rem] text-subtle">
                      {product.quantity} unité{product.quantity > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-[0.8125rem] font-medium tabular-nums text-fg">
                    {money(product.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            Top clients
          </h2>
          <div className="mt-4 divide-y divide-hairline">
            {data.topCustomers.length === 0 ? (
              <p className="text-[0.8125rem] text-subtle">
                Aucun client sur la période.
              </p>
            ) : (
              data.topCustomers.map((customer, index) => (
                <div key={`${customer.email}-${index}`} className="flex items-center gap-3 py-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-hairline text-[0.625rem] font-semibold text-subtle">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-fg">
                      {customer.name}
                    </p>
                    <p className="truncate text-[0.6875rem] text-subtle">
                      {customer.email} · {customer.orders} commande
                      {customer.orders > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-[0.8125rem] font-medium tabular-nums text-fg">
                    {money(customer.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-[0.6875rem] text-subtle">{label}</p>
      <p className="mt-1.5 truncate text-[1.375rem] font-semibold tabular-nums tracking-[-0.03em] text-fg">
        {value}
      </p>
      <p className="mt-1 text-[0.625rem] text-faint">{hint}</p>
    </div>
  );
}

function shortDate(value?: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}
