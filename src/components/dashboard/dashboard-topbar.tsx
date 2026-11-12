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
import type { AppNotification } from "@/lib/notifications/queries";

/**
 * Barre supérieure : recherche, notifications, thème et langue.
 *
 * Le logo n'apparaît que sur mobile — sur desktop, il vit dans la sidebar de
 * marque. L'avatar a quitté la topbar : le profil est dans la sidebar.
 */
export function DashboardTopbar({
  t,
  locale,
  notifications,
  unreadNotifications,
}: {
  t: Dictionary;
  locale: Locale;
  notifications: AppNotification[];
  unreadNotifications: number;
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
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hairline hover:text-fg"
            >
              <Icon path={icons.bell} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
              {unreadNotifications > 0 ? (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[0.5625rem] font-semibold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <>
                <div
                  role="presentation"
                  onClick={() => setNotificationsOpen(false)}
                  className="fixed inset-0 z-40"
                />
                <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-surface p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <p className="text-[0.8125rem] font-medium text-fg">
                      {t.dashboard.topbar.notifications}
                    </p>
                    <Link
                      href={path(locale, "/app/notifications")}
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[0.6875rem] font-medium text-accent hover:text-accent-soft"
                    >
                      Tout voir
                    </Link>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="px-1 py-3 text-[0.8125rem] leading-relaxed text-subtle">
                      {t.dashboard.topbar.noNotifications}
                    </p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <li key={notification.id}>
                          <Link
                            href={notification.href ?? path(locale, "/app/notifications")}
                            onClick={() => setNotificationsOpen(false)}
                            className="block rounded-lg px-2 py-2 transition-colors hover:bg-hairline"
                          >
                            <span className="flex items-start gap-2">
                              <span
                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                  notification.readAt ? "bg-transparent" : "bg-brand-500"
                                }`}
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-[0.75rem] font-medium text-fg">
                                  {notification.title}
                                </span>
                                {notification.body ? (
                                  <span className="mt-0.5 line-clamp-2 block text-[0.6875rem] leading-relaxed text-subtle">
                                    {notification.body}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
