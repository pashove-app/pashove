import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getStoreBalances,
  getStoreReserve,
  listRecentLedger,
} from "@/lib/finance/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.finance.title };
}

/** Vue d'ensemble du journal financier. */
export default async function FinancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [balances, reserve, movements, t] = await Promise.all([
    getStoreBalances(store.id),
    getStoreReserve(store.id),
    listRecentLedger(store.id),
    getDictionary(locale),
  ]);

  return (
    <FinanceOverview
      t={t}
      locale={locale}
      currency={store.currency}
      balances={balances}
      reserve={reserve}
      movements={movements}
    />
  );
}
