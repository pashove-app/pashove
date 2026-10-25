import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DiscountForm } from "@/components/discounts/discount-form";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getDiscount } from "@/lib/discounts/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.discounts.editTitle };
}

/** Modification d'un code promo. */
export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const discount = await getDiscount(id, store.id);
  if (!discount) notFound();

  const t = await getDictionary(locale);
  const labels = t.dashboard.discounts;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={path(locale, "/app/discounts")} label={labels.backToDiscounts} />

      <div className="mt-4">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.editTitle}
        </h1>
        <p className="mt-1 max-w-xl text-[0.875rem] leading-relaxed text-muted">
          {labels.editSubtitle}
        </p>
      </div>

      <div className="mt-6">
        <DiscountForm
          t={t}
          locale={locale}
          currency={store.currency}
          initial={discount}
        />
      </div>
    </div>
  );
}
