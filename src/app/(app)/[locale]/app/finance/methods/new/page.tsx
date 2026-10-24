import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PayoutMethodForm } from "@/components/finance/payout-method-form";
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

  return { title: t.dashboard.finance.newMethodTitle };
}

/** Ajout d'une méthode de retrait. */
export default async function NewPayoutMethodPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [methods, t] = await Promise.all([
    listPayoutMethods(store.id),
    getDictionary(locale),
  ]);

  return (
    <PayoutMethodForm
      t={t}
      locale={locale}
      initial={null}
      defaultCountry={store.country}
      makeDefault={methods.length === 0}
    />
  );
}
