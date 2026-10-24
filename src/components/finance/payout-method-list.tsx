import Link from "next/link";
import { DeletePayoutMethodButton } from "@/components/finance/delete-payout-method-button";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { setDefaultPayoutMethodAction } from "@/lib/finance/payout-actions";
import { PROVIDER_LABELS, type PayoutProvider } from "@/lib/finance/providers";
import type { PayoutMethod } from "@/lib/finance/queries";

/** Les méthodes de retrait actives. */
export function PayoutMethodList({
  t,
  locale,
  methods,
}: {
  t: Dictionary;
  locale: Locale;
  methods: PayoutMethod[];
}) {
  const labels = t.dashboard.finance;

  if (methods.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-accent">
          <Icon path={icons.wallet} className="h-6 w-6" strokeWidth={1.6} />
        </span>

        <h2 className="mt-5 text-[1.0625rem] font-medium text-fg">
          {labels.emptyMethodsTitle}
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-[0.875rem] leading-relaxed text-subtle">
          {labels.emptyMethodsText}
        </p>

        <ButtonLink
          href={path(locale, "/app/finance/methods/new")}
          className="mt-5"
          size="sm"
        >
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
          {labels.emptyMethodsCta}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {methods.map((method) => (
        <section
          key={method.id}
          className={cn(
            "rounded-2xl border bg-surface p-4 sm:p-5",
            method.is_default ? "border-brand-500/35" : "border-border",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/[0.12] text-accent">
                <Icon path={icons.wallet} className="h-5 w-5" strokeWidth={1.7} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[0.9375rem] font-medium text-fg">
                    {PROVIDER_LABELS[method.provider as PayoutProvider] ??
                      method.provider}
                  </p>
                  {method.is_default ? (
                    <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[0.625rem] font-semibold text-accent">
                      {labels.defaultBadge}
                    </span>
                  ) : null}
                </div>

                <p className="mt-0.5 text-[0.8125rem] text-muted">
                  {method.account_name}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.75rem] text-faint">
                  <span className="font-mono" dir="ltr">
                    •••• {method.account_last4}
                  </span>
                  <span>·</span>
                  <span>
                    {t.countries_names[
                      method.country as keyof Dictionary["countries_names"]
                    ] ?? method.country}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={path(locale, `/app/finance/methods/${method.id}`)}
                aria-label={labels.editMethod}
                title={labels.editMethod}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
              >
                <Icon path={icons.pencil} className="h-4 w-4" strokeWidth={1.6} />
              </Link>

              <DeletePayoutMethodButton
                locale={locale}
                methodId={method.id}
                labels={labels}
              />
            </div>
          </div>

          {!method.is_default ? (
            <form action={setDefaultPayoutMethodAction} className="mt-3 border-t border-hairline pt-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="methodId" value={method.id} />
              <button
                type="submit"
                className="text-[0.75rem] font-medium text-accent transition-colors hover:text-accent-soft"
              >
                {labels.setDefault}
              </button>
            </form>
          ) : null}
        </section>
      ))}
    </div>
  );
}
