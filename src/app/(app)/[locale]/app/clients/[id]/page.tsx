import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { decodeCustomerKey } from "@/lib/customers/identity";
import { getCustomerOrders } from "@/lib/customers/queries";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Fiche d'un client, dérivée de ses commandes. */
export default async function CustomerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const key = decodeCustomerKey(id);
  if (!key) notFound();

  const orders = await getCustomerOrders(store.id, key);
  if (orders.length === 0) notFound();

  const t = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <CustomerDetail
        t={t}
        locale={locale}
        currency={store.currency}
        orders={orders}
      />
    </div>
  );
}
