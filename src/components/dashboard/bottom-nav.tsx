"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV } from "@/components/dashboard/nav";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

/**
 * Navigation mobile : quatre sections et un bouton « Menu ».
 *
 * Le cinquième emplacement n'est pas un lien — il ouvre la feuille complète.
 * La barre respecte la zone sûre des téléphones à encoche.
 */
export function BottomNav({
  t,
  locale,
  onOpenMenu,
}: {
  t: Dictionary;
  locale: Locale;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    const target = path(locale, href);
    return href === "/app"
      ? pathname === target
      : pathname === target || pathname.startsWith(`${target}/`);
  }

  const labelFor = (key: string) => {
    if (key === "home") return t.dashboard.bottomNav.home;
    if (key === "orders") return t.dashboard.bottomNav.sales;
    return t.dashboard.nav[key as keyof Dictionary["dashboard"]["nav"]];
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item.href);

          return (
            <li key={item.key}>
              <Link
                href={path(locale, item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium transition-colors",
                  active ? "text-accent" : "text-subtle hover:text-fg",
                )}
              >
                <Icon
                  path={icons[item.icon]}
                  className="h-[1.25rem] w-[1.25rem]"
                  strokeWidth={active ? 2.1 : 1.8}
                />
                <span className="max-w-full truncate px-1">{labelFor(item.key)}</span>
              </Link>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex w-full flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium text-subtle transition-colors hover:text-fg"
          >
            <Icon path={icons.menu} className="h-[1.25rem] w-[1.25rem]" strokeWidth={1.8} />
            <span>{t.dashboard.bottomNav.menu}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
