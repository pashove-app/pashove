import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStatement, monthRange } from "@/lib/finance/statements";
import { formatMoney } from "@/lib/money";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.finance.statementsTitle };
}

const KIND_LABEL: Record<string, string> = {
  cod_sale: "kindCodSale",
  commission: "kindCommission",
  online_capture: "kindOnlineCapture",
  settlement: "kindSettlement",
  refund: "kindRefund",
  payout_request: "kindPayoutRequest",
  payout_paid: "kindPayoutPaid",
  payout_released: "kindPayoutReleased",
  adjustment: "kindAdjustment",
};

export default async function StatementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale: raw } = await params;
  const { month: rawMonth } = await searchParams;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const tag = LOCALE_META[locale].tag;
  const range = monthRange(rawMonth, tag);
  const [statement, t] = await Promise.all([
    getStatement(store.id, range.from, range.to),
    getDictionary(locale),
  ]);

  const labels = t.dashboard.finance;
  const money = (amount: number) => formatMoney(Math.abs(amount), store.currency, tag);

  const date = (value: string) =>
    new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(new Date(value));

  const cards = [
    { label: labels.statementSales, value: money(statement.sales), tone: "text-fg" },
    { label: labels.statementCommissions, value: money(statement.commissions), tone: "text-amber-600 dark:text-amber-400" },
    { label: labels.statementPayouts, value: money(statement.payouts), tone: "text-fg" },
    { label: labels.statementAvailable, value: money(statement.balances.available), tone: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BackLink href={path(locale, "/app/finance")} label={labels.backToFinance} />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.statementsTitle}
          </h1>
          <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
            {labels.statementsSubtitle}
          </p>
        </div>

        <ButtonLink
          href={path(locale, `/app/finance/statements/export?month=${range.month}`)}
          size="pill"
        >
          <Icon path={icons.download} className="h-4 w-4" strokeWidth={2} />
          {labels.statementDownload}
        </ButtonLink>
      </div>

      <form
        method="get"
        action={path(locale, "/app/finance/statements")}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-3xl border border-border bg-surface p-4 sm:p-5"
      >
        <label className="text-[0.75rem] font-medium text-body">
          {labels.statementPeriod}
          <input
            type="month"
            name="month"
            defaultValue={range.month}
            className="mt-1.5 block h-10 rounded-full border border-border bg-surface px-4 text-[0.8125rem] text-fg focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg"
        >
          {labels.statementGenerate}
        </button>
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <section key={card.label} className="rounded-3xl border border-border bg-surface p-5">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
              {card.label}
            </p>
            <p className={`mt-2 truncate text-[1.25rem] font-semibold tabular-nums ${card.tone}`}>
              {card.value}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-4 rounded-3xl border border-border bg-surface p-5">
        <p className="text-[0.75rem] leading-relaxed text-subtle">
          {labels.statementNote}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[0.75rem] text-subtle">
          <span>
            {labels.statementPending} : {money(statement.balances.pending)}
          </span>
          <span>
            {labels.statementReserved} : {money(statement.balances.reserved)}
          </span>
          <span>
            {labels.statementCommissionDue} : {money(statement.balances.commissionDue)}
          </span>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.statementMovements}
          </h2>
          <span className="text-[0.75rem] text-faint">{range.label}</span>
        </div>

        {statement.rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[0.9375rem] font-medium text-fg">
              {labels.statementEmpty}
            </p>
            <p className="mt-1 text-[0.8125rem] text-subtle">
              {labels.statementEmptyHint}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                <th className="px-5 py-2.5 text-start">{labels.columnDate}</th>
                <th className="px-3 py-2.5 text-start">{labels.columnType}</th>
                <th className="px-3 py-2.5 text-start">{labels.columnReference}</th>
                <th className="px-5 py-2.5 text-end">{labels.columnAmount}</th>
              </tr>
            </thead>
            <tbody>
              {statement.rows.map((row) => (
                <tr key={row.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-3 text-[0.8125rem] text-muted">
                    {date(row.occurred_at)}
                  </td>
                  <td className="px-3 py-3 text-[0.8125rem] text-body">
                    {labels[
                      KIND_LABEL[row.kind] as Exclude<
                        keyof typeof labels,
                        "errors"
                      >
                    ] ?? row.kind}
                  </td>
                  <td className="px-3 py-3 text-[0.8125rem] text-subtle">
                    {row.orderNumber ? `#${row.orderNumber}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-end text-[0.8125rem] font-medium tabular-nums text-fg">
                    {row.signed < 0 ? "−" : "+"}
                    {money(row.signed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
