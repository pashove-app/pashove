"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import {
  NAV_MAIN,
  NAV_SETTINGS,
  NAV_STORE,
  type NavItem,
} from "@/components/dashboard/nav";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

/**
 * Navigation marchande.
 *
 * Fixe à partir de `lg`, tiroir superposé en dessous. L'élément actif se
 * déduit du chemin réel : aucun état à synchroniser.
 */
export function DashboardSidebar({
  t,
  locale,
  open,
  onClose,
}: {
  t: Dictionary;
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    const target = path(locale, href);
    return href === "/app"
      ? pathname === target
      : pathname === target || pathname.startsWith(`${target}/`);
  }

  function renderItem(item: NavItem) {
    return (
      <li key={item.key}>
        <Link
          href={path(locale, item.href)}
          onClick={onClose}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] transition-colors",
            isActive(item.href)
              ? "bg-surface font-medium text-fg shadow-[0_1px_2px_rgba(0,0,0,0.22)]"
              : "text-muted hover:bg-hairline hover:text-fg",
          )}
        >
          <Icon
            path={icons[item.icon]}
            className="h-[1.125rem] w-[1.125rem] shrink-0"
            strokeWidth={1.8}
          />
          <span className="truncate">{t.dashboard.nav[item.key]}</span>
        </Link>
      </li>
    );
  }

  return (
    <>
      {open ? (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-border bg-bg-soft transition-transform duration-200",
          "lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100dvh-4rem)] lg:w-64 lg:translate-x-0",
          open
            ? "translate-x-0"
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 lg:hidden">
          <PashoveLogo />
          <button
            type="button"
            onClick={onClose}
            aria-label={t.dashboard.topbar.close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hairline hover:text-fg"
          >
            <Icon path={icons.close} className="h-5 w-5" strokeWidth={1.9} />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4 pt-3 lg:pt-5">
          <ul className="space-y-0.5">{NAV_MAIN.map(renderItem)}</ul>

          <div className="my-3 border-t border-border" />

          <ul className="space-y-0.5">{renderItem(NAV_STORE)}</ul>

          <ul className="mt-auto space-y-0.5 pt-6">{renderItem(NAV_SETTINGS)}</ul>
        </nav>
      </aside>
    </>
  );
}
