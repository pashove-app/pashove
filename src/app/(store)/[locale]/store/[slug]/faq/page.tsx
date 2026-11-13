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

export const revalidate = 60;
export const metadata: Metadata = { robots: { index: true, follow: true } };

export default async function StoreFaqPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const { store } = await loadStorefront(slug);
  if (!store) notFound();
  const t = await getDictionary(locale);
  const shipping = formatMoney(store.shipping_flat_amount, store.currency, "fr-FR");

  const faqs = [
    {
      question: "Quels moyens de paiement sont acceptés ?",
      answer:
        "Les paiements Mobile Money (Orange Money, Wave, MTN MoMo, Moov Money) et la carte bancaire sont acceptés en ligne." +
        (store.cod_enabled ? " Le paiement à la livraison est aussi disponible." : ""),
    },
    {
      question: "Comment fonctionne la livraison ?",
      answer:
        store.delivery_mode === "pashove"
          ? "La livraison est assurée par Pashove Delivery. Les frais dépendent de ta zone et sont affichés au paiement."
          : `La livraison est facturée ${shipping} et confirmée avec la boutique après la commande.`,
    },
    {
      question: "Comment suivre ma commande ?",
      answer:
        "Utilise ton numéro de commande et le téléphone saisi au paiement dans la page de suivi. Aucun compte n’est nécessaire.",
    },
    {
      question: "Puis-je demander un remboursement ?",
      answer:
        "Contacte la boutique depuis la messagerie ou la page de contact. Un remboursement total ou partiel peut être demandé selon l’état de la commande.",
    },
    {
      question: "Les produits numériques sont-ils disponibles immédiatement ?",
      answer:
        "Oui. Après confirmation du paiement, les fichiers apparaissent dans ton espace client avec des liens signés à durée limitée.",
    },
  ];

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <Container className="py-12 sm:py-16">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
          Aide
        </p>
        <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.03em] text-fg sm:text-[2.5rem]">
          Questions fréquentes
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          Les réponses aux questions posées le plus souvent chez {store.name}.
        </p>

        <div className="mt-8 divide-y divide-hairline overflow-hidden rounded-2xl border border-border bg-surface">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-[0.9375rem] font-medium text-fg">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <span className="text-faint transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/store/${store.slug}/order-status`}
            className="inline-flex h-10 items-center rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white hover:bg-brand-600"
          >
            Suivre une commande
          </Link>
          <Link
            href={`/${locale}/store/${store.slug}/contact`}
            className="inline-flex h-10 items-center rounded-full border border-border bg-surface px-5 text-[0.8125rem] font-medium text-body hover:border-border-strong"
          >
            Poser une autre question
          </Link>
        </div>
      </Container>
    </StorefrontShell>
  );
}
