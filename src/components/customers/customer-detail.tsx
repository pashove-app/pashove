import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { CustomerOrder } from "@/lib/customers/queries";
import { formatMoney } from "@/lib/money";

/** Fiche client calculée à partir de ses commandes. */
export function CustomerDetail({
  t,
  locale,
  currency,
  orders,
}: {
  t: Dictionary;
  locale: Locale;
  currency: string;
  orders: CustomerOrder[];
}) {
  const labels = t.dashboard.customers;
  const localeTag = LOCALE_META[locale].tag;

  const money = (amount: number) => formatMoney(amount, currency, localeTag);
  const date = (value: string, withTime = false) =>
    new Intl.DateTimeFormat(localeTag, {
      dateStyle: "medium",
      ...(withTime ? { timeStyle: "short" } : {}),
    }).format(new Date(value));

  const latest = orders[0];
  const active = orders.filter((order) => order.status !== "cancelled");
  const totalSpent = active.reduce((sum, order) => sum + order.total_amount, 0);
  const average = active.length > 0 ? Math.round(totalSpent / active.length) : 0;
  const since = orders[orders.length - 1]?.created_at ?? latest.created_at;

  const addressMap = new Map<
    string,
    {
      address: string;
      extra: string | null;
      city: string;
      country: string;
      count: number;
      lastAt: string;
    }
  >();

  for (const order of orders) {
    const key = [
      order.shipping_address,
      order.shipping_extra ?? "",
      order.shipping_city,
      order.shipping_country,
    ].join("|");

    const current = addressMap.get(key);
    if (current) {
      current.count += 1;
      if (order.created_at > current.lastAt) current.lastAt = order.created_at;
    } else {
      addressMap.set(key, {
        address: order.shipping_address,
        extra: order.shipping_extra,
        city: order.shipping_city,
        country: order.shipping_country,
        count: 1,
        lastAt: order.created_at,
      });
    }
  }

  const addresses = [...addressMap.values()]
    .sort((left, right) => right.lastAt.localeCompare(left.lastAt))
    .slice(0, 4);

  const countryName = (code: string) =>
    t.countries_names[code as keyof Dictionary["countries_names"]] ?? code;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href={path(locale, "/app/clients")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.backToCustomers}
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {latest.customer_name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem]">
            {latest.customer_email ? (
              <a
                href={`mailto:${latest.customer_email}`}
                dir="ltr"
                className="text-subtle transition-colors hover:text-fg"
              >
                {latest.customer_email}
              </a>
            ) : null}
            {latest.customer_phone ? (
              <a
                href={`tel:${latest.customer_phone}`}
                dir="ltr"
                className="text-subtle transition-colors hover:text-fg"
              >
                {latest.customer_phone}
              </a>
            ) : null}
          </div>
          <p className="mt-2 text-[0.75rem] text-faint">
            {labels.customerSince.replace("{date}", date(since))}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={labels.totalSpent} value={money(totalSpent)} />
        <Stat label={labels.ordersCount} value={String(active.length)} />
        <Stat label={labels.averageBasket} value={money(average)} />
        <Stat label={labels.lastOrder} value={date(latest.created_at)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.ordersTitle}</h2>
            <span className="text-[0.75rem] text-subtle">
              {(orders.length === 1
                ? t.dashboard.orders.count
                : t.dashboard.orders.countPlural
              ).replace("{count}", String(orders.length))}
            </span>
          </div>

          <table className="hidden w-full sm:table">
            <thead>
              <tr className="border-b border-hairline text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                <th className="px-5 py-2.5 text-start font-semibold">{t.dashboard.orders.columnOrder}</th>
                <th className="px-3 py-2.5 text-start font-semibold">{labels.dateLabel}</th>
                <th className="px-3 py-2.5 text-start font-semibold">{t.dashboard.orders.columnStatus}</th>
                <th className="px-5 py-2.5 text-end font-semibold">{t.dashboard.orders.totalLabel}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      href={path(locale, `/app/orders/${order.id}`)}
                      className="text-[0.8125rem] font-medium text-fg transition-colors hover:text-accent"
                    >
                      #{order.number}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-[0.8125rem] text-muted">
                    {date(order.created_at)}
                  </td>
                  <td className="px-3 py-3">
                    <OrderStatusBadge status={order.status} t={t} />
                  </td>
                  <td className="px-5 py-3 text-end text-[0.8125rem] font-medium tabular-nums text-fg">
                    {money(order.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-hairline sm:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={path(locale, `/app/orders/${order.id}`)}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="text-[0.875rem] font-medium text-fg">#{order.number}</p>
                    <p className="mt-0.5 text-[0.75rem] text-faint">
                      {date(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} t={t} />
                    <span className="text-[0.8125rem] font-medium tabular-nums text-fg">
                      {money(order.total_amount)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.addressesTitle}</h2>

            {addresses.length === 0 ? (
              <p className="mt-3 text-[0.8125rem] text-subtle">{labels.noAddresses}</p>
            ) : (
              <ul className="mt-3 space-y-4">
                {addresses.map((address) => (
                  <li key={`${address.address}-${address.city}`}>
                    <p className="text-[0.8125rem] font-medium text-body">{address.address}</p>
                    {address.extra ? (
                      <p className="text-[0.75rem] text-subtle">{address.extra}</p>
                    ) : null}
                    <p className="text-[0.75rem] text-subtle">
                      {address.city} · {countryName(address.country)}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-faint">
                      {(address.count === 1
                        ? t.dashboard.orders.count
                        : t.dashboard.orders.countPlural
                      ).replace("{count}", String(address.count))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
        {label}
      </p>
      <p className="mt-1.5 truncate text-[1.0625rem] font-medium tabular-nums text-fg">
        {value}
      </p>
    </div>
  );
}
