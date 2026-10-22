import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { encodeCustomerKey } from "@/lib/customers/identity";
import type { StoreCustomer } from "@/lib/customers/queries";

/** Liste des clients : tableau desktop, cartes mobile. */
export function CustomerList({
  t,
  locale,
  customers,
  currency,
}: {
  t: Dictionary;
  locale: Locale;
  customers: StoreCustomer[];
  currency: string;
}) {
  const labels = t.dashboard.customers;
  const localeTag = LOCALE_META[locale].tag;
  const money = (amount: number) => formatMoney(amount, currency, localeTag);

  const date = (value: string) =>
    new Intl.DateTimeFormat(localeTag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  const contact = (customer: StoreCustomer) =>
    customer.email?.trim() || customer.phone?.trim() || "—";

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
            <th className="px-5 py-3 text-start font-semibold">{labels.columnCustomer}</th>
            <th className="px-4 py-3 text-start font-semibold">{labels.columnOrders}</th>
            <th className="px-4 py-3 text-end font-semibold">{labels.columnSpent}</th>
            <th className="px-4 py-3 text-start font-semibold">{labels.columnLastOrder}</th>
            <th className="px-5 py-3 text-end" aria-label={labels.columnCustomer} />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.customer_key} className="border-b border-border last:border-0">
              <td className="px-5 py-3">
                <Link
                  href={path(locale, `/app/clients/${encodeCustomerKey(customer.customer_key)}`)}
                  className="block text-[0.875rem] font-medium text-fg transition-colors hover:text-accent"
                >
                  {customer.name}
                </Link>
                <p dir="ltr" className="mt-0.5 max-w-[16rem] truncate text-[0.75rem] text-faint">
                  {contact(customer)}
                </p>
              </td>
              <td className="px-4 py-3 text-[0.8125rem] tabular-nums text-body">
                {customer.orders_count}
              </td>
              <td className="px-4 py-3 text-end text-[0.875rem] font-medium tabular-nums text-fg">
                {money(customer.total_spent)}
              </td>
              <td className="px-4 py-3 text-[0.8125rem] text-muted">
                {date(customer.last_order_at)}
              </td>
              <td className="px-5 py-3 text-end">
                <Link
                  href={path(locale, `/app/clients/${encodeCustomerKey(customer.customer_key)}`)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
                  aria-label={customer.name}
                >
                  <Icon path={icons.arrowRight} className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {customers.map((customer) => (
          <li key={customer.customer_key}>
            <Link
              href={path(locale, `/app/clients/${encodeCustomerKey(customer.customer_key)}`)}
              className="block p-4 transition-colors hover:bg-hairline/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[0.875rem] font-medium text-fg">{customer.name}</p>
                  <p dir="ltr" className="mt-0.5 truncate text-[0.75rem] text-subtle">
                    {contact(customer)}
                  </p>
                </div>
                <p className="shrink-0 text-[0.875rem] font-medium tabular-nums text-fg">
                  {money(customer.total_spent)}
                </p>
              </div>
              <p className="mt-2 text-[0.75rem] text-subtle">
                {customer.orders_count} · {labels.lastOrder.toLowerCase()} {date(customer.last_order_at)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
