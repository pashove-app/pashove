"use client";

import Link from "next/link";
import { useState } from "react";
import { useCommandPalette } from "@/components/dashboard/command-palette";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Icon, icons } from "@/components/ui/primitives";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/lib/initials";

export type Merchant = { name: string; storeName: string };

/**
 * Barre supérieure du dashboard : marque, recherche, langue, thème,
 * notifications, compte. La recherche ouvre la palette ⌘K.
 */
export function DashboardTopbar({
  t,
  locale,
  merchant,
  onOpenMenu,
}: {
  t: Dictionary;
  locale: Locale;
  merchant: Merchant;
  onOpenMenu: () => void;
}) {
  const palette = useCommandPalette();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t.dashboard.topbar.menu}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hairline hover:text-fg lg:hidden"
        >
          <Icon path={icons.menu} className="h-5 w-5" strokeWidth={1.9} />
        </button>

        <Link href={path(locale, "/app")} className="shrink-0">
          <PashoveLogo />
        </Link>

        <button
          type="button"
          onClick={palette.open}
          className={cn(
            "mx-auto hidden h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 lg:flex",
            "text-[0.875rem] text-faint transition-colors hover:border-border-strong hover:text-muted",
          )}
        >
          <Icon path={icons.search} className="h-4 w-4" strokeWidth={2} />
          <span className="min-w-0 flex-1 truncate text-start">
            {t.dashboard.topbar.search}
          </span>
          <kbd className="rounded-md border border-border-soft px-1.5 py-0.5 font-mono text-[0.625rem]">
            ⌘K
          </kbd>
        </button>

        <div className="ms-auto flex items-center gap-1 lg:ms-0">
          <button
            type="button"
            onClick={palette.open}
            aria-label={t.dashboard.topbar.search}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hairline hover:text-fg lg:hidden"
          >
            <Icon path={icons.search} className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
          </button>

          <span className="hidden sm:block">
            <LocaleSwitcher
              locale={locale}
              labels={{
                label: t.header.languageLabel,
                current: t.header.currentLanguage,
              }}
            />
          </span>

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
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                  role="presentation"
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

          <Link
            href={path(locale, "/app/settings/store")}
            aria-label={t.dashboard.topbar.account}
            className="ms-1 flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-hairline"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-[0.6875rem] font-semibold tracking-[0.02em] text-on-accent"
            >
              {initialsOf(merchant.name)}
            </span>
            <span className="hidden min-w-0 flex-col text-start sm:flex">
              <span className="max-w-[10rem] truncate text-[0.8125rem] font-medium leading-tight text-fg">
                {merchant.name}
              </span>
              <span className="max-w-[10rem] truncate text-[0.6875rem] leading-tight text-faint">
                {merchant.storeName}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
