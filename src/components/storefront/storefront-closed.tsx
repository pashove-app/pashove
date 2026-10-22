import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Boutique suspendue.
 *
 * Un écran d'information, pas un 404 : la boutique existe, elle est en pause.
 * Aucune donnée de la boutique n'est lue ni affichée — l'état public ne dit
 * que ce qu'il faut pour comprendre.
 */
export function StorefrontClosed({ t }: { t: Dictionary }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300">
            <Icon path={icons.clock} className="h-6 w-6" strokeWidth={1.8} />
          </span>

          <h1 className="mt-6 text-[1.6rem] font-semibold tracking-[-0.03em] text-balance text-fg">
            {t.storefront.closedTitle}
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
            {t.storefront.closedText}
          </p>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center">
        <a
          href="https://pashove.com"
          className="text-[0.6875rem] text-faint transition-colors hover:text-muted"
        >
          {t.storefront.poweredBy}
        </a>
      </footer>
    </div>
  );
}
