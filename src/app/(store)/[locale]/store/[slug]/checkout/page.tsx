import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { Container } from "@/components/storefront/container";
import { DiscountField } from "@/components/storefront/discount-field";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { LOCALE_META, isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { readCart } from "@/lib/storefront/cart";
import { getCheckoutPaymentMethods, paymentOptions } from "@/lib/payments/queries";
import { loadStorefront } from "@/lib/storefront/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = resolveLocale(raw);

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const cart = await readCart(LOCALE_META[locale].tag);
  if (!cart || cart.items.length === 0) {
    redirect(path(locale, `/store/${slug}/cart`));
  }

  const hasNonPhysical = cart.items.some(
    (item) => item.productType === "digital" || item.productType === "service",
  );
  const paymentMethods = await getCheckoutPaymentMethods(
    slug,
    hasNonPhysical,
    store.country,
    cart.currency,
  );

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-10 sm:py-14">
          <div className="mx-auto w-full max-w-2xl">
            <BackLink
              href={path(locale, `/store/${slug}/cart`)}
              label={t.storefront.checkoutBackToCart}
            />

            <div className="mt-5">
              <h1 className="text-[1.875rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.25rem]">
                {t.storefront.checkoutPageTitle}
              </h1>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-subtle">
                {t.storefront.checkoutPageSubtitle}
              </p>
            </div>

            <div className="mt-7">
              <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
                <DiscountField />
              </section>

              <CheckoutForm
                t={t}
                locale={locale}
                slug={slug}
                cart={cart}
                defaultCountry={store.country}
                requiresShipping={cart.items.some(
                  (item) =>
                    item.productType === "physical" ||
                    item.productType === "bundle",
                )}
                paymentMethods={paymentOptions(paymentMethods.methods)}
                giftEnabled={store.gift_enabled}
              />
            </div>
          </div>
        </Container>
      </main>
    </StorefrontShell>
  );
}
