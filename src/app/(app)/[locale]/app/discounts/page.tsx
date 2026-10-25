import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DiscountList } from "@/components/discounts/discount-list";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listDiscounts } from "@/lib/discounts/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.discounts.title };
}

/** Liste des codes promo de la boutique. */
export default async function DiscountsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { created, updated } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const labels = t.dashboard.discounts;
  const discounts = await listDiscounts(store.id);

  const countLabel = (discounts.length === 1 ? labels.count : labels.countPlural).replace(
    "{count}",
    String(discounts.length),
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.title}
          </h1>
          <p className="mt-1 text-[0.875rem] text-muted">{countLabel}</p>
        </div>

        <ButtonLink href={path(locale, "/app/discounts/new")}>
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
          {labels.newDiscount}
        </ButtonLink>
      </div>

      <p className="mt-2 hidden max-w-xl text-[0.875rem] leading-relaxed text-subtle sm:block">
        {labels.subtitle}
      </p>

      {created || updated ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
          {updated ? labels.flashUpdated : labels.flashCreated}
        </p>
      ) : null}

      {discounts.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-border bg-surface px-6 py-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-accent">
            <Icon path={icons.percent} className="h-6 w-6" strokeWidth={1.6} />
          </span>

          <h2 className="mt-5 text-[1.0625rem] font-medium text-fg">
            {labels.emptyTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[0.875rem] leading-relaxed text-subtle">
            {labels.emptyText}
          </p>

          <ButtonLink
            href={path(locale, "/app/discounts/new")}
            className="mt-5"
            size="sm"
          >
            <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
            {labels.emptyCta}
          </ButtonLink>
        </div>
      ) : (
        <DiscountList
          t={t}
          locale={locale}
          currency={store.currency}
          discounts={discounts}
        />
      )}
    </div>
  );
}
