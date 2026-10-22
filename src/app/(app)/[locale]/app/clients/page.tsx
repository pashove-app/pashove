import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerList } from "@/components/customers/customer-list";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listStoreCustomers } from "@/lib/customers/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.customers.title };
}

const PER_PAGE = 20;

/** Clients dérivés des commandes, regroupés par e-mail (ou téléphone). */
export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const { q: rawQuery, page: rawPage } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const q = typeof rawQuery === "string" ? rawQuery.slice(0, 80) : "";
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const term = q.trim().toLocaleLowerCase();

  const all = await listStoreCustomers(store.id);
  const filtered = term
    ? all.filter((customer) =>
        `${customer.name} ${customer.email ?? ""} ${customer.phone ?? ""}`
          .toLocaleLowerCase()
          .includes(term),
      )
    : all;

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const t = await getDictionary(locale);
  const labels = t.dashboard.customers;
  const countLabel = (total === 1 ? labels.count : labels.countPlural).replace(
    "{count}",
    String(total),
  );

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return path(locale, `/app/clients${query ? `?${query}` : ""}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div>
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.title}
        </h1>
        <p className="mt-1 text-[0.875rem] text-muted">{countLabel}</p>
      </div>

      <form action={path(locale, "/app/clients")} className="relative mt-6 max-w-md">
        <Icon
          path={icons.search}
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          strokeWidth={2}
        />
        <input
          name="q"
          defaultValue={q}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.columnCustomer}
          maxLength={80}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-border bg-surface ps-10 pe-10 text-[0.875rem] text-fg placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
        />
        {q ? (
          <Link
            href={path(locale, "/app/clients")}
            aria-label={labels.clearFilters}
            className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:bg-hairline hover:text-fg"
          >
            <Icon path={icons.close} className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        ) : null}
        <button type="submit" className="sr-only">
          {labels.columnCustomer}
        </button>
      </form>

      {current.length === 0 ? (
        q ? (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-[0.9375rem] font-medium text-fg">{labels.noResults}</p>
            <p className="mt-1 text-[0.8125rem] text-subtle">{labels.noResultsHint}</p>
            <ButtonLink
              href={path(locale, "/app/clients")}
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
              <Icon path={icons.users} className="h-5 w-5" strokeWidth={1.7} />
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
        <CustomerList
          t={t}
          locale={locale}
          customers={current}
          currency={store.currency}
        />
      )}

      {pages > 1 && current.length > 0 ? (
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
