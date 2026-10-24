import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CollectionForm } from "@/components/collections/collection-form";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getCollection,
  listCollectionProducts,
} from "@/lib/collections/queries";
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
  const collection = store ? await getCollection(id, store.id) : null;

  return {
    title: collection?.name ?? t.dashboard.collections.editTitle,
  };
}

/** Édition d'une collection. */
export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [collection, products] = await Promise.all([
    getCollection(id, store.id),
    listCollectionProducts(store.id, store.currency, LOCALE_META[locale].tag),
  ]);

  if (!collection) notFound();

  const t = await getDictionary(locale);

  return (
    <CollectionForm t={t} locale={locale} initial={collection} products={products} />
  );
}
