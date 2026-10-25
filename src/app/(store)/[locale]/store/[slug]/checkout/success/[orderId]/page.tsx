import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { loadStorefront } from "@/lib/storefront/queries";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type PublicOrder = {
  id: string;
  number: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  currency: string;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  customerName: string;
  country: string;
  city: string;
  address: string;
  extra: string | null;
  notes: string | null;
  items: {
    name: string;
    variantLabel: string | null;
    sku: string | null;
    imageKey: string | null;
    productType: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; orderId: string }>;
}) {
  const { locale: raw, slug, orderId } = await params;
  if (!isLocale(raw) || !UUID_PATTERN.test(orderId)) notFound();
  const locale = resolveLocale(raw);

  const { store } = await loadStorefront(slug);
  if (!store) notFound();

  const t = await getDictionary(locale);
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_order", {
    p_slug: slug,
    p_token: orderId,
  });

  const order = data as PublicOrder | null;
  if (!order || order.paymentStatus !== "paid") notFound();

  const tag = LOCALE_META[locale].tag;
  const money = (amount: number) => formatMoney(amount, order.currency, tag);

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-12 sm:py-16">
          <div className="mx-auto w-full max-w-2xl">
            <div className="rounded-3xl border border-border bg-surface p-6 text-center sm:p-9">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <Icon path={icons.check} className="h-8 w-8" strokeWidth={2.2} />
              </span>
              <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
                {t.storefront.checkoutSuccessTitle}
              </h1>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {t.storefront.checkoutSuccessText}
              </p>
              <p className="mt-4 inline-flex rounded-full bg-hairline px-4 py-1.5 text-[0.8125rem] font-medium text-body">
                {t.storefront.checkoutOrderNumber.replace(
                  "{number}",
                  String(order.number),
                )}
              </p>
            </div>

            <section className="mt-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {t.storefront.checkoutItemsTitle}
              </h2>
              <ul className="mt-3 divide-y divide-hairline">
                {order.items.map((item, index) => (
                  <li key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-[0.875rem] font-medium text-fg">{item.name}</p>
                      {item.variantLabel ? (
                        <p className="mt-0.5 text-[0.75rem] text-subtle">{item.variantLabel}</p>
                      ) : null}
                      <p className="mt-0.5 text-[0.75rem] text-faint">
                        {t.storefront.quantity} : {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-[0.875rem] font-medium tabular-nums text-fg">
                      {money(item.lineTotal)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-3 space-y-2 border-t border-hairline pt-3 text-[0.875rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">{t.storefront.subtotal}</dt>
                  <dd className="tabular-nums text-body">{money(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">{t.storefront.shipping}</dt>
                  <dd className="tabular-nums text-body">
                    {order.shipping === 0 ? t.storefront.freeShipping : money(order.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-hairline pt-2 text-[1rem] font-medium">
                  <dt className="text-fg">{t.storefront.total}</dt>
                  <dd className="tabular-nums text-fg">{money(order.total)}</dd>
                </div>
              </dl>
            </section>

            <section className="mt-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {t.storefront.checkoutDeliveryTitle}
              </h2>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-body">
                {order.customerName}
                <br />
                {order.address}
                {order.extra ? (
                  <>
                    <br />
                    {order.extra}
                  </>
                ) : null}
                <br />
                {order.city}, {order.country}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-500/[0.08] px-3 py-1.5 text-[0.75rem] font-medium text-accent">
                <Icon path={icons.bag} className="h-3.5 w-3.5" strokeWidth={2} />
                {t.storefront.checkoutCodLabel}
              </p>
            </section>

            <div className="mt-6 text-center">
              <Link
                href={path(locale, `/store/${slug}`)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg"
              >
                {t.storefront.checkoutContinue}
              </Link>
            </div>
          </div>
        </Container>
      </main>
    </StorefrontShell>
  );
}
