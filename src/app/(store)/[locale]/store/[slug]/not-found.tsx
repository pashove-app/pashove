import { headers } from "next/headers";
import { Icon, icons } from "@/components/ui/primitives";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Boutique introuvable — slug inconnu ou encore en brouillon.
 *
 * Le proxy annonce la langue de l'URL dans `x-pashove-locale` ; un fichier
 * `not-found` ne reçoit pas les segments de route, c'est donc par là que la
 * langue nous parvient.
 */
export default async function StoreNotFound() {
  const headerLocale = (await headers()).get("x-pashove-locale");
  const locale = isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const t = await getDictionary(locale);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-16 text-center">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-faint">
        404
      </p>

      <h1 className="mt-3 text-[1.5rem] font-semibold tracking-[-0.03em] text-balance text-fg">
        {t.storefront.notFoundTitle}
      </h1>
      <p className="mt-2 max-w-sm text-[0.875rem] leading-relaxed text-muted">
        {t.storefront.notFoundText}
      </p>

      <a
        href="https://pashove.com"
        className="mt-7 inline-flex items-center gap-2 rounded-full border border-border-soft bg-hairline px-5 py-2.5 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t.storefront.backHome}
      </a>
    </div>
  );
}
