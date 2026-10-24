import Link from "next/link";
import { FinanceHero } from "@/components/finance/finance-hero";
import { ButtonLink, Icon, icons, type IconKey } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { LedgerKind, LedgerMovement, StoreBalances } from "@/lib/finance/queries";
import { signedAmount } from "@/lib/finance/display";
import { formatMoney } from "@/lib/money";

type FinanceLabelKey = Exclude<
  keyof Dictionary["dashboard"]["finance"],
  "errors"
>;

const KIND_LABEL: Record<LedgerKind, FinanceLabelKey> = {
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

/** Vue d'ensemble du journal financier. */
export function FinanceOverview({
  t,
  locale,
  currency,
  balances,
  movements,
}: {
  t: Dictionary;
  locale: Locale;
  currency: string;
  balances: StoreBalances;
  movements: LedgerMovement[];
}) {
  const labels = t.dashboard.finance;
  const localeTag = LOCALE_META[locale].tag;

  const money = (amount: number) => formatMoney(amount, currency, localeTag);

  const date = (value: string) =>
    new Intl.DateTimeFormat(localeTag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  const cards: {
    label: string;
    help: string;
    amount: number;
    icon: IconKey;
    tone: "brand" | "neutral" | "cash" | "debt";
  }[] = [
    {
      label: labels.availableLabel,
      help: labels.availableHelp,
      amount: balances.available,
      icon: "wallet",
      tone: "brand",
    },
    {
      label: labels.pendingLabel,
      help: labels.pendingHelp,
      amount: balances.pending,
      icon: "calendar",
      tone: "neutral",
    },
    {
      label: labels.codLabel,
      help: labels.codHelp,
      amount: balances.codCash,
      icon: "bag",
      tone: "cash",
    },
    {
      label: labels.commissionLabel,
      help: labels.commissionHelp,
      amount: balances.commissionDue,
      icon: "percent",
      tone: "debt",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <FinanceHero t={t} locale={locale} />

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <section
            key={card.label}
            className="rounded-3xl border border-border bg-surface p-5 transition-colors hover:border-border-strong sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                {card.label}
              </p>
              <span
                className={
                  card.tone === "brand"
                    ? "text-accent"
                    : card.tone === "cash"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : card.tone === "debt"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-faint"
                }
              >
                <Icon path={icons[card.icon]} className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </div>

            <p className="mt-2.5 truncate text-[1.5rem] font-semibold tabular-nums tracking-[-0.03em] text-fg sm:text-[1.75rem]">
              {money(card.amount)}
            </p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-subtle">
              {card.help}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-5 flex items-start gap-3.5 rounded-3xl border border-brand-500/20 bg-brand-500/[0.06] p-5 sm:p-6">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
          <Icon path={icons.lock} className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-[0.875rem] font-medium text-fg">{labels.noticeTitle}</h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
            {labels.noticeText}
          </p>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 sm:px-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.movementsTitle}
          </h2>
          <ButtonLink
            href={path(locale, "/app/finance/transactions")}
            variant="outline"
            size="sm"
          >
            <Icon path={icons.list} className="h-3.5 w-3.5" strokeWidth={2} />
            {labels.viewJournal}
          </ButtonLink>
        </div>

        {movements.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[0.9375rem] font-medium text-fg">
              {labels.movementsEmpty}
            </p>
            <p className="mt-1 text-[0.8125rem] text-subtle">
              {labels.movementsEmptyHint}
            </p>
          </div>
        ) : (
          <>
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="border-b border-hairline text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                  <th className="px-5 py-2.5 text-start font-semibold">
                    {labels.columnDate}
                  </th>
                  <th className="px-3 py-2.5 text-start font-semibold">
                    {labels.columnType}
                  </th>
                  <th className="px-3 py-2.5 text-start font-semibold">
                    {labels.columnReference}
                  </th>
                  <th className="px-5 py-2.5 text-end font-semibold">
                    {labels.columnAmount}
                  </th>
                </tr>
              </thead>

              <tbody>
                {movements.map((movement) => {
                  const signed = signedAmount(movement);

                  return (
                    <tr
                      key={movement.id}
                      className="border-b border-hairline transition-colors last:border-0 hover:bg-hairline/30"
                    >
                      <td className="px-5 py-3 text-[0.8125rem] text-muted">
                        {date(movement.occurred_at)}
                      </td>
                      <td className="px-3 py-3 text-[0.8125rem] font-medium text-body">
                        {labels[KIND_LABEL[movement.kind]]}
                      </td>
                      <td className="px-3 py-3 text-[0.8125rem]">
                        {movement.orderNumber && movement.orderId ? (
                          <Link
                            href={path(locale, `/app/orders/${movement.orderId}`)}
                            className="font-medium text-accent transition-colors hover:text-accent-soft"
                          >
                            #{movement.orderNumber}
                          </Link>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td
                        className={
                          signed < 0
                            ? "px-5 py-3 text-end text-[0.875rem] font-medium tabular-nums text-amber-600 dark:text-amber-400"
                            : "px-5 py-3 text-end text-[0.875rem] font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {signed < 0 ? "−" : "+"}
                        {money(Math.abs(signed))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul className="divide-y divide-hairline sm:hidden">
              {movements.map((movement) => {
                const signed = signedAmount(movement);

                return (
                  <li key={movement.id} className="p-5">
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
                        className={
                          signed < 0
                            ? "text-[0.875rem] font-medium tabular-nums text-amber-600 dark:text-amber-400"
                            : "text-[0.875rem] font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {signed < 0 ? "−" : "+"}
                        {money(Math.abs(signed))}
                      </p>
                    </div>

                    {movement.orderNumber && movement.orderId ? (
                      <Link
                        href={path(locale, `/app/orders/${movement.orderId}`)}
                        className="mt-1.5 inline-block text-[0.75rem] font-medium text-accent"
                      >
                        #{movement.orderNumber}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
