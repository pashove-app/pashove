import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
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
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/[0.12] text-accent">
          <Icon path={icons.shield} className="h-5 w-5" strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.twoFactorTitle}
          </h2>
          <p
            className={
              enabled
                ? "mt-0.5 text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400"
                : "mt-0.5 text-[0.75rem] font-medium text-amber-600 dark:text-amber-400"
            }
          >
            {enabled ? labels.twoFactorActive : labels.twoFactorInactive}
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
            {enabled ? labels.twoFactorHelpActive : labels.twoFactorHelpInactive}
          </p>

          <Link
            href={path(locale, "/auth/security")}
            className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-accent transition-colors hover:text-accent-soft"
          >
            {labels.twoFactorCta}
            <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
