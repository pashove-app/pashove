import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/storefront/contact-form";
import { Container } from "@/components/storefront/container";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStoreAdminCopy } from "@/lib/storefront/admin-copy";
import { loadStorefront } from "@/lib/storefront/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const { store } = await loadStorefront(slug);
  if (!store) return {};

  return {
    title: `Contact · ${store.name}`,
    description: `Contacte ${store.name}.`,
  };
}

export default async function StoreContactPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();

  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const copy = getStoreAdminCopy(locale);

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-12 sm:py-16">
          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
                {store.name}
              </p>
              <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.75rem]">
                {copy.contact.title}
              </h1>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {copy.contact.subtitle}
              </p>

              <dl className="mt-7 space-y-4 text-[0.875rem]">
                {store.contact_email ? (
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-faint">
                      E-mail
                    </dt>
                    <dd className="mt-1 text-body">{store.contact_email}</dd>
                  </div>
                ) : null}
                {store.contact_phone ? (
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-faint">
                      Téléphone
                    </dt>
                    <dd className="mt-1 text-body">{store.contact_phone}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <ContactForm locale={locale} slug={store.slug} labels={copy.contact} />
          </div>
        </Container>
      </main>
    </StorefrontShell>
  );
}
