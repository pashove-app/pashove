import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import type { OrderCounts, OrderStatusFilter } from "@/lib/orders/queries";

/** Recherche, onglets de statut et période, pilotés par l'URL. */
export function OrderFilters({
  t,
  locale,
  q,
  status,
  period,
  counts,
}: {
  t: Dictionary;
  locale: Locale;
  q: string;
  status: OrderStatusFilter;
  period: string;
  counts: OrderCounts;
}) {
  const labels = t.dashboard.orders;

  const href = (next: {
    q?: string;
    status?: OrderStatusFilter;
    period?: string;
  }) => {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextStatus = next.status ?? status;
    const nextPeriod = next.period ?? period;

    if (nextQ) params.set("q", nextQ);
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextPeriod !== "30") params.set("period", nextPeriod);

    const query = params.toString();
    return path(locale, `/app/orders${query ? `?${query}` : ""}`);
  };

  const tabs: { key: OrderStatusFilter; label: string; count: number }[] = [
    { key: "all", label: labels.tabAll, count: counts.all },
    { key: "pending", label: labels.tabPending, count: counts.pending },
    { key: "preparing", label: labels.tabPreparing, count: counts.preparing },
    { key: "shipped", label: labels.tabShipped, count: counts.shipped },
    { key: "delivered", label: labels.tabDelivered, count: counts.delivered },
    { key: "cancelled", label: labels.tabCancelled, count: counts.cancelled },
  ];

  const periods = [
    { key: "7", label: labels.period7 },
    { key: "30", label: labels.period30 },
    { key: "90", label: labels.period90 },
    { key: "all", label: labels.periodAll },
  ];

  return (
    <div className="mt-6">
      <form action={path(locale, "/app/orders")} className="relative max-w-md">
        {status !== "all" ? (
          <input type="hidden" name="status" value={status} />
        ) : null}
        {period !== "30" ? (
          <input type="hidden" name="period" value={period} />
        ) : null}

        <Icon
          path={icons.search}
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          strokeWidth={2}
        />

        <input
          name="q"
          defaultValue={q}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchLabel}
          maxLength={80}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-border bg-surface ps-10 pe-10 text-[0.875rem] text-fg placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
        />

        {q ? (
          <Link
            href={href({ q: "" })}
            aria-label={labels.clearFilters}
            className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:bg-hairline hover:text-fg"
          >
            <Icon path={icons.close} className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        ) : null}

        <button type="submit" className="sr-only">
          {labels.searchLabel}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const active = status === tab.key;

          return (
            <Link
              key={tab.key}
              href={href({ status: tab.key })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border text-subtle hover:border-border-strong hover:text-fg",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[0.6875rem] tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-hairline text-faint",
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="me-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
          {labels.periodLabel}
        </span>

        {periods.map((entry) => {
          const active = period === entry.key;

          return (
            <Link
              key={entry.key}
              href={href({ period: entry.key })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors",
                active
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-transparent text-subtle hover:text-fg",
              )}
            >
              {entry.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
