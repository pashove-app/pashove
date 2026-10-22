import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OrderDetail } from "@/components/orders/order-detail";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getOrder } from "@/lib/orders/queries";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Détail d'une commande de la boutique. */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const order = await getOrder(id, store.id);
  if (!order) notFound();

  const t = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <OrderDetail t={t} locale={locale} order={order} />
    </div>
  );
}
