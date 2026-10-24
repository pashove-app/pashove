import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PayoutList } from "@/components/finance/payout-list";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStoreBalances, listPayouts } from "@/lib/finance/queries";
import { formatMoney } from "@/lib/money";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.finance.payoutsTitle };
}

/** Historique des demandes de retrait. */
export default async function PayoutsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ created?: string; cancelled?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { created, cancelled } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [payouts, balances, t] = await Promise.all([
    listPayouts(store.id),
    getStoreBalances(store.id),
    getDictionary(locale),
  ]);

  const labels = t.dashboard.finance;
  const localeTag = LOCALE_META[locale].tag;
  const flash = cancelled
    ? labels.payoutFlashCancelled
    : created
      ? labels.payoutFlashCreated
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={path(locale, "/app/finance")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.backToFinance}
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.payoutsTitle}
          </h1>
          <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
            {labels.payoutsSubtitle}
          </p>
        </div>

        <ButtonLink href={path(locale, "/app/finance/payouts/new")} size="pill">
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
          {labels.newPayout}
        </ButtonLink>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
            {labels.availableLabel}
          </p>
          <p className="mt-2 text-[1.5rem] font-semibold tabular-nums text-fg">
            {formatMoney(balances.available, store.currency, localeTag)}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
            {labels.payoutReservedLabel}
          </p>
          <p className="mt-2 text-[1.5rem] font-semibold tabular-nums text-fg">
            {formatMoney(balances.reserved, store.currency, localeTag)}
          </p>
        </div>
      </div>

      {flash ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
          {flash}
        </p>
      ) : null}

      <PayoutList t={t} locale={locale} payouts={payouts} />
    </div>
  );
}
