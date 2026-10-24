import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CollectionForm } from "@/components/collections/collection-form";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listCollectionProducts } from "@/lib/collections/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.collections.newTitle };
}

/** Création d'une collection. */
export default async function NewCollectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const products = await listCollectionProducts(
    store.id,
    store.currency,
    LOCALE_META[locale].tag,
  );

  return (
    <CollectionForm
      t={t}
      locale={locale}
      initial={null}
      products={products}
      initialCoverUrl={null}
    />
  );
}
