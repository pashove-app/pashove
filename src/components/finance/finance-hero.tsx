import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Bandeau de la Finance, dans le même langage que l'accueil :
 * dégradé bleu, titre blanc, actions en pilules claires.
 */
export function FinanceHero({
  t,
  locale,
}: {
  t: Dictionary;
  locale: Locale;
}) {
  const labels = t.dashboard.finance;

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] ring-1 ring-white/10">
      <div
        aria-hidden="true"
        className="absolute inset-0 [background:radial-gradient(120%_140%_at_10%_-10%,#7b9cff_0%,transparent_52%),linear-gradient(115deg,#3c63ff_0%,#2243f0_42%,#121f9c_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06),transparent_45%)]"
      />

      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="absolute -end-5 top-1/2 w-40 -translate-y-1/2 text-white/[0.12] sm:w-56"
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

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-9">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[2.25rem]">
            {labels.title}
          </h1>
          <p className="mt-2 max-w-xl text-[0.875rem] leading-relaxed text-white/75 sm:text-[0.9375rem]">
            {labels.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <ButtonLink
            href={path(locale, "/app/finance/methods")}
            variant="light"
            size="pill"
            className="w-full sm:w-auto"
          >
            <Icon path={icons.wallet} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
            {labels.methodsLink}
          </ButtonLink>

          <ButtonLink
            href={path(locale, "/app/finance/security")}
            variant="light"
            size="pill"
            className="w-full sm:w-auto"
          >
            <Icon path={icons.lock} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
            {labels.securityLink}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
