import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import type {
  LedgerFilter,
  LedgerMovement,
  LedgerPeriod,
} from "@/lib/finance/queries";
import { signedAmount } from "@/lib/finance/display";
import { formatMoney } from "@/lib/money";

type FinanceLabelKey = Exclude<
  keyof Dictionary["dashboard"]["finance"],
  "errors"
>;

const KIND_LABEL: Record<LedgerMovement["kind"], FinanceLabelKey> = {
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

/** Journal financier filtrable, rendu côté serveur. */
export function LedgerJournal({
  t,
  locale,
  items,
  total,
  page,
  pageSize,
  kind,
  period,
}: {
  t: Dictionary;
  locale: Locale;
  items: LedgerMovement[];
  total: number;
  page: number;
  pageSize: number;
  kind: LedgerFilter;
  period: LedgerPeriod;
}) {
  const labels = t.dashboard.finance;
  const localeTag = LOCALE_META[locale].tag;

  const currencyOf = (movement: LedgerMovement) =>
    formatMoney(Math.abs(signedAmount(movement)), movement.currency, localeTag);

  const date = (value: string) =>
    new Intl.DateTimeFormat(localeTag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  const href = (next: {
    kind?: LedgerFilter;
    period?: LedgerPeriod;
    page?: number;
  }) => {
    const nextKind = next.kind ?? kind;
    const nextPeriod = next.period ?? period;
    const nextPage = next.page ?? 1;

    const params = new URLSearchParams();
    if (nextKind !== "all") params.set("kind", nextKind);
    if (nextPeriod !== "all") params.set("period", nextPeriod);
    if (nextPage > 1) params.set("page", String(nextPage));

    const query = params.toString();
    return path(locale, `/app/finance/transactions${query ? `?${query}` : ""}`);
  };

  const filters: { key: LedgerFilter; label: string }[] = [
    { key: "all", label: labels.filterAll },
    { key: "cod_sale", label: labels.filterSales },
    { key: "commission", label: labels.filterCommissions },
    { key: "refund", label: labels.filterRefunds },
  ];

  const periods: { key: LedgerPeriod; label: string }[] = [
    { key: "7", label: labels.period7 },
    { key: "30", label: labels.period30 },
    { key: "90", label: labels.period90 },
    { key: "all", label: labels.periodAll },
  ];

  const pages = Math.max(Math.ceil(total / pageSize), 1);
  const filtered = kind !== "all" || period !== "all";

  const countLabel = (total === 1 ? labels.count : labels.countPlural).replace(
    "{count}",
    String(total),
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href={path(locale, "/app/finance")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.backToFinance}
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.journalTitle}
          </h1>
          <p className="mt-1.5 max-w-xl text-[0.875rem] leading-relaxed text-muted">
            {labels.journalSubtitle}
          </p>
        </div>
        <p className="text-[0.8125rem] tabular-nums text-subtle">{countLabel}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {filters.map((filter) => {
          const active = kind === filter.key;

          return (
            <Link
              key={filter.key}
              href={href({ kind: filter.key, page: 1 })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border text-subtle hover:border-border-strong hover:text-fg",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="me-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
          {labels.periodLabel}
        </span>

        {periods.map((option) => {
          const active = period === option.key;

          return (
            <Link
              key={option.key}
              href={href({ period: option.key, page: 1 })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[0.75rem] font-medium transition-colors",
                active
                  ? "bg-hairline text-fg"
                  : "text-faint hover:text-subtle",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-[0.9375rem] font-medium text-fg">{labels.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] leading-relaxed text-subtle">
            {labels.emptyText}
          </p>
          {filtered ? (
            <Link
              href={path(locale, "/app/finance/transactions")}
              className="mt-4 inline-block text-[0.8125rem] font-medium text-accent hover:text-accent-soft"
            >
              {labels.clearFilters}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="hidden w-full sm:table">
            <thead>
              <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                <th className="px-5 py-3 text-start font-semibold">
                  {labels.columnDate}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {labels.columnType}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {labels.columnSource}
                </th>
                <th className="px-5 py-3 text-end font-semibold">
                  {labels.columnAmount}
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((movement) => {
                const signed = signedAmount(movement);

                return (
                  <tr
                    key={movement.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-3 text-[0.8125rem] text-muted">
                      {date(movement.occurred_at)}
                    </td>
                    <td className="px-4 py-3 text-[0.8125rem] font-medium text-body">
                      {labels[KIND_LABEL[movement.kind]]}
                    </td>
                    <td className="px-4 py-3 text-[0.8125rem]">
                      <Source movement={movement} labels={labels} locale={locale} />
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-end text-[0.875rem] font-medium tabular-nums",
                        signed < 0
                          ? movement.kind === "refund"
                            ? "text-red-500 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {signed < 0 ? "−" : "+"}
                      {currencyOf(movement)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <ul className="divide-y divide-border sm:hidden">
            {items.map((movement) => {
              const signed = signedAmount(movement);

              return (
                <li key={movement.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.875rem] font-medium text-fg">
                        {labels[KIND_LABEL[movement.kind]]}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-faint">
                        {date(movement.occurred_at)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-[0.875rem] font-medium tabular-nums",
                        signed < 0 ? "text-muted" : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {signed < 0 ? "−" : "+"}
                      {currencyOf(movement)}
                    </p>
                  </div>

                  <div className="mt-1.5">
                    <Source movement={movement} labels={labels} locale={locale} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link
              href={href({ page: page - 1 })}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
            >
              <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rotate-180 rtl:rotate-0" strokeWidth={2} />
              {labels.previous}
            </Link>
          ) : (
            <span />
          )}

          <span className="text-[0.75rem] tabular-nums text-faint">
            {labels.pageOf
              .replace("{page}", String(page))
              .replace("{pages}", String(pages))}
          </span>

          {page < pages ? (
            <Link
              href={href({ page: page + 1 })}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
            >
              {labels.next}
              <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}

function Source({
  movement,
  labels,
  locale,
}: {
  movement: LedgerMovement;
  labels: Dictionary["dashboard"]["finance"];
  locale: Locale;
}) {
  if (movement.orderNumber && movement.orderId) {
    return (
      <Link
        href={path(locale, `/app/orders/${movement.orderId}`)}
        className="font-medium text-accent transition-colors hover:text-accent-soft"
      >
        {labels.sourceOrder} #{movement.orderNumber}
      </Link>
    );
  }

  return (
    <span className="text-faint">
      {movement.sourceType === "order"
        ? labels.sourceOrder
        : movement.sourceType === "manual"
          ? labels.sourceManual
          : movement.sourceType}
    </span>
  );
}
