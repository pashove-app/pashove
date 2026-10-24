import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import { interpolate, type Dictionary } from "@/i18n/get-dictionary";

/**
 * Bandeau d'accueil : la marque, le marchand, une action.
 *
 * Même aplat que le panneau d'onboarding, pour que l'espace marchand et la
 * vitrine se répondent. Le chevron en filigrane est un décor, pas un bouton.
 */
export function WelcomeBanner({
  t,
  locale,
  firstName,
}: {
  t: Dictionary;
  locale: Locale;
  firstName: string;
}) {
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
        className="absolute -end-4 top-1/2 w-44 -translate-y-1/2 text-white/[0.12] sm:w-56"
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

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.035em] text-balance text-white sm:text-[2rem]">
            {interpolate(t.dashboard.home.greeting, { name: firstName })}
          </h1>
          <p className="mt-2 max-w-lg text-[0.875rem] leading-relaxed text-white/75 sm:text-[0.9375rem]">
            {t.dashboard.home.subtitle}
          </p>
        </div>

        <Link
          href={path(locale, "/app/products/new")}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-5 text-[0.875rem] font-medium text-[#0a1330] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45)] transition-all hover:bg-white/95 active:scale-[0.985] sm:self-auto"
        >
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
          {t.dashboard.home.addProduct}
        </Link>
      </div>
    </section>
  );
}
