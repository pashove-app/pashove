import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Liste vide : une phrase, une action, aucun faux produit. */
export function ProductEmptyState({
  t,
  locale,
}: {
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface text-faint">
        <Icon path={icons.tag} className="h-6 w-6" strokeWidth={1.6} />
      </span>

      <p className="mt-4 text-[1rem] font-medium text-fg">
        {t.dashboard.products.emptyTitle}
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-[0.875rem] leading-relaxed text-muted">
        {t.dashboard.products.emptyText}
      </p>

      <ButtonLink
        href={path(locale, "/app/products/new")}
        className="mt-6"
      >
        <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
        {t.dashboard.products.addFirst}
      </ButtonLink>
    </div>
  );
}
