"use client";

import { useState, type ReactNode } from "react";
import { CommandPaletteProvider } from "@/components/dashboard/command-palette";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
  DashboardTopbar,
  type Merchant,
} from "@/components/dashboard/dashboard-topbar";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Coquille de l'espace marchand : barre supérieure, navigation et contenu.
 *
 * Les pages restent des composants serveur ; seule cette coquille est cliente,
 * parce qu'elle porte le tiroir mobile, la palette et les popovers.
 */
export function DashboardShell({
  t,
  locale,
  merchant,
  children,
}: {
  t: Dictionary;
  locale: Locale;
  merchant: Merchant;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <CommandPaletteProvider locale={locale} t={t}>
      <div className="min-h-dvh bg-bg">
        <DashboardTopbar
          t={t}
          locale={locale}
          merchant={merchant}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <div className="mx-auto flex w-full max-w-[1600px]">
          <DashboardSidebar
            t={t}
            locale={locale}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
          />

          <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
