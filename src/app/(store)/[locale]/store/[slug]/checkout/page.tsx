import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadStorefront } from "@/lib/storefront/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Emplacement du checkout. Le lot V2 le remplace par le formulaire réel.
 */
export default async function CheckoutRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  return (
    <StorefrontShell footerLabel={t.storefront.poweredBy}>
      <StorefrontHeader store={store} />
      <main className="py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-hairline text-accent">
            <Icon path={icons.lock} className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <h1 className="mt-5 text-[1.375rem] font-medium tracking-[-0.02em] text-fg">
            {t.storefront.checkoutTitle}
          </h1>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
            {t.storefront.checkoutText}
          </p>
          <Link
            href={path(locale, `/store/${slug}/cart`)}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
          >
            {t.storefront.viewCart}
          </Link>
        </div>
      </main>
    </StorefrontShell>
  );
}
