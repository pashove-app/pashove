import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ThemeEditor } from "@/components/theme/theme-editor";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStoreTheme } from "@/lib/theme/queries";
import { listStoreProducts } from "@/lib/storefront/products";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import { currentMembership } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ThemeEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const [theme, t, products] = await Promise.all([
    getStoreTheme(membership.store.id),
    getDictionary(locale),
    listStoreProducts(membership.store.id),
  ]);

  const previewProducts = products.slice(0, 4).map((product) => ({
    name: product.name,
    priceLabel: formatMoney(
      product.price_amount,
      membership.store.currency,
      locale === "en" ? "en-US" : "fr-FR",
    ),
    imageUrl: product.images[0]
      ? publicUrl(product.images[0].object_key)
      : product.description_image
        ? publicUrl(product.description_image.object_key)
        : null,
  }));

  return (
    <ThemeEditor
      storeId={membership.store.id}
      slug={membership.store.slug}
      storeName={membership.store.name}
      products={previewProducts}
      locale={locale}
      initialTheme={theme}
      labels={t.dashboard.theme}
    />
  );
}
