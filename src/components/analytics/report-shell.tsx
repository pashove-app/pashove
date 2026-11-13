import Link from "next/link";
import type { ReactNode } from "react";

const TABS = [
  { key: "overview", href: "/app/analytics", label: "Vue d’ensemble" },
  { key: "sales", href: "/app/analytics/sales", label: "Ventes" },
  { key: "products", href: "/app/analytics/products", label: "Produits" },
  { key: "customers", href: "/app/analytics/customers", label: "Clients" },
  { key: "conversion", href: "/app/analytics/conversion", label: "Conversion" },
  { key: "retention", href: "/app/analytics/retention", label: "Fidélité" },
  { key: "delivery", href: "/app/analytics/delivery", label: "Livraison" },
  { key: "payouts", href: "/app/analytics/payouts", label: "Retraits" },
  { key: "inventory", href: "/app/analytics/inventory", label: "Stock" },
  { key: "marketing", href: "/app/analytics/marketing", label: "Marketing" },
];

/** Coquille commune aux dix rapports d'analyses. */
export function ReportShell({
  locale,
  active,
  title,
  subtitle,
  children,
}: {
  locale: string;
  active: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Pilotage
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-subtle">
          {subtitle}
        </p>
      </header>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/${locale}${tab.href}`}
            className={`inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[0.75rem] font-medium ${
              tab.key === active
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-border bg-surface text-subtle hover:border-border-strong"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5">{children}</div>
    </div>
  );
}

export function ReportStats({
  stats,
}: {
  stats: { label: string; value: string; hint?: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border border-border bg-surface p-4 sm:p-5"
        >
          <p className="text-[0.6875rem] text-subtle">{stat.label}</p>
          <p className="mt-1.5 truncate text-[1.375rem] font-semibold tabular-nums tracking-[-0.03em] text-fg">
            {stat.value}
          </p>
          {stat.hint ? (
            <p className="mt-1 text-[0.625rem] text-faint">{stat.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ReportPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-[0.9375rem] font-medium text-fg">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
