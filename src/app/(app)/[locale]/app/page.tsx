import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KpiGrid } from "@/components/dashboard/home/kpi-grid";
import {
  QuickActions,
  type QuickActionAlert,
} from "@/components/dashboard/home/quick-actions";
import { RevenuePanel } from "@/components/dashboard/home/revenue-panel";
import { WelcomeBanner } from "@/components/dashboard/home/welcome-banner";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { listStoreCustomers } from "@/lib/customers/queries";
import { orderCounts } from "@/lib/orders/queries";
import { countProducts } from "@/lib/products/queries";
import { readProfile } from "@/lib/profile/queries";
import { currentStore } from "@/lib/stores/queries";
import { getDashboardAlerts } from "@/lib/dashboard/alerts";
import { getDashboardCopy } from "@/lib/dashboard/copy";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.nav.home };
}

/**
 * Accueil du dashboard.
 *
 * Le bandeau, quatre chiffres, le panneau des revenus et les raccourcis. Les
 * valeurs sont réelles : sans commandes ni produits, elles valent zéro. Le
 * graphique le dit au lieu de simuler une courbe.
 */
export default async function DashboardHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { published } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const profile = await readProfile();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getDictionary(locale);

  const firstName =
    (profile?.full_name ?? "").trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "—";

  const revenue = formatMoney(0, store.currency, LOCALE_META[locale].tag);
  const [productsCount, counts, customers, alertsData] = await Promise.all([
    countProducts(store.id),
    orderCounts(store.id, null),
    listStoreCustomers(store.id),
    getDashboardAlerts(store),
  ]);

  const copy = getDashboardCopy(locale);
  const alerts: QuickActionAlert[] = [];

  if (alertsData.ordersToShip > 0) {
    alerts.push({
      key: "orders",
      icon: "box",
      tone: "warning",
      title: copy.ordersTitle,
      text: interpolate(copy.ordersText, { count: alertsData.ordersToShip }),
      href: path(locale, "/app/orders?status=preparing"),
      cta: copy.ordersCta,
    });
  }

  if (alertsData.lowStock.length > 0) {
    const product = alertsData.lowStock[0];
    alerts.push({
      key: "stock",
      icon: "bundle",
      tone: "warning",
      title: copy.stockTitle,
      text: interpolate(copy.stockText, { name: product.name }),
      href: path(locale, "/app/products"),
      cta: copy.stockCta,
    });
  }

  if (alertsData.available > 0) {
    alerts.push({
      key: "payout",
      icon: "wallet",
      tone: "success",
      title: copy.payoutTitle,
      text: interpolate(copy.payoutText, {
        amount: formatMoney(
          alertsData.available,
          store.currency,
          LOCALE_META[locale].tag,
        ),
      }),
      href: path(locale, "/app/finance/payouts/new"),
      cta: copy.payoutCta,
    });
  }

  if (
    alertsData.planCode !== "free" &&
    alertsData.planDaysLeft !== null &&
    alertsData.planDaysLeft <= 7
  ) {
    alerts.push({
      key: "plan",
      icon: "sparkle",
      tone: "info",
      title: copy.planTitle,
      text: interpolate(copy.planText, {
        plan: alertsData.planCode.charAt(0).toUpperCase() + alertsData.planCode.slice(1),
        days: Math.max(0, alertsData.planDaysLeft),
      }),
      href: path(locale, "/app/settings/plan"),
      cta: copy.planCta,
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {published ? (
        <div
          role="status"
          className="mb-5 flex animate-rise items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4 motion-reduce:animate-none"
        >
          <Icon
            path={icons.check}
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300"
            strokeWidth={2.4}
          />
          <div>
            <p className="text-[0.875rem] font-medium text-emerald-700 dark:text-emerald-300">
              {t.onboarding.launchPublished}
            </p>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted">
              {t.onboarding.launchPublishedText}
            </p>
          </div>
        </div>
      ) : null}

      <WelcomeBanner t={t} locale={locale} firstName={firstName} />

      <div className="mt-6">
        <KpiGrid
          t={t}
          locale={locale}
          revenue={revenue}
          orders={String(counts.all)}
          customers={String(customers.length)}
          products={String(productsCount)}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <RevenuePanel t={t} amount={revenue} />
        <QuickActions
          t={t}
          locale={locale}
          sectionTitle={copy.title}
          emptyTitle={copy.emptyTitle}
          emptyText={copy.emptyText}
          shortcutsLabel={t.dashboard.home.quickActions}
          alerts={alerts}
        />
      </div>
    </div>
  );
}
