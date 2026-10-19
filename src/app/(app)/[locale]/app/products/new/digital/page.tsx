import { NewProductScreen } from "@/components/products/new-product-screen";
import { resolveLocale } from "@/i18n/config";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;

  return <NewProductScreen locale={resolveLocale(raw)} type="digital" />;
}
