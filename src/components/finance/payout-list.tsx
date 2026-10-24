import { CancelPayoutButton } from "@/components/finance/cancel-payout-button";
import { PayoutStatusBadge } from "@/components/finance/payout-status-badge";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { PROVIDER_LABELS, type PayoutProvider } from "@/lib/finance/providers";
import type { PayoutSummary } from "@/lib/finance/queries";
import { formatMoney } from "@/lib/money";
import { LOCALE_META } from "@/i18n/config";

export function PayoutList({
  t,
  locale,
  payouts,
}: {
  t: Dictionary;
  locale: Locale;
  payouts: PayoutSummary[];
}) {
  const labels = t.dashboard.finance;
  const localeTag = LOCALE_META[locale].tag;

  if (payouts.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
          <Icon path={icons.wallet} className="h-6 w-6" strokeWidth={1.7} />
        </span>
        <h2 className="mt-5 text-[1.0625rem] font-medium text-fg">
          {labels.payoutsEmptyTitle}
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-[0.875rem] leading-relaxed text-subtle">
          {labels.payoutsEmptyText}
        </p>
        <ButtonLink
          href={path(locale, "/app/finance/payouts/new")}
          className="mt-5"
          size="pill"
        >
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
          {labels.newPayout}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3.5">
      {payouts.map((payout) => {
        const canCancel =
          payout.status === "requested" || payout.status === "security_check";

        return (
          <section
            key={payout.id}
            className="rounded-3xl border border-border bg-surface p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
                  <Icon path={icons.wallet} className="h-5 w-5" strokeWidth={1.7} />
                </span>

                <div className="min-w-0">
                  <p className="text-[1.125rem] font-semibold tabular-nums text-fg">
                    {formatMoney(payout.amount, payout.currency, localeTag)}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] text-muted">
                    {PROVIDER_LABELS[payout.provider as PayoutProvider] ??
                      payout.provider}{" "}
                    · <span dir="ltr" className="font-mono text-[0.75rem]">•••• {payout.account_last4}</span>
                  </p>
                  <p className="mt-1 text-[0.75rem] text-faint">
                    {new Intl.DateTimeFormat(localeTag, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(payout.requested_at))}
                  </p>
                </div>
              </div>

              <PayoutStatusBadge status={payout.status} t={t} />
            </div>

            {canCancel ? (
              <div className="mt-3 flex justify-end border-t border-hairline pt-3">
                <CancelPayoutButton
                  locale={locale}
                  payoutId={payout.id}
                  labels={labels}
                />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
