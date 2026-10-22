import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadStorefront } from "@/lib/storefront/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountPage({
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

  const labels = t.storefront;

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />

      <main>
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-lg rounded-3xl border border-border bg-surface p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-hairline text-accent">
              <Icon path={icons.user} className="h-6 w-6" strokeWidth={1.7} />
            </span>

            <p className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
              {labels.accountTitle}
            </p>
            <h1 className="mt-2 text-[1.5rem] font-medium tracking-[-0.03em] text-fg">
              {labels.accountSoonTitle}
            </h1>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-muted">
              {labels.accountSoonText}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {store.contact_email ? (
                <a
                  href={`mailto:${store.contact_email}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong"
                >
                  <Icon path={icons.mail} className="h-4 w-4 text-accent" strokeWidth={1.8} />
                  <span dir="ltr" className="truncate">{store.contact_email}</span>
                </a>
              ) : null}
              {store.contact_phone ? (
                <a
                  href={`tel:${store.contact_phone}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong"
                >
                  <Icon path={icons.phone} className="h-4 w-4 text-accent" strokeWidth={1.8} />
                  <span dir="ltr" className="truncate">{store.contact_phone}</span>
                </a>
              ) : null}
            </div>

            <Link
              href={path(locale, `/store/${slug}`)}
              className="mt-6 inline-flex text-[0.8125rem] font-medium text-subtle transition-colors hover:text-fg"
            >
              {labels.backToShop}
            </Link>
          </div>
        </Container>
      </main>
    </StorefrontShell>
  );
}
