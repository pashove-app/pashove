import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PayoutMethodForm } from "@/components/finance/payout-method-form";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPayoutMethod } from "@/lib/finance/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  const store = await currentStore();
  const method = store ? await getPayoutMethod(id, store.id) : null;

  return { title: method?.account_name ?? t.dashboard.finance.editMethodTitle };
}

/** Édition d'une méthode de retrait. */
export default async function EditPayoutMethodPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const method = await getPayoutMethod(id, store.id);
  if (!method) notFound();

  const t = await getDictionary(locale);

  return (
    <PayoutMethodForm
      t={t}
      locale={locale}
      initial={method}
      defaultCountry={store.country}
      makeDefault={false}
    />
  );
}
