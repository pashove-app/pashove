import Link from "next/link";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Quatre chiffres clés.
 *
 * Les valeurs sont réelles : aucune commande, aucun client, aucun produit
 * n'existe encore. Un zéro honnête vaut mieux qu'un exemple inventé.
 */
export function KpiGrid({
  t,
  locale,
  revenue,
  products,
}: {
  t: Dictionary;
  locale: Locale;
  /** Montant déjà mis en forme sur le serveur. */
  revenue: string;
  /** Nombre réel de produits de la boutique. */
  products: string;
}) {
  const items: {
    key: "revenue" | "orders" | "customers" | "products";
    href: string;
    icon: IconKey;
    value: string;
  }[] = [
    { key: "revenue", href: "/app/finance", icon: "wallet", value: revenue },
    { key: "orders", href: "/app/orders", icon: "box", value: "0" },
    { key: "customers", href: "/app/clients", icon: "users", value: "0" },
    { key: "products", href: "/app/products", icon: "tag", value: products },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.key}
          href={path(locale, item.href)}
          className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong sm:p-5"
        >
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
              <Icon
                path={icons[item.icon]}
                className="h-[1.125rem] w-[1.125rem]"
                strokeWidth={1.8}
              />
            </span>
            <Icon
              path={icons.arrowUpRight}
              className="h-4 w-4 text-faint opacity-0 transition-opacity group-hover:opacity-100"
              strokeWidth={1.8}
            />
          </div>

          <p className="mt-4 text-[0.75rem] text-subtle">
            {t.dashboard.home.kpi[item.key]}
          </p>
          <p className="mt-1 truncate text-[1.5rem] font-semibold tracking-[-0.03em] tabular-nums text-fg">
            {item.value}
          </p>
        </Link>
      ))}
    </div>
  );
}
