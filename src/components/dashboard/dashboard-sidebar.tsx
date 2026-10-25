"use client";

import Link from "next/link";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { DashboardNavList } from "@/components/dashboard/dashboard-nav";
import { SidebarPlanCard } from "@/components/dashboard/sidebar-plan-card";
import { SidebarProfileCard } from "@/components/dashboard/sidebar-profile-card";
import type { Merchant } from "@/components/dashboard/types";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

/**
 * Navigation desktop, sur une surface de marque.
 *
 * Le bleu nuit reste identique dans les deux thèmes : c'est l'ancre visuelle de
 * l'espace marchand, pas une surface d'interface qui doit suivre le mode clair.
 * Repliable en colonne d'icônes ; le choix est mémorisé côté serveur.
 */
export function DashboardSidebar({
  t,
  locale,
  merchant,
  collapsed,
  onToggle,
  isSuperAdmin,
}: {
  t: Dictionary;
  locale: Locale;
  merchant: Merchant;
  collapsed: boolean;
  onToggle: () => void;
  isSuperAdmin: boolean;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-white/10 bg-[#0a1330] transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.75rem]" : "w-[16.5rem]",
      )}
    >
      <div
        className={cn(
          "flex items-center px-3 pt-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? null : (
          <Link href={path(locale, "/app")} className="ps-1">
            <PashoveLogo className="text-white" />
          </Link>
        )}

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            collapsed ? t.dashboard.sidebar.expand : t.dashboard.sidebar.collapse
          }
          title={collapsed ? t.dashboard.sidebar.expand : t.dashboard.sidebar.collapse}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Icon
            path={icons.arrowRight}
            className={cn(
              "h-4 w-4",
              collapsed ? "rtl:rotate-180" : "rotate-180 rtl:rotate-0",
            )}
          />
        </button>
      </div>

      <div className="px-3 pt-4">
        <SidebarProfileCard
          t={t}
          locale={locale}
          merchant={merchant}
          collapsed={collapsed}
        />
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        <DashboardNavList t={t} locale={locale} collapsed={collapsed} />
      </div>

      {isSuperAdmin ? (
        <div className={cn("px-3 pb-3", collapsed && "px-2")}>
          {collapsed ? null : (
            <p className="mb-2 px-3 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/35">
              {t.dashboard.sidebar.adminSection}
            </p>
          )}
          <Link
            href="/platform-admin"
            title={t.dashboard.sidebar.adminConsole}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl text-[0.8125rem] font-medium text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white",
              collapsed ? "justify-center px-0" : "px-3",
            )}
          >
            <Icon path={icons.shield} className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.7} />
            {collapsed ? null : <span className="truncate">{t.dashboard.sidebar.adminConsole}</span>}
          </Link>
        </div>
      ) : null}

      <div className="px-3 pb-4">
        <SidebarPlanCard t={t} collapsed={collapsed} />
      </div>
    </aside>
  );
}
