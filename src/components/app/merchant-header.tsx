import { PashoveLogo } from "@/components/brand/pashove-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClass } from "@/components/ui/primitives";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import type { SectionProps } from "@/components/ui/types";
import { signOutAction } from "@/lib/auth/actions";

/**
 * En-tête commun de l'espace marchand : marque, langue, thème, déconnexion.
 * Partagé par le tableau de bord et les réglages, pour que la navigation ne
 * change pas d'un écran à l'autre.
 */
export function MerchantHeader({ t, locale }: SectionProps) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-5 sm:px-8">
        <PashoveLogo />

        <div className="flex items-center gap-2">
          <LocaleSwitcher
            locale={locale}
            labels={{ label: t.header.languageLabel, current: t.header.currentLanguage }}
          />
          <ThemeToggle
            labels={{ toLight: t.header.themeToLight, toDark: t.header.themeToDark }}
          />
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              {t.auth.workspaceSignOut}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
