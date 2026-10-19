"use client";

import Link from "next/link";
import { useState } from "react";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { useCommandPalette } from "@/components/dashboard/command-palette";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Icon, icons } from "@/components/ui/primitives";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Barre supérieure : recherche, notifications, thème et langue.
 *
 * Le logo n'apparaît que sur mobile — sur desktop, il vit dans la sidebar de
 * marque. L'avatar a quitté la topbar : le profil est dans la sidebar.
 */
export function DashboardTopbar({
  t,
  locale,
}: {
  t: Dictionary;
  locale: Locale;
}) {
  const palette = useCommandPalette();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href={path(locale, "/app")} className="lg:hidden">
          <PashoveLogo />
        </Link>

        <button
          type="button"
          onClick={palette.open}
          className="mx-auto hidden h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 text-[0.875rem] text-faint transition-colors hover:border-border-strong hover:text-muted sm:flex"
        >
          <Icon path={icons.search} className="h-4 w-4" strokeWidth={2} />
          <span className="min-w-0 flex-1 truncate text-start">
            {t.dashboard.topbar.search}
          </span>
          <kbd className="rounded-md border border-border-soft px-1.5 py-0.5 font-mono text-[0.625rem]">
            ⌘K
          </kbd>
        </button>

        <div className="ms-auto flex items-center gap-1">
          <button
            type="button"
            onClick={palette.open}
            aria-label={t.dashboard.topbar.search}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hairline hover:text-fg sm:hidden"
          >
            <Icon path={icons.search} className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
          </button>

          <LocaleSwitcher
            locale={locale}
            labels={{
              label: t.header.languageLabel,
              current: t.header.currentLanguage,
            }}
          />

          <ThemeToggle
            labels={{ toLight: t.header.themeToLight, toDark: t.header.themeToDark }}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label={t.dashboard.topbar.notifications}
              aria-expanded={notificationsOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hairline hover:text-fg"
            >
              <Icon path={icons.bell} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
            </button>

            {notificationsOpen ? (
              <>
                <div
                  role="presentation"
                  onClick={() => setNotificationsOpen(false)}
                  className="fixed inset-0 z-40"
                />
                <div className="absolute end-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
                  <p className="text-[0.8125rem] font-medium text-fg">
                    {t.dashboard.topbar.notifications}
                  </p>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-subtle">
                    {t.dashboard.topbar.noNotifications}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
