import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  OrderStatusBadge,
  PaymentStatus,
} from "@/components/orders/order-status-badge";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import {
  customerOrder,
  getCustomerUser,
} from "@/lib/customer/queries";
import type { OrderStatus } from "@/lib/orders/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; orderId: string }>;
}) {
  const { locale: raw, slug, orderId } = await params;
  const locale = resolveLocale(raw);

  const user = await getCustomerUser();
  if (!user) redirect(`/${locale}/store/${slug}/account/login`);
  if (!UUID_PATTERN.test(orderId)) notFound();

  const [order, t] = await Promise.all([
    customerOrder(slug, orderId),
    getDictionary(locale),
  ]);
  if (!order) notFound();

  const labels = t.customer;
  const tag = LOCALE_META[locale].tag;
  const money = (amount: number) => formatMoney(amount, order.currency, tag);
  const hasPhysical = order.items.some(
    (item) => item.productType === "physical",
  );
  const hasDigital = order.items.some(
    (item) => item.productType === "digital",
  );

  const date = (value: string, time = false) =>
    new Intl.DateTimeFormat(tag, {
      dateStyle: "medium",
      ...(time ? { timeStyle: "short" } : {}),
      timeZone: time ? "Africa/Abidjan" : undefined,
    }).format(new Date(value));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={path(locale, `/store/${slug}/account/orders`)}
        className="text-[0.8125rem] font-medium text-accent hover:underline"
      >
        ← {labels.orders}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg">
          #{order.number}
        </h1>
        <OrderStatusBadge status={order.status as OrderStatus} t={t} />
        <PaymentStatus
          status={
            order.paymentStatus as "pending" | "paid" | "refunded" | "failed"
          }
          t={t}
        />
      </div>
      <p className="mt-1 text-[0.8125rem] text-subtle">
        {date(order.createdAt, true)}
      </p>

      <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
        <h2 className="border-b border-hairline px-5 py-4 text-[0.9375rem] font-medium text-fg">
          {labels.orderDetail}
        </h2>
        <ul className="divide-y divide-hairline">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 px-5 py-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-hairline text-faint">
                <Icon path={icons.tag} className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.875rem] font-medium text-fg">
                  {item.name}
                </p>
                {item.variantLabel ? (
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    {item.variantLabel}
                  </p>
                ) : null}
                {item.serviceStartsAt ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-subtle">
                    <Icon
                      path={icons.calendar}
                      className="h-3.5 w-3.5"
                      strokeWidth={1.8}
                    />
                    {date(item.serviceStartsAt, true)}
                  </p>
                ) : null}
                <p className="mt-1 text-[0.75rem] text-muted">
                  {item.quantity} × {money(item.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 text-[0.875rem] font-medium tabular-nums text-fg">
                {money(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-hairline px-5 py-4 text-[0.875rem]">
          <div className="flex justify-between gap-3">
            <dt className="text-subtle">{labels.subtotal}</dt>
            <dd className="tabular-nums text-body">{money(order.subtotal)}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-subtle">
                {labels.discount}
                {order.discountCode ? ` (${order.discountCode})` : ""}
              </dt>
              <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
                −{money(order.discount)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-subtle">{labels.shipping}</dt>
            <dd className="tabular-nums text-body">{money(order.shipping)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-hairline pt-2 text-[1rem] font-medium">
            <dt className="text-fg">{labels.total}</dt>
            <dd className="tabular-nums text-fg">{money(order.total)}</dd>
          </div>
        </dl>
      </section>

      {hasPhysical ? (
        <section className="mt-4 rounded-3xl border border-border bg-surface p-5">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.delivery}
          </h2>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-subtle">
            {order.customerName}
            <br />
            {order.address}
            {order.extra ? (
              <>
                <br />
                {order.extra}
              </>
            ) : null}
            <br />
            {order.city} · {order.country}
          </p>
        </section>
      ) : null}

      {hasDigital ? (
        <Link
          href={path(locale, `/store/${slug}/account/downloads`)}
          className="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-brand-500/25 bg-brand-500/[0.06] p-5 transition-colors hover:border-brand-500/50"
        >
          <span>
            <span className="block text-[0.9375rem] font-medium text-fg">
              {labels.downloads}
            </span>
            <span className="mt-0.5 block text-[0.8125rem] text-subtle">
              {labels.downloadsHint}
            </span>
          </span>
          <Icon path={icons.arrowRight} className="h-4 w-4 shrink-0 text-accent rtl:rotate-180" />
        </Link>
      ) : null}
    </div>
  );
}
