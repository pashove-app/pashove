import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { loadStorefront } from "@/lib/storefront/queries";

export const revalidate = 60;
export const metadata: Metadata = { robots: { index: true, follow: true } };

export default async function StoreAboutPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const { store } = await loadStorefront(slug);
  if (!store) notFound();
  const t = await getDictionary(locale);

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <Container className="py-12 sm:py-16">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
          La maison
        </p>
        <h1 className="mt-2 max-w-3xl text-[2rem] font-medium tracking-[-0.03em] text-fg sm:text-[2.5rem]">
          {store.hero_title || `À propos de ${store.name}`}
        </h1>
        <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-muted">
          {store.description ||
            store.hero_subtitle ||
            `${store.name} accueille ses clients depuis Pashove.`}
        </p>

        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
              Livraison
            </dt>
            <dd className="mt-2 text-[0.875rem] text-body">
              {store.delivery_mode === "pashove"
                ? "Livraison Pashove selon ta zone."
                : `Livraison à ${formatMoney(store.shipping_flat_amount, store.currency, "fr-FR")}.`}
            </dd>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
              Paiement
            </dt>
            <dd className="mt-2 text-[0.875rem] text-body">
              Mobile Money et carte en ligne
              {store.cod_enabled ? ", ou à la livraison." : "."}
            </dd>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
              Contact
            </dt>
            <dd className="mt-2 break-words text-[0.875rem] text-body">
              {store.contact_email || store.contact_phone || "Via la messagerie de la boutique."}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`/${locale}/store/${store.slug}`}
            className="inline-flex h-10 items-center rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white hover:bg-brand-600"
          >
            Voir la boutique
          </a>
          <a
            href={`/${locale}/store/${store.slug}/contact`}
            className="inline-flex h-10 items-center rounded-full border border-border bg-surface px-5 text-[0.8125rem] font-medium text-body hover:border-border-strong"
          >
            Nous contacter
          </a>
        </div>
      </Container>
    </StorefrontShell>
  );
}
