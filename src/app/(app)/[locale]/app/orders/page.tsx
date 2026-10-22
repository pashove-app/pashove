import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderList } from "@/components/orders/order-list";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  listOrders,
  orderCounts,
  sinceForPeriod,
  type OrderStatusFilter,
} from "@/lib/orders/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.orders.title };
}

const STATUSES: OrderStatusFilter[] = [
  "all",
  "pending",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

const PERIODS = ["7", "30", "90", "all"] as const;
const PER_PAGE = 20;

/** Liste des commandes de la boutique. */
export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    period?: string;
    page?: string;
  }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const {
    q: rawQuery,
    status: rawStatus,
    period: rawPeriod,
    page: rawPage,
  } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const q = typeof rawQuery === "string" ? rawQuery.slice(0, 80) : "";
  const status = STATUSES.includes(rawStatus as OrderStatusFilter)
    ? (rawStatus as OrderStatusFilter)
    : "all";
  const period = (PERIODS as readonly string[]).includes(rawPeriod ?? "")
    ? (rawPeriod as string)
    : "30";
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  const since = sinceForPeriod(period);

  const [{ orders, total }, counts] = await Promise.all([
    listOrders(store.id, { status, query: q, since, page, perPage: PER_PAGE }),
    orderCounts(store.id, since),
  ]);

  const t = await getDictionary(locale);
  const labels = t.dashboard.orders;
  const countLabel = (total === 1 ? labels.count : labels.countPlural).replace(
    "{count}",
    String(total),
  );
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const filtered = Boolean(q || status !== "all" || period !== "30");

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    if (period !== "30") params.set("period", period);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return path(locale, `/app/orders${query ? `?${query}` : ""}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div>
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.title}
        </h1>
        <p className="mt-1 text-[0.875rem] text-muted">{countLabel}</p>
      </div>

      <OrderFilters
        t={t}
        locale={locale}
        q={q}
        status={status}
        period={period}
        counts={counts}
      />

      {orders.length === 0 ? (
        filtered ? (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-[0.9375rem] font-medium text-fg">{labels.noResults}</p>
            <p className="mt-1 text-[0.8125rem] text-subtle">{labels.noResultsHint}</p>
            <ButtonLink
              href={path(locale, "/app/orders")}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              {labels.clearFilters}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-hairline text-faint">
              <Icon path={icons.box} className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <p className="mt-4 text-[0.9375rem] font-medium text-fg">
              {labels.emptyTitle}
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
              {labels.emptyText}
            </p>
          </div>
        )
      ) : (
        <OrderList t={t} locale={locale} orders={orders} />
      )}

      {pages > 1 && orders.length > 0 ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          {page > 1 ? (
            <ButtonLink href={pageHref(page - 1)} variant="outline" size="sm">
              {labels.previous}
            </ButtonLink>
          ) : (
            <span />
          )}

          <span className="text-[0.75rem] tabular-nums text-subtle">
            {page} / {pages}
          </span>

          {page < pages ? (
            <ButtonLink href={pageHref(page + 1)} variant="outline" size="sm">
              {labels.next}
            </ButtonLink>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
