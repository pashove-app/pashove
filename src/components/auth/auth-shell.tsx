import type { ReactNode } from "react";
import { AuthBrandPanel } from "@/components/auth/brand-panel";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Icon, icons } from "@/components/ui/primitives";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Coquille des pages d'authentification : volet de marque à gauche,
 * formulaire à droite, sélecteurs de langue et de thème en haut à droite.
 * Le volet disparaît sous `lg`, où seul le formulaire reste.
 */
export function AuthShell({
  t,
  locale,
  children,
}: {
  t: Dictionary;
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel t={t} />

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <PashoveLogo className="lg:hidden" />
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher
              locale={locale}
              labels={{ label: t.header.languageLabel, current: t.header.currentLanguage }}
            />
            <ThemeToggle
              labels={{ toLight: t.header.themeToLight, toDark: t.header.themeToDark }}
            />
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center px-5 pb-12 pt-2 sm:px-8 lg:items-center lg:pt-0">
          <div className="w-full max-w-[27rem]">{children}</div>
        </main>

        <footer className="px-5 pb-8 sm:px-8">
          <p className="flex items-center justify-center gap-2 text-center text-[0.6875rem] text-faint">
            <Icon path={icons.shield} className="h-3.5 w-3.5 shrink-0 text-accent" />
            {t.footer.secureLine}
          </p>
        </footer>
      </div>
    </div>
  );
}
