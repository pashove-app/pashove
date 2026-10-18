import { ButtonLink, Icon, icons, type IconKey } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import { interpolate, type Dictionary } from "@/i18n/get-dictionary";

/**
 * Page commune des sections qui n'existent pas encore.
 *
 * Elle dit ce qu'elle est — une section à venir — plutôt que d'afficher un
 * écran vide ou des données inventées.
 */
export function UnderConstruction({
  t,
  locale,
  section,
  icon,
}: {
  t: Dictionary;
  locale: Locale;
  section: string;
  icon: IconKey;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface text-accent">
        <Icon path={icons[icon]} className="h-6 w-6" strokeWidth={1.6} />
      </span>

      <h1 className="mt-6 text-[1.5rem] font-semibold tracking-[-0.03em] text-balance text-fg">
        {interpolate(t.dashboard.construction.title, { section })}
      </h1>
      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-muted">
        {t.dashboard.construction.text}
      </p>

      <ButtonLink href={path(locale, "/app")} variant="outline" className="mt-7">
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t.dashboard.construction.back}
      </ButtonLink>
    </div>
  );
}
