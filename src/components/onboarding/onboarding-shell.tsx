import type { ReactNode } from "react";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Coquille de l'onboarding, en deux colonnes.
 *
 * À gauche le parcours — tout ce que le marchand a à faire. À droite un
 * panneau de marque qui ne porte aucune information : il donne au premier
 * réglage l'allure d'un produit fini plutôt que d'un formulaire administratif.
 * Sous `lg`, le panneau disparaît : la hauteur qu'il coûterait vaut mieux
 * laissée au formulaire.
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
    <div className="min-h-dvh bg-bg">
      <div className="grid min-h-dvh gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <section className="flex min-w-0 flex-col px-1 lg:px-9">
          <header className="flex items-center justify-between gap-3 pt-2">
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

          <main className="w-full max-w-xl flex-1 py-10 sm:py-14">{children}</main>
        </section>

        <aside className="relative hidden overflow-hidden rounded-3xl lg:block">
          <BrandPanel t={t} />
        </aside>
      </div>
    </div>
  );
}

/** Panneau de marque : dégradé, trame, chevron en filigrane, une phrase. */
function BrandPanel({ t }: { t: Dictionary }) {
  return (
    <>
      <div className="brand-panel absolute inset-0" aria-hidden="true" />
      <div className="bg-grid-brand absolute inset-0" aria-hidden="true" />

      <div
        aria-hidden="true"
        className="absolute -right-[10%] -top-[14%] aspect-square w-[60%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),transparent)] blur-[30px]"
      />

      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="absolute end-[-4%] top-1/2 w-[76%] max-w-[35rem] -translate-y-1/2 text-white/[0.15]"
      >
        <path
          d="M10.5 19.5 20 10l9.5 9.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 28 20 21.5 26.5 28"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="absolute inset-x-6 bottom-6 rounded-[1.125rem] border border-white/20 bg-white/[0.14] p-5 text-white backdrop-blur-md">
        <p className="text-[0.9375rem] font-medium leading-snug tracking-[-0.01em] text-balance">
          {t.onboarding.panelTitle}
        </p>
        <span className="mt-2 block text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/70">
          {t.onboarding.panelKicker}
        </span>
      </div>
    </>
  );
}
