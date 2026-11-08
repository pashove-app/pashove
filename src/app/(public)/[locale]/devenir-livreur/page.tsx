import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { MarketingReveal } from "@/components/marketing/animations";
import {
  Eyebrow,
  MarketingContainer,
  PrimaryLink,
  SectionHeading,
} from "@/components/marketing/ui";
import { resolveLocale } from "@/i18n/config";

const COPY = {
  fr: {
    eyebrow: "Pashove Delivery",
    titleA: "Deviens livreur.",
    titleB: "Chaque course compte.",
    description:
      "Le réseau de livraison moto de Pashove arrive. Inscris-toi pour être prévenu à l’ouverture dans ta ville.",
    primary: "Être prévenu",
    secondary: "Comment ça marche",
    benefitsTitleA: "Ton temps,",
    benefitsTitleB: "tes revenus.",
    benefits: [
      { icon: "wallet" as const, title: "Paiement sécurisé", text: "La course est validée par un code remis par le client, puis payée sur ton solde Pashove." },
      { icon: "clock" as const, title: "Flexibilité", text: "Tu te mets en ligne quand tu veux. Aucun quota, aucune pénalité." },
      { icon: "route" as const, title: "Missions proches", text: "Le dispatch choisit le livreur le plus proche de la boutique." },
    ],
    stepsTitle: "De l’inscription à la première course.",
    steps: [
      { title: "Inscription", text: "Nom, téléphone, e-mail, pièce d’identité et selfie." },
      { title: "Validation", text: "L’équipe Pashove vérifie ton dossier et active ton compte livreur." },
      { title: "Mission", text: "Tu reçois une demande avec un compte à rebours de 10 secondes." },
      { title: "Paiement", text: "Le client donne son code à la livraison ; la course est créditée." },
    ],
    requirementsTitle: "Ce qu’il te faut",
    requirements: [
      "Une moto en règle et un permis valide",
      "Un smartphone avec internet",
      "Une pièce d’identité pour la vérification",
      "Un compte Pashove pour recevoir tes gains",
    ],
    soon:
      "Les inscriptions ne sont pas encore ouvertes. Écris-nous pour être prévenu en priorité.",
    ctaTitle: "Prêt à pédaler sur les commandes ?",
    ctaText: "Laisse ton e-mail, nous te contactons dès l’ouverture dans ta ville.",
    cta: "Je veux être livreur",
  },
  en: {
    eyebrow: "Pashove Delivery",
    titleA: "Become a courier.",
    titleB: "Every ride counts.",
    description:
      "Pashove’s moto delivery network is coming. Sign up to be notified when it opens in your city.",
    primary: "Get notified",
    secondary: "How it works",
    benefitsTitleA: "Your time,",
    benefitsTitleB: "your earnings.",
    benefits: [
      { icon: "wallet" as const, title: "Secure payment", text: "The delivery is validated with a code from the customer, then paid to your Pashove balance." },
      { icon: "clock" as const, title: "Flexibility", text: "Go online whenever you want. No quota, no penalty." },
      { icon: "route" as const, title: "Nearby missions", text: "Dispatch picks the courier closest to the store." },
    ],
    stepsTitle: "From sign-up to first delivery.",
    steps: [
      { title: "Sign up", text: "Name, phone, email, ID document and a selfie." },
      { title: "Review", text: "The Pashove team checks your file and activates your courier account." },
      { title: "Mission", text: "You receive a request with a 10-second countdown." },
      { title: "Payment", text: "The customer gives their code on delivery; the ride is credited." },
    ],
    requirementsTitle: "What you need",
    requirements: [
      "A roadworthy moto and a valid licence",
      "A smartphone with internet",
      "An ID document for verification",
      "A Pashove account to receive your earnings",
    ],
    soon:
      "Sign-ups are not open yet. Write to us to be notified first.",
    ctaTitle: "Ready to ride?",
    ctaText: "Leave your email and we will contact you when it opens in your city.",
    cta: "I want to be a courier",
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
    title: `${copy.titleA} ${copy.titleB}`,
    description: copy.description,
    alternates: { canonical: `/${locale}/devenir-livreur` },
  };
}

export default async function CourierPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = locale === "en" ? COPY.en : COPY.fr;
  const mailto = "mailto:livreurs@pashove.com?subject=Devenir%20livreur";

  return (
    <>
      <section className="bg-[#FAFAFA] px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 70% at 20% -10%, rgba(47,92,255,0.35) 0%, transparent 65%), linear-gradient(180deg,#05070D 0%,#0A1020 100%)",
            }}
          />
          <MarketingContainer className="relative py-16 sm:py-24">
            <MarketingReveal>
              <Eyebrow>{copy.eyebrow}</Eyebrow>
              <h1 className="font-display mt-7 max-w-3xl text-[clamp(2.8rem,6vw,5.2rem)] leading-[0.98] tracking-[-0.045em] text-white">
                {copy.titleA}{" "}
                <span className="text-brand-300">{copy.titleB}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
                {copy.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href={mailto}>{copy.primary}</PrimaryLink>
                <Link
                  href="#comment"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-[0.875rem] font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
                >
                  {copy.secondary}
                </Link>
              </div>
              <p className="mt-6 max-w-xl rounded-xl border border-amber-300/25 bg-amber-400/[0.08] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-100/80">
                {copy.soon}
              </p>
            </MarketingReveal>
          </MarketingContainer>
        </div>
      </section>

      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <MarketingContainer>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.benefits.map((benefit, index) => (
              <MarketingReveal key={benefit.title} delay={index * 0.05}>
                <article className="h-full rounded-3xl border border-slate-200 bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white">
                    <Icon path={icons[benefit.icon]} className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h2 className="mt-5 text-[1rem] font-semibold text-[#0A0E1A]">
                    {benefit.title}
                  </h2>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-[#6B7280]">
                    {benefit.text}
                  </p>
                </article>
              </MarketingReveal>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section id="comment" className="scroll-mt-24 border-t border-slate-200 bg-white py-14 sm:py-20">
        <MarketingContainer>
          <MarketingReveal>
            <SectionHeading
              align="center"
              dark={false}
              eyebrow={copy.eyebrow}
              titleA={copy.stepsTitle}
              titleB=""
            />
          </MarketingReveal>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.steps.map((step, index) => (
              <MarketingReveal key={step.title} delay={index * 0.05}>
                <li className="h-full rounded-2xl border border-slate-200 bg-[#FAFAFA] p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-[0.75rem] font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-[0.9375rem] font-semibold text-[#0A0E1A]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[#6B7280]">
                    {step.text}
                  </p>
                </li>
              </MarketingReveal>
            ))}
          </ol>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-[#FAFAFA] p-6 sm:p-8">
            <h3 className="text-[1rem] font-semibold text-[#0A0E1A]">
              {copy.requirementsTitle}
            </h3>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {copy.requirements.map((requirement) => (
                <li
                  key={requirement}
                  className="flex items-start gap-2.5 text-[0.875rem] leading-relaxed text-[#4B5563]"
                >
                  <Icon
                    path={icons.check}
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                    strokeWidth={2.4}
                  />
                  {requirement}
                </li>
              ))}
            </ul>
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
              {copy.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/55">
              {copy.ctaText}
            </p>
            <div className="mt-8 flex justify-center">
              <PrimaryLink href={mailto}>{copy.cta}</PrimaryLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
