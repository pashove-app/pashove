import Link from "next/link";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Raccourcis de l'accueil, à droite du graphique. */
export function QuickActions({
  t,
  locale,
}: {
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-[0.9375rem] font-medium text-fg">
        {t.dashboard.home.quickActions}
      </h2>

      <div className="mt-4 space-y-2.5">
        <ActionLink
          href={path(locale, "/app/customers")}
          icon="users"
          label={t.dashboard.home.addCustomer}
        />
        <ActionLink
          href={path(locale, "/app/products")}
          icon="plus"
          label={t.dashboard.home.newProduct}
        />
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
      className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-soft px-4 py-3 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg"
    >
      <Icon path={icons[icon]} className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
