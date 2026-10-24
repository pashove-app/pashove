import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BundleForm } from "@/components/bundles/bundle-form";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listBundleOptions } from "@/lib/bundles/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.bundles.newTitle };
}

/** Création d'un paquet. */
export default async function NewBundlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const options = await listBundleOptions(
    store.id,
    store.currency,
    LOCALE_META[locale].tag,
  );

  return (
    <BundleForm
      t={t}
      locale={locale}
      currency={store.currency}
      initial={null}
      options={options}
      initialCoverUrl={null}
    />
  );
}
