import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  claimGuestOrders,
  customerOrders,
  getCustomerUser,
} from "@/lib/customer/queries";
import type { OrderStatus } from "@/lib/orders/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CustomerOrdersPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);

  const user = await getCustomerUser();
  if (!user) redirect(`/${locale}/store/${slug}/account/login`);

  await claimGuestOrders();

  const [orders, t] = await Promise.all([
    customerOrders(slug),
    getDictionary(locale),
  ]);
  const labels = t.customer;
  const tag = LOCALE_META[locale].tag;

  const date = (value: string) =>
    new Intl.DateTimeFormat(tag, {
      dateStyle: "medium",
    }).format(new Date(value));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={path(locale, `/store/${slug}/account`)}
        className="text-[0.8125rem] font-medium text-accent hover:underline"
      >
        ← {labels.accountTitle}
      </Link>

      <h1 className="mt-4 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {labels.orders}
      </h1>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/[0.1] text-accent">
            <Icon path={icons.bag} className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            {labels.noOrders}
          </p>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            {labels.noOrdersText}
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-hairline overflow-hidden rounded-3xl border border-border bg-surface">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={path(
                  locale,
                  `/store/${slug}/account/orders/${order.id}`,
                )}
                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-hairline/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-medium text-fg">
                    #{order.number} · {date(order.createdAt)}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    {labels.itemsCount.replace(
                      "{count}",
                      String(order.itemCount),
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <OrderStatusBadge
                      status={order.status as OrderStatus}
                      t={t}
                    />
                    <PaymentStatus
                      status={
                        order.paymentStatus as
                          | "pending"
                          | "paid"
                          | "refunded"
                          | "failed"
                      }
                      t={t}
                    />
                  </div>
                </div>
                <p className="text-[0.9375rem] font-semibold tabular-nums text-fg">
                  {formatMoney(order.total, order.currency, tag)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
