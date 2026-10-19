"use client";

import { useState, type ReactNode } from "react";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { CommandPaletteProvider } from "@/components/dashboard/command-palette";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { MobileMenuSheet } from "@/components/dashboard/mobile-menu-sheet";
import type { Merchant } from "@/components/dashboard/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Coquille de l'espace marchand.
 *
 * Desktop : sidebar de marque pleine hauteur + contenu à droite. Mobile : barre
 * supérieure, contenu, barre de navigation fixe en bas et feuille « Menu ».
 * Les pages restent des composants serveur.
 */
export function DashboardShell({
  t,
  locale,
  merchant,
  defaultCollapsed,
  children,
}: {
  t: Dictionary;
  locale: Locale;
  merchant: Merchant;
  defaultCollapsed: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;

      try {
        document.cookie = `pashove-sidebar=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        // Stockage indisponible : le repli reste actif pour la session.
      }

      return next;
    });
  }

  return (
    <CommandPaletteProvider locale={locale} t={t}>
      <div className="min-h-dvh bg-bg lg:flex">
        <DashboardSidebar
          t={t}
          locale={locale}
          merchant={merchant}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar t={t} locale={locale} />

          <main className="flex-1 px-5 pb-28 pt-8 sm:px-8 lg:pb-10">
            {children}
          </main>
        </div>

        <BottomNav
          t={t}
          locale={locale}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <MobileMenuSheet
          t={t}
          locale={locale}
          merchant={merchant}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      </div>
    </CommandPaletteProvider>
  );
}
