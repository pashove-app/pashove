import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";

/** État de la 2FA, avec un lien vers sa gestion dans la sécurité du compte. */
export function TwoFactorCard({
  t,
  locale,
  enabled,
}: {
  t: Dictionary;
  locale: Locale;
  enabled: boolean;
}) {
  const labels = t.dashboard.finance;

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
          <Icon path={icons.shield} className="h-5 w-5" strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.twoFactorTitle}
          </h2>
          <span
            className={
              enabled
                ? "mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[0.6875rem] font-medium text-emerald-600 dark:text-emerald-400"
                : "mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-2.5 py-0.5 text-[0.6875rem] font-medium text-amber-600 dark:text-amber-400"
            }
          >
            <span
              aria-hidden="true"
              className={
                enabled
                  ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                  : "h-1.5 w-1.5 rounded-full bg-amber-500"
              }
            />
            {enabled ? labels.twoFactorActive : labels.twoFactorInactive}
          </span>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
            {enabled ? labels.twoFactorHelpActive : labels.twoFactorHelpInactive}
          </p>

          <ButtonLink
            href={path(locale, "/auth/security")}
            variant="outline"
            size="pill"
            className="mt-4"
          >
            <Icon path={icons.shield} className="h-4 w-4" strokeWidth={1.8} />
            {labels.twoFactorCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
