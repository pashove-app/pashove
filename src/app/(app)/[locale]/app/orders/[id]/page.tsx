import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getOrderHeader } from "@/lib/orders/queries";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Emplacement du détail : remplacé au lot O2. */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const order = await getOrderHeader(id, store.id);
  if (!order) notFound();

  const t = await getDictionary(locale);
  const labels = t.dashboard.orders;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={path(locale, "/app/orders")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.backToOrders}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg">
          #{order.number}
        </h1>
        <OrderStatusBadge status={order.status} t={t} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-[0.9375rem] font-medium text-fg">
          {labels.detailSoonTitle}
        </p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
          {labels.detailSoonText}
        </p>
      </div>
    </div>
  );
}
