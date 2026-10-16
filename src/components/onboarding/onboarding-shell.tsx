import type { ReactNode } from "react";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Icon, icons } from "@/components/ui/primitives";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Coquille de l'onboarding.
 *
 * Plus sobre que celle de l'authentification : pas de volet de marque, l'écran
 * appartient au marchand et à ce qu'il est en train de construire. Ne restent
 * que la langue, le thème, et la mention de sécurité reprise partout ailleurs.
 */
export function OnboardingShell({
  t,
  locale,
  children,
}: {
  t: Dictionary;
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-8">
        <PashoveLogo />

        <div className="flex items-center gap-2">
          <LocaleSwitcher
            locale={locale}
            labels={{ label: t.header.languageLabel, current: t.header.currentLanguage }}
          />
          <ThemeToggle
            labels={{ toLight: t.header.themeToLight, toDark: t.header.themeToDark }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[34rem] flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>

      <footer className="px-5 pb-8 sm:px-8">
        <p className="flex items-center justify-center gap-2 text-center text-[0.6875rem] text-faint">
          <Icon path={icons.shield} className="h-3.5 w-3.5 shrink-0 text-accent" />
          {t.footer.secureLine}
        </p>
      </footer>
    </div>
  );
}
