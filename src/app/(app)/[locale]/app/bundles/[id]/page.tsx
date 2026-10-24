import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BundleForm } from "@/components/bundles/bundle-form";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getBundle, listBundleOptions } from "@/lib/bundles/queries";
import { currentStore } from "@/lib/stores/queries";
import { publicUrl } from "@/lib/r2/media";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  const store = await currentStore();
  const bundle = store
    ? await getBundle(id, store.id, store.currency, LOCALE_META[locale].tag)
    : null;

  return { title: bundle?.name ?? t.dashboard.bundles.editTitle };
}

/** Édition d'un paquet. */
export default async function EditBundlePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [bundle, options] = await Promise.all([
    getBundle(id, store.id, store.currency, LOCALE_META[locale].tag),
    listBundleOptions(store.id, store.currency, LOCALE_META[locale].tag),
  ]);

  if (!bundle) notFound();

  const t = await getDictionary(locale);

  return (
    <BundleForm
      t={t}
      locale={locale}
      currency={store.currency}
      initial={bundle}
      options={options}
      initialCoverUrl={
        bundle.image?.object_key ? publicUrl(bundle.image.object_key) : null
      }
    />
  );
}
