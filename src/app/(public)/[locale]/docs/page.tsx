import type { Metadata } from "next";
import { MarketingContainer, Eyebrow } from "@/components/marketing/ui";
import { MarketingReveal } from "@/components/marketing/animations";
import { resolveLocale } from "@/i18n/config";

type Section = {
  id: string;
  title: string;
  intro: string;
  points: string[];
};

const COPY = {
  fr: {
    eyebrow: "Documentation",
    title: "Comprendre Pashove, sans jargon.",
    description:
      "Guide marchand : boutique, catalogue, paiements, thèmes, partenaires, domaines et API v1.",
    note: "Cette page documente les fonctionnalités disponibles aujourd’hui dans la plateforme.",
    sectionsTitle: "Sommaire",
    sections: [
      {
        id: "demarrage",
        title: "Démarrage",
        intro:
          "Un compte, une boutique, un premier produit. Tout tient dans le dashboard.",
        points: [
          "Crée ton compte puis renseigne le nom, le pays et la devise de la boutique.",
          "Choisis un thème parmi les huit presets et publie ta vitrine.",
          "Ajoute un produit physique, numérique ou un service, puis partage le lien de ta boutique.",
        ],
      },
      {
        id: "catalogue",
        title: "Catalogue",
        intro:
          "Trois types de produits, un seul catalogue. Le stock et les variantes restent sous ton contrôle.",
        points: [
          "Physique : stock, poids, variantes, livraison.",
          "Numérique : fichier privé sur R2, droit de téléchargement limité pour l’acheteur.",
          "Service : durée et lieu, créneaux réservés au checkout.",
        ],
      },
      {
        id: "commandes",
        title: "Commandes",
        intro:
          "Chaque commande garde un instantané des produits, même si le catalogue change ensuite.",
        points: [
          "Paiement à la livraison si tu l’actives : uniquement pour les paniers avec du physique.",
          "Paiement en ligne : la commande reste en attente jusqu’à la confirmation du prestataire.",
          "Les statuts suivent le cycle : en attente, confirmée, expédiée, livrée.",
        ],
      },
      {
        id: "paiements",
        title: "Paiements",
        intro:
          "SasPay encaisse le mobile money et la carte. Pashove tient le ledger et calcule les commissions côté serveur.",
        points: [
          "Mobile Money en Côte d’Ivoire, au Sénégal, au Mali, au Burkina Faso, au Bénin et au Togo : Orange Money, Wave, MTN MoMo, Moov Money et Free Money selon le pays.",
          "La carte bancaire est disponible à partir de 25 000 FCFA de panier.",
          "Chaque marché utilise sa devise au checkout.",
          "Free : 6 % de commission, frais SasPay payés par le client (ou par toi si tu choisis de les absorber). Standard et Pro : 2 % et 0 %, mêmes règles de frais.",
          "Retraits après KYC et PIN ; seuls les frais SasPay de décaissement s’appliquent.",
        ],
      },
      {
        id: "themes",
        title: "Thèmes et checkout",
        intro:
          "Huit thèmes, un éditeur, un checkout personnalisable sans toucher au code.",
        points: [
          "Couleurs, police, logo et ordre des sections depuis le thème.",
          "Checkout : modèle compact ou détaillé, ordre des blocs, textes et bouton.",
          "Les pays et les moyens de paiement sont verrouillés par la plateforme.",
        ],
      },
      {
        id: "partenaires",
        title: "Partenaires",
        intro:
          "Deux modes : revendre un produit dans sa boutique, ou promouvoir avec un lien d’affiliation.",
        points: [
          "Revendeur : le miroir suit le prix de la source ; le stock reste chez le propriétaire.",
          "Affilié : lien ?ref=CODE, cookie de 30 jours, commission versée sur le ledger de ta boutique.",
          "Un produit source supprimé ou dépublié désactive le miroir.",
        ],
      },
      {
        id: "domaines",
        title: "Domaines",
        intro:
          "Chaque boutique dispose d’un sous-domaine pashove.com et peut ajouter son propre domaine.",
        points: [
          "Sous-domaine actif dès la publication : <slug>.pashove.com.",
          "Domaine personnalisé : vérification DNS et certificat automatique.",
          "Les liens directs /store/<slug> restent servis par le proxy interne.",
        ],
      },
      {
        id: "api",
        title: "API et webhooks",
        intro:
          "API v1 en lecture et webhooks marchands signés, disponibles depuis le dashboard.",
        points: [
          "Authentification : clé pk_live_ dans l’en-tête Authorization: Bearer.",
          "Endpoints : /api/v1/store, /api/v1/products et /api/v1/orders.",
          "Webhooks signés HMAC, avec relances et clés d’idempotence.",
        ],
      },
    ] as Section[],
  },
  en: {
    eyebrow: "Documentation",
    title: "Understand Pashove, without jargon.",
    description:
      "Merchant guide: store, catalog, payments, themes, partners, domains and the v1 API.",
    note: "This page documents what is available today in the platform.",
    sectionsTitle: "Contents",
    sections: [
      {
        id: "getting-started",
        title: "Getting started",
        intro: "One account, one store, one first product. Everything lives in the dashboard.",
        points: [
          "Create your account, then set the store name, country and currency.",
          "Pick one of the eight themes and publish your storefront.",
          "Add a physical product, a digital file or a service, then share your store link.",
        ],
      },
      {
        id: "catalog",
        title: "Catalog",
        intro: "Three product types, one catalog. Stock and variants stay under your control.",
        points: [
          "Physical: stock, weight, variants, shipping.",
          "Digital: private file on R2, limited download entitlement for the buyer.",
          "Service: duration and location, slots booked at checkout.",
        ],
      },
      {
        id: "orders",
        title: "Orders",
        intro: "Every order keeps a snapshot of its products, even if the catalog changes later.",
        points: [
          "Cash on delivery if enabled: only for carts with physical items.",
          "Online payment: the order stays pending until the provider confirms.",
          "Statuses follow: pending, confirmed, shipped, delivered.",
        ],
      },
      {
        id: "payments",
        title: "Payments",
        intro:
          "SasPay collects mobile money and cards. Pashove keeps the ledger and computes commissions server-side.",
        points: [
          "Mobile Money in Côte d’Ivoire, Senegal, Mali, Burkina Faso, Benin and Togo: Orange Money, Wave, MTN MoMo, Moov Money and Free Money depending on the country.",
          "Card payment is available from 25,000 FCFA carts.",
          "Each market uses its own currency at checkout.",
          "Free: 6% commission, SasPay fees paid by the customer (or by you if you choose to absorb them). Standard and Pro: 2% and 0%, same fee rules.",
          "Payouts after KYC and PIN; only SasPay disbursement fees apply.",
        ],
      },
      {
        id: "themes",
        title: "Themes and checkout",
        intro: "Eight themes, one editor, a customisable checkout without code.",
        points: [
          "Colours, font, logo and section order from the theme.",
          "Checkout: compact or detailed, block order, texts and pay button.",
          "Countries and payment methods are locked by the platform.",
        ],
      },
      {
        id: "partners",
        title: "Partners",
        intro: "Two modes: resell a product in your store, or promote it with an affiliate link.",
        points: [
          "Reseller: the mirror follows the source price; stock stays with the owner.",
          "Affiliate: ?ref=CODE link, 30-day cookie, commission paid to your store ledger.",
          "A deleted or unpublished source product disables the mirror.",
        ],
      },
      {
        id: "domains",
        title: "Domains",
        intro: "Every store gets a pashove.com subdomain and can add its own domain.",
        points: [
          "Subdomain active as soon as you publish: <slug>.pashove.com.",
          "Custom domain: DNS verification and automatic certificate.",
          "Direct /store/<slug> links keep working through the internal proxy.",
        ],
      },
      {
        id: "api",
        title: "API and webhooks",
        intro: "Read-only v1 API and signed merchant webhooks, available from the dashboard.",
        points: [
          "Authentication: pk_live_ key in the Authorization: Bearer header.",
          "Endpoints: /api/v1/store, /api/v1/products and /api/v1/orders.",
          "HMAC-signed webhooks with retries and idempotency keys.",
        ],
      },
    ] as Section[],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = locale === "en" ? COPY.en : COPY.fr;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `/${locale}/docs` },
  };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = locale === "en" ? COPY.en : COPY.fr;

  return (
    <>
      <section className="bg-[#FAFAFA] px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 70% at 50% -10%, rgba(47,92,255,0.28) 0%, transparent 65%), linear-gradient(180deg,#05070D 0%,#080D18 100%)",
            }}
          />
          <MarketingContainer className="relative py-16 sm:py-20">
            <MarketingReveal>
              <Eyebrow>{copy.eyebrow}</Eyebrow>
              <h1 className="font-display mt-7 max-w-3xl text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] tracking-[-0.045em] text-white">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
                {copy.description}
              </p>
            </MarketingReveal>
          </MarketingContainer>
        </div>
      </section>

      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <MarketingContainer>
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-900/75">
            {copy.note}
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
            <nav className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[#8A93A5]">
                {copy.sectionsTitle}
              </p>
              <ul className="mt-3 space-y-1.5">
                {copy.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-lg px-2 py-1.5 text-[0.8125rem] text-[#5B6475] transition-colors hover:bg-white hover:text-[#0A0E1A]"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-4">
              {copy.sections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
                >
                  <h2 className="text-[1.35rem] font-semibold tracking-[-0.02em] text-[#0A0E1A]">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-[#5B6475]">
                    {section.intro}
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {section.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2.5 text-[0.875rem] leading-relaxed text-[#4B5563]"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </MarketingContainer>
      </section>
    </>
  );
}
