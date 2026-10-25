"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NAV_GROUPS,
  NAV_SYSTEM,
  type NavItem,
} from "@/components/dashboard/nav";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

/**
 * Liste de navigation partagée par la sidebar et la feuille mobile.
 *
 * Elle est pensée pour la surface de marque : texte clair sur bleu nuit, quel
 * que soit le thème du contenu.
 */
export function DashboardNavList({
  t,
  locale,
  collapsed = false,
  onNavigate,
}: {
  t: Dictionary;
  locale: Locale;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    const target = path(locale, href);
    return href === "/app"
      ? pathname === target
      : pathname === target || pathname.startsWith(`${target}/`);
  }

  function renderItem(item: NavItem) {
    const label = t.dashboard.nav[item.key];
    const active = isActive(item.href);

    return (
      <li key={item.key}>
        <Link
          href={path(locale, item.href)}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          title={collapsed ? label : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-[0.8125rem] transition-colors",
            collapsed && "justify-center px-0",
            active
              ? "bg-brand-500 font-medium text-white shadow-[0_8px_22px_-10px_rgba(47,92,255,0.9)]"
              : "text-white/65 hover:bg-white/[0.07] hover:text-white",
          )}
        >
          <Icon
            path={icons[item.icon]}
            className="h-[1.125rem] w-[1.125rem] shrink-0"
            strokeWidth={1.8}
          />
          {collapsed ? null : (
            <>
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {item.soon ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide",
                    active ? "bg-white/20 text-white/80" : "bg-white/10 text-white/45",
                  )}
                >
                  {t.dashboard.nav.soon}
                </span>
              ) : null}
            </>
          )}
        </Link>
      </li>
    );
  }

  return (
    <nav className="flex flex-col">
      {NAV_GROUPS.map((group, index) => (
        <div key={group.labelKey ?? `group-${index}`} className={index > 0 ? "mt-2" : undefined}>
          {group.labelKey ? (
            collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
            ) : (
              <p className="px-3 pb-1.5 pt-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/35">
                {t.dashboard.navGroups[group.labelKey]}
              </p>
            )
          ) : null}

          <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
        </div>
      ))}

      <div className="my-3 border-t border-white/10" />
      <ul className="space-y-0.5">{NAV_SYSTEM.map(renderItem)}</ul>
    </nav>
  );
}
