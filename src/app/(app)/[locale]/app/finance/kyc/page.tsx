import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KycForm } from "@/components/finance/kyc-form";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getKycStatus } from "@/lib/kyc/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.finance.kycTitle };
}

export default async function KycPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { locale: raw } = await params;
  const { submitted } = await searchParams;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [status, t] = await Promise.all([
    getKycStatus(store.id),
    getDictionary(locale),
  ]);

  const labels = t.dashboard.finance;
  const tag = LOCALE_META[locale].tag;
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(
          new Date(value),
        )
      : null;

  const pending =
    status.status === "submitted" || status.status === "under_review";
  const approved = status.status === "approved";
  const needsResubmission =
    status.status === "rejected" || status.status === "resubmission_required";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={path(locale, "/app/finance")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.backToFinance}
      </Link>

      <div className="mt-5">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.kycTitle}
        </h1>
        <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {labels.kycSubtitle}
        </p>
      </div>

      {submitted ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
          {labels.kycSubmittedFlash}
        </p>
      ) : null}

      {pending ? (
        <section className="mt-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-2.5 py-1 text-[0.6875rem] font-medium text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {labels.kycStatusPending}
          </span>
          <h2 className="mt-4 text-[1.0625rem] font-medium text-fg">
            {labels.kycPendingTitle}
          </h2>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">
            {labels.kycPendingText}
          </p>
          {status.submittedAt ? (
            <p className="mt-3 text-[0.75rem] text-faint">
              {labels.kycSubmittedOn.replace("{date}", date(status.submittedAt) ?? "")}
            </p>
          ) : null}
        </section>
      ) : approved ? (
        <section className="mt-6 rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[0.6875rem] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {labels.kycStatusApproved}
          </span>
          <h2 className="mt-4 text-[1.0625rem] font-medium text-fg">
            {labels.kycApprovedTitle}
          </h2>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">
            {labels.kycApprovedText}
          </p>
          {status.reviewedAt ? (
            <p className="mt-3 text-[0.75rem] text-faint">
              {labels.kycReviewedOn.replace("{date}", date(status.reviewedAt) ?? "")}
            </p>
          ) : null}
          <ButtonLink
            href={path(locale, "/app/finance/payouts/new")}
            size="pill"
            className="mt-5"
          >
            <Icon path={icons.wallet} className="h-4 w-4" strokeWidth={1.8} />
            {labels.newPayout}
          </ButtonLink>
        </section>
      ) : (
        <>
          <div className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-medium text-fg">
              {labels.kycIntroTitle}
            </h2>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
              {labels.kycIntroText}
            </p>
            <ul className="mt-3 space-y-1.5 text-[0.8125rem] text-subtle">
              {[labels.kycPoint1, labels.kycPoint2, labels.kycPoint3].map(
                (point) => (
                  <li key={point} className="flex items-start gap-2">
                    <Icon path={icons.check} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.4} />
                    {point}
                  </li>
                ),
              )}
            </ul>
          </div>

          <KycForm
            t={t}
            locale={locale}
            defaultCountry={store.country}
            rejectionReason={status.rejectionReason}
            needsResubmission={needsResubmission}
          />
        </>
      )}
    </div>
  );
}
