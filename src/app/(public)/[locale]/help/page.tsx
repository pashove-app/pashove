import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { MarketingReveal } from "@/components/marketing/animations";
import {
  Eyebrow,
  MarketingContainer,
  PrimaryLink,
  SectionHeading,
  publicHref,
} from "@/components/marketing/ui";
import { resolveLocale } from "@/i18n/config";

const COPY = {
  fr: {
    eyebrow: "Centre d’aide",
    title: "Comment pouvons-nous t’aider ?",
    description:
      "Des réponses courtes aux questions les plus fréquentes. Pour le reste, écris-nous : une vraie personne répond.",
    categories: [
      { icon: "store" as const, title: "Démarrer", text: "Compte, boutique, premier produit." },
      { icon: "bag" as const, title: "Vendre", text: "Commandes, stock, livraison." },
      { icon: "wallet" as const, title: "Paiements", text: "Mobile money, carte, retraits." },
      { icon: "users" as const, title: "Clients", text: "Comptes, messagerie, cadeaux." },
      { icon: "route" as const, title: "Partenaires", text: "Revente et affiliation." },
      { icon: "shield" as const, title: "Sécurité", text: "KYC, PIN, accès équipe." },
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "Comment créer ma boutique ?",
        a: "Crée ton compte, suis l’onboarding (nom, pays, devise), puis ajoute un premier produit. Une boutique simple peut être en ligne en quelques minutes.",
      },
      {
        q: "Quels moyens de paiement sont disponibles ?",
        a: "Mobile money dans 22 pays et 64 réseaux via SasPay, et carte bancaire à partir de 25 000 FCFA de panier. Le paiement à la livraison reste disponible si tu l’actives.",
      },
      {
        q: "Combien coûte Pashove ?",
        a: "Free : 0 FCFA et 10 % de commission, frais SasPay inclus. Standard : 25 000 FCFA/mois et 2 %. Pro : 45 000 FCFA/mois et 0 %. Aucun frais sur les retraits.",
      },
      {
        q: "Comment recevoir mon argent ?",
        a: "Les ventes en ligne alimentent ton solde Pashove. Le retrait se demande depuis Finance, après vérification KYC et saisie de ton PIN. Seuls les frais SasPay de décaissement s’appliquent.",
      },
      {
        q: "Puis-je vendre dans plusieurs pays ?",
        a: "Oui : active les pays dans Réglages → Pays de vente. Le client choisit son pays au checkout et les moyens de paiement s’adaptent. La conversion de devise est en préparation.",
      },
      {
        q: "Mes fichiers numériques sont-ils protégés ?",
        a: "Oui. Les fichiers restent privés sur R2. Chaque acheteur reçoit un droit de téléchargement limité, avec un lien signé temporaire. Un partenaire ou affilié ne voit jamais le fichier.",
      },
      {
        q: "Puis-je changer de plan ?",
        a: "Oui, à tout moment. Un passage à Standard ou Pro est actif 30 jours après paiement ; à l’expiration, le compte revient en Free et les boutiques au-delà de la limite passent en brouillon.",
      },
      {
        q: "La livraison Pashove est-elle disponible ?",
        a: "Pas encore. Le réseau de livreurs moto est en préparation. La page Devenir livreur explique le fonctionnement prévu.",
      },
    ],
    contactTitle: "Tu n’as pas trouvé ?",
    contactText: "Écris-nous à support@pashove.com. Nous répondons du lundi au samedi.",
    contactCta: "Écrire au support",
  },
  en: {
    eyebrow: "Help centre",
    title: "How can we help?",
    description:
      "Short answers to the most common questions. For anything else, write to us: a real person replies.",
    categories: [
      { icon: "store" as const, title: "Get started", text: "Account, store, first product." },
      { icon: "bag" as const, title: "Sell", text: "Orders, stock, delivery." },
      { icon: "wallet" as const, title: "Payments", text: "Mobile money, card, payouts." },
      { icon: "users" as const, title: "Customers", text: "Accounts, messaging, gifts." },
      { icon: "route" as const, title: "Partners", text: "Reselling and affiliation." },
      { icon: "shield" as const, title: "Security", text: "KYC, PIN, team access." },
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "How do I create my store?",
        a: "Create an account, follow onboarding (name, country, currency), then add a first product. A simple store can be live in minutes.",
      },
      {
        q: "Which payment methods are available?",
        a: "Mobile money in 22 countries and 64 networks via SasPay, and card from 25,000 FCFA carts. Cash on delivery remains available if you enable it.",
      },
      {
        q: "How much does Pashove cost?",
        a: "Free: 0 FCFA and 10% commission, SasPay fees included. Standard: 25,000 FCFA/month and 2%. Pro: 45,000 FCFA/month and 0%. No fees on payouts.",
      },
      {
        q: "How do I get paid?",
        a: "Online sales feed your Pashove balance. Request a payout from Finance after KYC verification and your PIN. Only SasPay disbursement fees apply.",
      },
      {
        q: "Can I sell in several countries?",
        a: "Yes: enable countries in Settings → Sales countries. Customers pick their country at checkout and payment methods adapt. Currency conversion is in preparation.",
      },
      {
        q: "Are my digital files protected?",
        a: "Yes. Files stay private on R2. Each buyer gets a limited download entitlement with a temporary signed link. Partners and affiliates never see the file.",
      },
      {
        q: "Can I change plan?",
        a: "Yes, anytime. Standard or Pro activates for 30 days after payment; at expiry the account returns to Free and stores above the limit become drafts.",
      },
      {
        q: "Is Pashove Delivery available?",
        a: "Not yet. The moto courier network is in preparation. The Become a courier page explains how it will work.",
      },
    ],
    contactTitle: "Didn’t find it?",
    contactText: "Write to support@pashove.com. We reply Monday to Saturday.",
    contactCta: "Email support",
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
    alternates: { canonical: `/${locale}/help` },
  };
}

export default async function HelpPage({
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
                "radial-gradient(70% 70% at 50% -10%, rgba(47,92,255,0.32) 0%, transparent 65%), linear-gradient(180deg,#05070D 0%,#080D18 100%)",
            }}
          />
          <MarketingContainer className="relative py-16 text-center sm:py-20">
            <MarketingReveal>
              <Eyebrow>{copy.eyebrow}</Eyebrow>
              <h1 className="font-display mx-auto mt-7 max-w-3xl text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] tracking-[-0.045em] text-white">
                {copy.title}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
                {copy.description}
              </p>
            </MarketingReveal>
          </MarketingContainer>
        </div>
      </section>

      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <MarketingContainer>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.categories.map((category, index) => (
              <MarketingReveal key={category.title} delay={index * 0.04}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/[0.1] text-brand-600">
                    <Icon path={icons[category.icon]} className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h2 className="mt-4 text-[0.9375rem] font-semibold text-[#0A0E1A]">
                    {category.title}
                  </h2>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-[#6B7280]">
                    {category.text}
                  </p>
                </article>
              </MarketingReveal>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section className="border-t border-slate-200 bg-white py-14 sm:py-20">
        <MarketingContainer>
          <MarketingReveal>
            <SectionHeading
              align="center"
              dark={false}
              eyebrow={copy.eyebrow}
              titleA={copy.faqTitle}
              titleB=""
            />
          </MarketingReveal>

          <div className="mx-auto mt-10 max-w-3xl divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white">
            {copy.faq.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.9375rem] font-medium text-[#0A0E1A]">
                  {item.q}
                  <Icon
                    path={icons.chevronDown}
                    className="h-4 w-4 shrink-0 text-[#8A93A5] transition-transform group-open:rotate-180"
                    strokeWidth={2}
                  />
                </summary>
                <p className="mt-3 max-w-2xl text-[0.875rem] leading-relaxed text-[#5B6475]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section className="bg-[#FAFAFA] px-3 pb-4 sm:px-5 sm:pb-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A] px-5 py-14 text-center sm:px-10 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 70% at 50% 110%, rgba(47,92,255,0.3) 0%, transparent 72%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.04em] text-white">
              {copy.contactTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/55">
              {copy.contactText}
            </p>
            <div className="mt-8 flex justify-center">
              <PrimaryLink href="mailto:support@pashove.com">
                {copy.contactCta}
              </PrimaryLink>
            </div>
            <Link
              href={publicHref(locale, "/docs")}
              className="mt-4 inline-block text-[0.8125rem] font-medium text-brand-200 transition-colors hover:text-white"
            >
              {locale === "en" ? "Read the documentation" : "Consulter la documentation"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
