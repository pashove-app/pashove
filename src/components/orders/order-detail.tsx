import Image from "next/image";
import Link from "next/link";
import {
  orderStatusLabel,
  OrderStatusBadge,
  PaymentStatus,
} from "@/components/orders/order-status-badge";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import type {
  OrderDetail as OrderDetailData,
  OrderStatus,
} from "@/lib/orders/queries";
import { publicUrl } from "@/lib/r2/media";

const STATUS_VALUES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && STATUS_VALUES.includes(value as OrderStatus);
}

/** Fiche commande complète, en lecture seule (actions au lot O3). */
export function OrderDetail({
  t,
  locale,
  order,
}: {
  t: Dictionary;
  locale: Locale;
  order: OrderDetailData;
}) {
  const labels = t.dashboard.orders;
  const localeTag = LOCALE_META[locale].tag;

  const money = (amount: number) => formatMoney(amount, order.currency, localeTag);
  const date = (value: string, withTime = false) =>
    new Intl.DateTimeFormat(localeTag, {
      dateStyle: "medium",
      ...(withTime ? { timeStyle: "short" } : {}),
    }).format(new Date(value));

  const eventText = (event: OrderDetailData["events"][number]): string => {
    if (event.type === "created") return labels.eventCreated;
    if (event.type === "status_changed") {
      const from = event.payload.from;
      const to = event.payload.to;
      const fromLabel = isOrderStatus(from) ? orderStatusLabel(from, t) : String(from ?? "—");
      const toLabel = isOrderStatus(to) ? orderStatusLabel(to, t) : String(to ?? "—");
      return `${labels.eventStatus} · ${fromLabel} → ${toLabel}`;
    }
    return event.type;
  };

  const country =
    t.countries_names[
      order.shipping_country as keyof Dictionary["countries_names"]
    ] ?? order.shipping_country;

  return (
    <div>
      <Link
        href={path(locale, "/app/orders")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.backToOrders}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          #{order.number}
        </h1>
        <OrderStatusBadge status={order.status} t={t} />
        <PaymentStatus status={order.payment_status} t={t} />
      </div>
      <p className="mt-1 text-[0.8125rem] text-subtle">
        {labels.placedOn.replace("{date}", date(order.created_at, true))}
      </p>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h2 className="text-[0.9375rem] font-medium text-fg">{labels.itemsTitle}</h2>
              <span className="text-[0.75rem] text-subtle">
                {(order.items.length === 1
                  ? labels.itemCount
                  : labels.itemCountPlural
                ).replace("{count}", String(order.items.length))}
              </span>
            </div>

            <table className="hidden w-full sm:table">
              <thead>
                <tr className="border-b border-hairline text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                  <th className="px-5 py-2.5 text-start font-semibold">{labels.productLabel}</th>
                  <th className="px-3 py-2.5 text-center font-semibold">{labels.quantityLabel}</th>
                  <th className="px-3 py-2.5 text-end font-semibold">{labels.unitPriceLabel}</th>
                  <th className="px-5 py-2.5 text-end font-semibold">{labels.lineTotalLabel}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-hairline align-middle last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ItemThumb item={item} />
                        <div className="min-w-0">
                          <p className="truncate text-[0.8125rem] font-medium text-fg">
                            {item.product_name}
                          </p>
                          {item.variant_label ? (
                            <p className="mt-0.5 text-[0.75rem] text-subtle">
                              {item.variant_label}
                            </p>
                          ) : null}
                          {item.sku ? (
                            <p dir="ltr" className="mt-0.5 font-mono text-[0.6875rem] text-faint">
                              {labels.skuLabel} · {item.sku}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-[0.8125rem] tabular-nums text-body">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-3 text-end text-[0.8125rem] tabular-nums text-muted">
                      {money(item.unit_price)}
                    </td>
                    <td className="px-5 py-3 text-end text-[0.8125rem] font-medium tabular-nums text-fg">
                      {money(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-hairline sm:hidden">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 p-4">
                  <ItemThumb item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-fg">
                      {item.product_name}
                    </p>
                    {item.variant_label ? (
                      <p className="mt-0.5 text-[0.75rem] text-subtle">{item.variant_label}</p>
                    ) : null}
                    <p className="mt-1 text-[0.75rem] text-muted">
                      {item.quantity} × {money(item.unit_price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-[0.8125rem] font-medium tabular-nums text-fg">
                    {money(item.line_total)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.summaryTitle}</h2>
            <dl className="mt-4 space-y-2 text-[0.875rem]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-subtle">{labels.subtotalLabel}</dt>
                <dd className="font-medium tabular-nums text-fg">{money(order.subtotal_amount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-subtle">{labels.shippingLabel}</dt>
                <dd className="font-medium tabular-nums text-fg">{money(order.shipping_amount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-hairline pt-2 text-[1rem]">
                <dt className="font-medium text-fg">{labels.totalLabel}</dt>
                <dd className="font-semibold tabular-nums text-fg">{money(order.total_amount)}</dd>
              </div>
            </dl>
          </section>

          {order.events.length > 0 ? (
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-[0.9375rem] font-medium text-fg">{labels.timelineTitle}</h2>
              <ol className="mt-4 space-y-4 border-s border-border ps-5">
                {order.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -start-[1.42rem] top-1.5 h-2 w-2 rounded-full bg-accent ring-4 ring-surface"
                    />
                    <p className="text-[0.8125rem] font-medium text-body">{eventText(event)}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-faint">
                      {date(event.created_at, true)}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.customerTitle}</h2>
            <div className="mt-3 space-y-1.5 text-[0.8125rem]">
              <p className="font-medium text-fg">{order.customer_name}</p>
              {order.customer_phone ? (
                <a href={`tel:${order.customer_phone}`} dir="ltr" className="block text-subtle hover:text-fg">
                  {order.customer_phone}
                </a>
              ) : null}
              {order.customer_email ? (
                <a href={`mailto:${order.customer_email}`} dir="ltr" className="block truncate text-subtle hover:text-fg">
                  {order.customer_email}
                </a>
              ) : null}
              {order.notes ? (
                <div className="mt-3 border-t border-hairline pt-3">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                    {labels.notesLabel}
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
                    {order.notes}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.addressTitle}</h2>
            <address className="mt-3 text-[0.8125rem] not-italic leading-relaxed text-subtle">
              <p className="font-medium text-fg">{order.customer_name}</p>
              <p>{order.shipping_address}</p>
              {order.shipping_extra ? <p>{order.shipping_extra}</p> : null}
              <p>
                {order.shipping_city} · {country}
              </p>
            </address>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.paymentTitle}</h2>
            <div className="mt-3 flex items-center justify-between gap-3 text-[0.8125rem]">
              <span className="text-subtle">{labels.paymentCod}</span>
              <PaymentStatus status={order.payment_status} t={t} />
            </div>
            <p className="mt-2 text-[1rem] font-medium tabular-nums text-fg">
              {money(order.total_amount)}
            </p>
            {order.payment ? (
              <p className="mt-1 text-[0.6875rem] text-faint">
                {date(order.payment.created_at, true)}
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function ItemThumb({ item }: { item: OrderDetailData["items"][number] }) {
  if (item.image_key) {
    return (
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-hairline">
        <Image
          src={publicUrl(item.image_key)}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-hairline text-faint">
      <Icon path={icons.tag} className="h-4 w-4" strokeWidth={1.6} />
    </span>
  );
}
