import Link from "next/link";
import { PaymentStatus, OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { quickAdvanceAction } from "@/lib/orders/actions";
import type { OrderStatus, OrderSummary } from "@/lib/orders/queries";

const QUICK: Partial<Record<OrderStatus, string>> = {
  pending: "quickConfirm",
  confirmed: "quickPrepare",
  shipped: "quickDeliver",
};

const QUICK_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-[0.75rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg";

/** Liste des commandes : tableau desktop, cartes mobile. */
export function OrderList({
  t,
  locale,
  orders,
}: {
  t: Dictionary;
  locale: Locale;
  orders: OrderSummary[];
}) {
  const labels = t.dashboard.orders;
  const localeTag = LOCALE_META[locale].tag;

  const money = (amount: number, currency: string) =>
    formatMoney(amount, currency, localeTag);

  const date = (value: string) =>
    new Intl.DateTimeFormat(localeTag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  const items = (count: number) =>
    (count === 1 ? labels.itemCount : labels.itemCountPlural).replace(
      "{count}",
      String(count),
    );

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
            <th className="px-5 py-3 text-start font-semibold">{labels.columnOrder}</th>
            <th className="px-4 py-3 text-start font-semibold">{labels.columnCustomer}</th>
            <th className="px-4 py-3 text-start font-semibold">{labels.columnItems}</th>
            <th className="px-4 py-3 text-end font-semibold">{labels.columnTotal}</th>
            <th className="px-4 py-3 text-start font-semibold">{labels.columnPayment}</th>
            <th className="px-4 py-3 text-start font-semibold">{labels.columnStatus}</th>
            <th className="px-5 py-3 text-end font-semibold" aria-label={labels.seeOrder} />
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border align-middle last:border-0">
              <td className="px-5 py-3">
                <Link
                  href={path(locale, `/app/orders/${order.id}`)}
                  className="block text-[0.875rem] font-medium text-fg transition-colors hover:text-accent"
                >
                  #{order.number}
                </Link>
                <p className="mt-0.5 text-[0.75rem] text-faint">{date(order.created_at)}</p>
              </td>

              <td className="px-4 py-3">
                <p className="max-w-[14rem] truncate text-[0.8125rem] font-medium text-body">
                  {order.customer_name}
                </p>
                <p dir="ltr" className="mt-0.5 text-[0.75rem] text-faint">
                  {order.customer_phone}
                </p>
              </td>

              <td className="px-4 py-3 text-[0.8125rem] text-muted">
                {items(order.item_count)}
              </td>

              <td className="px-4 py-3 text-end text-[0.875rem] font-medium tabular-nums text-fg">
                {money(order.total_amount, order.currency)}
              </td>

              <td className="px-4 py-3">
                <PaymentStatus status={order.payment_status} t={t} />
                <p className="mt-0.5 text-[0.6875rem] text-faint">{labels.paymentCod}</p>
              </td>

              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} t={t} />
              </td>

              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <QuickAction order={order} labels={labels} locale={locale} />
                  <Link
                    href={path(locale, `/app/orders/${order.id}`)}
                    aria-label={labels.seeOrder}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
                  >
                    <Icon path={icons.arrowRight} className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={path(locale, `/app/orders/${order.id}`)}
              className="block p-4 transition-colors hover:bg-hairline/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.875rem] font-medium text-fg">#{order.number}</p>
                  <p className="mt-0.5 text-[0.75rem] text-faint">{date(order.created_at)}</p>
                </div>
                <OrderStatusBadge status={order.status} t={t} />
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] text-body">
                    {order.customer_name}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    {items(order.item_count)} · <PaymentStatus status={order.payment_status} t={t} />
                  </p>
                </div>
                <p className="shrink-0 text-[0.875rem] font-medium tabular-nums text-fg">
                  {money(order.total_amount, order.currency)}
                </p>
              </div>
            </Link>

            {order.status === "processing" ||
            order.status === "pending" ||
            order.status === "confirmed" ||
            order.status === "shipped" ? (
              <div className="border-t border-hairline px-4 py-2.5">
                <QuickAction order={order} labels={labels} locale={locale} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickAction({
  order,
  labels,
  locale,
}: {
  order: OrderSummary;
  labels: Dictionary["dashboard"]["orders"];
  locale: Locale;
}) {
  if (!order.has_physical) return null;

  if (order.status === "processing") {
    return (
      <Link
        href={path(locale, `/app/orders/${order.id}`)}
        className={QUICK_BUTTON}
      >
        {labels.quickShip}
      </Link>
    );
  }

  const key = QUICK[order.status];
  if (!key) return null;

  return (
    <form action={quickAdvanceAction}>
      <input type="hidden" name="orderId" value={order.id} />
      <button
        type="submit"
        className={QUICK_BUTTON}
      >
        {labels[key as keyof Dictionary["dashboard"]["orders"]]}
      </button>
    </form>
  );
}
