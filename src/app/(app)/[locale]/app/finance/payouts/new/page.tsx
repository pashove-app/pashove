import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PayoutForm } from "@/components/finance/payout-form";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getPayoutSecurity,
  getStoreBalances,
  listPayoutMethods,
} from "@/lib/finance/queries";
import { getKycStatus, kycAllowsPayout } from "@/lib/kyc/queries";
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

  return { title: t.dashboard.finance.newPayout };
}

/** Nouvelle demande de retrait. */
export default async function NewPayoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [methods, security, balances, kyc, t] = await Promise.all([
    listPayoutMethods(store.id),
    getPayoutSecurity(store.id),
    getStoreBalances(store.id),
    getKycStatus(store.id),
    getDictionary(locale),
  ]);

  const labels = t.dashboard.finance;
  const tag = LOCALE_META[locale].tag;
  const kycReady = kycAllowsPayout(kyc.status);
  const ready = methods.length > 0 && security.hasPin && kycReady;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={path(locale, "/app/finance/payouts")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.payoutBack}
      </Link>

      <div className="mt-5">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.newPayout}
        </h1>
        <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {labels.newPayoutSubtitle}
        </p>
      </div>

      {!ready ? (
        <div className="mt-7 space-y-3.5">
          {methods.length === 0 ? (
            <section className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {labels.payoutNeedMethodTitle}
              </h2>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
                {labels.payoutNeedMethodText}
              </p>
              <ButtonLink
                href={path(locale, "/app/finance/methods/new")}
                size="pill"
                className="mt-4"
              >
                <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
                {labels.payoutNeedMethodCta}
              </ButtonLink>
            </section>
          ) : null}

          {!security.hasPin ? (
            <section className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {labels.payoutNeedPinTitle}
              </h2>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
                {labels.payoutNeedPinText}
              </p>
              <ButtonLink
                href={path(locale, "/app/finance/security")}
                size="pill"
                className="mt-4"
              >
                <Icon path={icons.lock} className="h-4 w-4" strokeWidth={1.8} />
                {labels.payoutNeedPinCta}
              </ButtonLink>
            </section>
          ) : null}

          {!kycReady ? (
            <section className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {labels.payoutNeedKycTitle}
              </h2>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
                {labels.payoutNeedKycText}
              </p>
              <ButtonLink
                href={path(locale, "/app/finance/kyc")}
                size="pill"
                className="mt-4"
              >
                <Icon path={icons.shield} className="h-4 w-4" strokeWidth={1.8} />
                {labels.payoutNeedKycCta}
              </ButtonLink>
            </section>
          ) : null}
        </div>
      ) : (
        <>
          {kyc.status !== "approved" ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3.5">
              <Icon path={icons.shield} className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={1.8} />
              <p className="text-[0.75rem] leading-relaxed text-muted">
                {labels.payoutKycPendingNote}
              </p>
            </div>
          ) : null}

          <PayoutForm
            t={t}
            locale={locale}
            availableLabel={formatMoney(balances.available, store.currency, tag)}
            minLabel={formatMoney(1000, store.currency, tag)}
            methods={methods}
            idempotencyKey={randomUUID()}
          />
        </>
      )}
    </div>
  );
}
