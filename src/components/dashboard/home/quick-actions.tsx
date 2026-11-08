import Link from "next/link";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export type QuickActionAlert = {
  key: string;
  icon: IconKey;
  tone: "warning" | "info" | "success";
  title: string;
  text: string;
  href: string;
  cta: string;
};

const TONE: Record<QuickActionAlert["tone"], string> = {
  warning:
    "border-amber-400/25 bg-amber-400/[0.06] hover:border-amber-400/45",
  info: "border-brand-500/25 bg-brand-500/[0.05] hover:border-brand-500/45",
  success:
    "border-emerald-400/25 bg-emerald-400/[0.06] hover:border-emerald-400/45",
};

const ICON_TONE: Record<QuickActionAlert["tone"], string> = {
  warning: "bg-amber-400/15 text-amber-700 dark:text-amber-300",
  info: "bg-brand-500/12 text-accent",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

/** Actions rapides : alertes contextuelles, puis raccourcis fixes. */
export function QuickActions({
  t,
  locale,
  sectionTitle,
  emptyTitle,
  emptyText,
  shortcutsLabel,
  alerts,
}: {
  t: Dictionary;
  locale: Locale;
  sectionTitle: string;
  emptyTitle: string;
  emptyText: string;
  shortcutsLabel: string;
  alerts: QuickActionAlert[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-[0.9375rem] font-medium text-fg">{sectionTitle}</h2>

      <div className="mt-4 space-y-2.5">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-bg-soft p-3.5">
            <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-fg">
              <Icon
                path={icons.check}
                className="h-4 w-4 text-emerald-600 dark:text-emerald-300"
                strokeWidth={2.4}
              />
              {emptyTitle}
            </p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
              {emptyText}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <Link
              key={alert.key}
              href={alert.href}
              className={`block rounded-2xl border p-3.5 transition-colors ${TONE[alert.tone]}`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ICON_TONE[alert.tone]}`}
                >
                  <Icon
                    path={icons[alert.icon]}
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.8125rem] font-medium text-fg">
                    {alert.title}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-subtle">
                    {alert.text}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-accent">
                    {alert.cta}
                    <Icon
                      path={icons.arrowRight}
                      className="h-3 w-3"
                      strokeWidth={2.2}
                    />
                  </span>
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-5 border-t border-hairline pt-4">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
          {shortcutsLabel}
        </p>
        <div className="mt-2.5 space-y-2.5">
          <ActionLink
            href={path(locale, "/app/clients")}
            icon="users"
            label={t.dashboard.home.addCustomer}
          />
          <ActionLink
            href={path(locale, "/app/products/new")}
            icon="plus"
            label={t.dashboard.home.newProduct}
          />
        </div>
      </div>
    </section>
  );
}

function ActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: IconKey;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-full border border-border bg-bg-soft px-4 py-3 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg"
    >
      <Icon path={icons[icon]} className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
