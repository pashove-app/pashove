import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { loadStorefront } from "@/lib/storefront/queries";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const STATUS: Record<string, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

type OrderStatusResult = {
  number: number;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  currency: string;
  created_at: string;
  tracking_number: string | null;
  shipping_city: string;
  shipping_country: string;
};

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ number?: string; phone?: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const { store } = await loadStorefront(slug);
  if (!store) notFound();
  const t = await getDictionary(locale);

  const { number, phone } = await searchParams;
  const parsed = Number.parseInt(number ?? "", 10);
  let result: OrderStatusResult | null = null;
  let searched = false;

  if (Number.isFinite(parsed) && parsed > 0 && (phone ?? "").replace(/\D/g, "").length >= 9) {
    searched = true;
    const supabase = createPublicClient();
    const { data } = await supabase.rpc("public_order_status", {
      p_slug: store.slug,
      p_number: parsed,
      p_phone: phone ?? "",
    });
    result = (data as OrderStatusResult | null) ?? null;
  }

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <Container className="max-w-2xl py-12 sm:py-16">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
          Suivi
        </p>
        <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.03em] text-fg sm:text-[2.5rem]">
          Où en est ma commande ?
        </h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          Saisis le numéro de commande et le téléphone utilisé au paiement.
        </p>

        <form method="get" className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label>
            <span className="block text-[0.6875rem] text-subtle">
              Numéro de commande
            </span>
            <input
              name="number"
              type="number"
              min={1}
              required
              defaultValue={number ?? ""}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
            />
          </label>
          <label>
            <span className="block text-[0.6875rem] text-subtle">Téléphone</span>
            <input
              name="phone"
              type="tel"
              required
              inputMode="tel"
              placeholder="+225 07 00 00 00 00"
              defaultValue={phone ?? ""}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
            />
          </label>
          <button
            type="submit"
            className="mt-0 inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-5 text-[0.8125rem] font-medium text-white hover:bg-brand-600 sm:mt-[1.125rem]"
          >
            Rechercher
          </button>
        </form>

        {searched ? (
          result ? (
            <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[1.125rem] font-medium text-fg">
                  Commande #{result.number}
                </h2>
                <span className="rounded-full bg-brand-500/10 px-3 py-1 text-[0.6875rem] font-medium text-accent">
                  {STATUS[result.status] ?? result.status}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-[0.875rem]">
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">Total</dt>
                  <dd className="font-medium tabular-nums text-fg">
                    {formatMoney(result.total, result.currency, "fr-FR")}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">Livraison</dt>
                  <dd className="text-body">
                    {result.shipping_city}, {result.shipping_country}
                  </dd>
                </div>
                {result.tracking_number ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-subtle">Suivi</dt>
                    <dd dir="ltr" className="font-mono text-[0.8125rem] text-body">
                      {result.tracking_number}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-subtle">Paiement</dt>
                  <dd className="text-body">
                    {result.payment_status === "paid" ? "Payé" : "En attente"}
                  </dd>
                </div>
              </dl>
            </section>
          ) : (
            <p className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] px-5 py-4 text-[0.875rem] text-amber-700 dark:text-amber-300">
              Aucune commande ne correspond à ce numéro et ce téléphone. Vérifie
              la saisie ou contacte la boutique.
            </p>
          )
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/store/${store.slug}/faq`}
            className="text-[0.8125rem] font-medium text-accent hover:text-accent-soft"
          >
            Questions fréquentes
          </Link>
          <Link
            href={`/${locale}/store/${store.slug}/contact`}
            className="text-[0.8125rem] font-medium text-accent hover:text-accent-soft"
          >
            Contacter la boutique
          </Link>
        </div>
      </Container>
    </StorefrontShell>
  );
}
