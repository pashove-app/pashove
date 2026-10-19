"use client";

import { PashoveLogo } from "@/components/brand/pashove-logo";
import { DashboardNavList } from "@/components/dashboard/dashboard-nav";
import { SidebarPlanCard } from "@/components/dashboard/sidebar-plan-card";
import { SidebarProfileCard } from "@/components/dashboard/sidebar-profile-card";
import type { Merchant } from "@/components/dashboard/types";
import { Icon, icons } from "@/components/ui/primitives";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Feuille plein écran ouverte par « Menu », sur mobile.
 *
 * Elle reprend la navigation desktop et sa surface de marque : le marchand
 * retrouve exactement les mêmes entrées, avec le profil et le plan.
 */
export function MobileMenuSheet({
  t,
  locale,
  merchant,
  open,
  onClose,
}: {
  t: Dictionary;
  locale: Locale;
  merchant: Merchant;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.dashboard.bottomNav.menu}
      className="fixed inset-0 z-50 flex flex-col bg-[#0a1330] lg:hidden"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <PashoveLogo className="text-white" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t.dashboard.topbar.close}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Icon path={icons.close} className="h-5 w-5" strokeWidth={1.9} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 py-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <SidebarProfileCard t={t} locale={locale} merchant={merchant} />

        <div className="mt-4">
          <DashboardNavList t={t} locale={locale} onNavigate={onClose} />
        </div>

        <div className="mt-4">
          <SidebarPlanCard t={t} />
        </div>
      </div>
    </div>
  );
}
