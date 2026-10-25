import { BackLink } from "@/components/ui/back-link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PayoutMethodList } from "@/components/finance/payout-method-list";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listPayoutMethods } from "@/lib/finance/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.finance.methodsTitle };
}

/** Méthodes de retrait du marchand. */
export default async function PayoutMethodsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    default?: string;
  }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { created, updated, deleted, default: madeDefault } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [methods, t] = await Promise.all([
    listPayoutMethods(store.id),
    getDictionary(locale),
  ]);

  const labels = t.dashboard.finance;
  const flash = deleted
    ? labels.flashMethodDeleted
    : updated
      ? labels.flashMethodUpdated
      : created
        ? labels.flashMethodCreated
        : madeDefault
          ? labels.flashMethodDefault
          : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={path(locale, "/app/finance")} label={labels.backToFinance} />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.methodsTitle}
          </h1>
          <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
            {labels.methodsSubtitle}
          </p>
        </div>

        <ButtonLink href={path(locale, "/app/finance/methods/new")} size="pill">
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
          {labels.addMethod}
        </ButtonLink>
      </div>

      {flash ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
          {flash}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <ButtonLink
          href={path(locale, "/app/finance")}
          variant="ghost"
          size="pill"
        >
          {labels.backToFinance}
        </ButtonLink>
        <ButtonLink
          href={path(locale, "/app/finance/security")}
          variant="outline"
          size="pill"
        >
          <Icon path={icons.lock} className="h-4 w-4" strokeWidth={1.8} />
          {labels.securityLink}
        </ButtonLink>
      </div>

      <PayoutMethodList t={t} locale={locale} methods={methods} />
    </div>
  );
}
