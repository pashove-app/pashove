import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LedgerJournal } from "@/components/finance/ledger-journal";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  ledgerSince,
  listLedgerTransactions,
  type LedgerFilter,
  type LedgerPeriod,
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

  return { title: t.dashboard.finance.journalTitle };
}

const FILTERS: LedgerFilter[] = ["all", "cod_sale", "commission", "refund"];
const PERIODS: LedgerPeriod[] = ["7", "30", "90", "all"];
const PAGE_SIZE = 20;

/** Journal financier, filtrable par type et période. */
export default async function FinanceTransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string; period?: string; page?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const { kind: rawKind, period: rawPeriod, page: rawPage } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const kind = FILTERS.includes(rawKind as LedgerFilter)
    ? (rawKind as LedgerFilter)
    : "all";
  const period = PERIODS.includes(rawPeriod as LedgerPeriod)
    ? (rawPeriod as LedgerPeriod)
    : "all";
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [{ items, total }, t] = await Promise.all([
    listLedgerTransactions(store.id, {
      kind,
      since: ledgerSince(period),
      page,
      pageSize: PAGE_SIZE,
    }),
    getDictionary(locale),
  ]);

  return (
    <LedgerJournal
      t={t}
      locale={locale}
      items={items}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      kind={kind}
      period={period}
    />
  );
}
