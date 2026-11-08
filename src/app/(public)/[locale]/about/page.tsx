import type { Metadata } from "next";
import Image from "next/image";
import { Icon, icons } from "@/components/ui/primitives";
import {
  MarketingParallax,
  MarketingReveal,
} from "@/components/marketing/animations";
import {
  Eyebrow,
  MarketingContainer,
  PrimaryLink,
} from "@/components/marketing/ui";
import { resolveLocale } from "@/i18n/config";
import { getAboutContent } from "@/lib/marketing/about";
import { publicHref } from "@/components/marketing/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const c = getAboutContent(locale);

  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: { canonical: `/${locale}/about` },
    openGraph: {
      title: c.meta.title,
      description: c.meta.description,
      type: "profile",
      url: `/${locale}/about`,
      images: [{ url: "/about/ibrahim-suit.jpg", width: 843, height: 1264 }],
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const c = getAboutContent(locale);

  return (
    <>
      {/* Hero */}
      <section className="bg-[#FAFAFA] px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 65% at 78% 15%, rgba(47,92,255,0.35) 0%, transparent 68%), radial-gradient(40% 50% at 8% 90%, rgba(92,133,255,0.12) 0%, transparent 72%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.14) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
              maskImage:
                "radial-gradient(75% 70% at 50% 35%, #000 10%, transparent 78%)",
            }}
          />

          <MarketingContainer className="relative grid min-h-[82vh] items-center gap-10 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:py-20">
            <div>
              <MarketingReveal>
                <Eyebrow>{c.hero.eyebrow}</Eyebrow>
              </MarketingReveal>
              <MarketingReveal delay={0.06}>
                <h1 className="font-display mt-7 max-w-3xl text-[clamp(2.65rem,5.4vw,4.8rem)] leading-[1.02] tracking-[-0.045em] text-white">
                  {c.hero.title}
                </h1>
              </MarketingReveal>
              <MarketingReveal delay={0.12}>
                <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
                  {c.hero.subtitle}
                </p>
              </MarketingReveal>
              <MarketingReveal delay={0.18}>
                <div className="mt-8 flex items-center gap-3 text-[0.75rem] text-white/35">
                  <span className="h-px w-10 bg-brand-400/60" />
                  <span>Pashove · {locale === "en" ? "West Africa" : "Afrique de l’Ouest"}</span>
                </div>
              </MarketingReveal>
            </div>

            <MarketingReveal delay={0.16}>
              <MarketingParallax>
                <div className="relative mx-auto aspect-[4/5] w-full max-w-[31rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_45px_100px_-40px_rgba(0,0,0,0.9)]">
                  <Image
                    src="/about/ibrahim-office.jpg"
                    alt={c.hero.imageAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover object-center"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/45 via-transparent to-transparent" />
                  <p className="absolute inset-x-5 bottom-5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Ibrahim Sidibé · {c.founder.role}
                  </p>
                </div>
              </MarketingParallax>
            </MarketingReveal>
          </MarketingContainer>
        </div>
      </section>

      {/* Why */}
      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <MarketingContainer>
          <div className="mx-auto max-w-4xl">
            <MarketingReveal>
              <Eyebrow tone="light">{c.why.eyebrow}</Eyebrow>
              <h2 className="font-display mt-5 max-w-3xl text-[clamp(2.3rem,4.4vw,4rem)] leading-[1.02] tracking-[-0.04em] text-[#0A0E1A]">
                {c.why.title}
              </h2>
            </MarketingReveal>

            <div className="mt-9 grid gap-5 sm:grid-cols-[0.9fr_1.1fr] sm:gap-10">
              <MarketingReveal delay={0.06}>
                <p className="text-[1.0625rem] font-medium leading-relaxed text-[#0A0E1A] sm:text-[1.125rem]">
                  {c.why.paragraphs[0]}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-brand-500/10 p-2.5 text-brand-600">
                    <Icon path={icons.sparkle} className="h-full w-full" strokeWidth={1.7} />
                  </span>
                  <span className="text-[0.75rem] font-medium text-[#8A93A5]">
                    Pashove · {new Date().getFullYear()}
                  </span>
                </div>
              </MarketingReveal>
              <div className="space-y-4">
                {c.why.paragraphs.slice(1).map((paragraph, index) => (
                  <MarketingReveal key={index} delay={0.1 + index * 0.04}>
                    <p className="text-[0.9375rem] leading-[1.8] text-[#5B6475]">
                      {paragraph}
                    </p>
                  </MarketingReveal>
                ))}
              </div>
            </div>
          </div>
        </MarketingContainer>
      </section>

      {/* Founder */}
      <section className="bg-[#0A0E1A] px-3 py-4 sm:px-5 sm:py-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 px-4 py-12 sm:px-8 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 55% at 85% 10%, rgba(47,92,255,0.22) 0%, transparent 70%)",
            }}
          />
          <MarketingContainer className="relative">
            <MarketingReveal>
              <div className="grid overflow-hidden rounded-[1.75rem] bg-white shadow-[0_40px_100px_-50px_rgba(0,0,0,0.8)] lg:grid-cols-[0.92fr_1.08fr]">
                <div className="relative min-h-[26rem] lg:min-h-[34rem]">
                  <Image
                    src="/about/ibrahim-portrait.jpg"
                    alt={c.founder.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                  <Eyebrow tone="light">{c.founder.eyebrow}</Eyebrow>
                  <h2 className="font-display mt-5 text-[2.4rem] leading-none tracking-[-0.04em] text-[#0A0E1A] sm:text-[3rem]">
                    {c.founder.name}
                  </h2>
                  <p className="mt-2 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-brand-600">
                    {c.founder.role}
                  </p>
                  <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-[#5B6475]">
                    {c.founder.bio}
                  </p>
                  <blockquote className="mt-8 border-l-2 border-brand-500 pl-5">
                    <p className="font-display text-[1.35rem] italic leading-[1.35] tracking-[-0.02em] text-[#0A0E1A] sm:text-[1.65rem]">
                      “{c.founder.quote}”
                    </p>
                  </blockquote>
                </div>
              </div>
            </MarketingReveal>
          </MarketingContainer>
        </div>
      </section>

      {/* Mission & vision */}
      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <MarketingContainer>
          <MarketingReveal>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow tone="light">{c.mission.eyebrow}</Eyebrow>
              <h2 className="font-display mt-5 text-[clamp(2.2rem,4vw,3.6rem)] leading-[1.04] tracking-[-0.04em] text-[#0A0E1A]">
                {c.mission.title}
              </h2>
            </div>
          </MarketingReveal>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <MarketingReveal delay={0.05}>
              <article className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_-50px_rgba(10,14,26,0.5)] sm:p-9">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_12px_30px_-14px_rgba(47,92,255,0.8)]">
                  <Icon path={icons.target} className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="font-display mt-7 text-[1.9rem] leading-none tracking-[-0.03em] text-[#0A0E1A]">
                  {c.mission.missionTitle}
                </h3>
                <p className="mt-4 text-[0.9375rem] leading-[1.8] text-[#5B6475]">
                  {c.mission.missionText}
                </p>
              </article>
            </MarketingReveal>

            <MarketingReveal delay={0.1}>
              <article className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_-50px_rgba(10,14,26,0.5)] sm:p-9">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A0E1A] text-white">
                  <Icon path={icons.rocket} className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <h3 className="font-display mt-7 text-[1.9rem] leading-none tracking-[-0.03em] text-[#0A0E1A]">
                  {c.mission.visionTitle}
                </h3>
                <p className="mt-4 text-[0.9375rem] leading-[1.8] text-[#5B6475]">
                  {c.mission.visionText}
                </p>
              </article>
            </MarketingReveal>
          </div>
        </MarketingContainer>
      </section>

      {/* Ambition */}
      <section className="bg-[#0A0E1A] px-3 py-4 sm:px-5 sm:py-5">
        <div className="relative overflow-hidden rounded-[2rem] px-5 py-12 sm:px-10 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(45% 60% at 12% 80%, rgba(47,92,255,0.2) 0%, transparent 72%)",
            }}
          />
          <MarketingContainer className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
            <div>
              <MarketingReveal>
                <Eyebrow>{c.ambition.eyebrow}</Eyebrow>
                <h2 className="font-display mt-5 max-w-xl text-[clamp(2.3rem,4.2vw,3.8rem)] leading-[1.02] tracking-[-0.04em] text-white">
                  {c.ambition.title}
                </h2>
              </MarketingReveal>
              <div className="mt-6 space-y-4">
                {c.ambition.paragraphs.map((paragraph, index) => (
                  <MarketingReveal key={index} delay={0.06 + index * 0.04}>
                    <p className="max-w-xl text-[0.9375rem] leading-[1.8] text-white/55">
                      {paragraph}
                    </p>
                  </MarketingReveal>
                ))}
              </div>
            </div>

            <MarketingReveal delay={0.12}>
              <MarketingParallax>
                <div className="relative mx-auto aspect-[4/5] w-full max-w-[26rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_40px_90px_-45px_rgba(0,0,0,0.9)]">
                  <Image
                    src="/about/ibrahim-beanie.jpg"
                    alt={c.ambition.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover object-center"
                  />
                </div>
              </MarketingParallax>
            </MarketingReveal>
          </MarketingContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAFAFA] px-3 pb-4 sm:px-5 sm:pb-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A] px-5 py-14 text-center sm:px-10 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 70% at 50% 100%, rgba(47,92,255,0.42) 0%, transparent 70%), radial-gradient(35% 45% at 50% 0%, rgba(92,133,255,0.14) 0%, transparent 70%)",
            }}
          />
          <MarketingContainer className="relative">
            <MarketingReveal>
              <h2 className="font-display mx-auto max-w-4xl text-[clamp(2.5rem,5vw,4.4rem)] leading-[0.99] tracking-[-0.045em] text-white">
                {c.cta.title}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[1rem] font-medium tracking-[0.02em] text-brand-200">
                {c.cta.subtitle}
              </p>
              <div className="mt-9 flex justify-center">
                <PrimaryLink href={publicHref(locale, "/pricing")}>
                  {c.cta.primary}
                </PrimaryLink>
              </div>
              <p className="mt-9 text-[0.75rem] text-white/35">
                {c.cta.signature}
              </p>
            </MarketingReveal>
          </MarketingContainer>
        </div>
      </section>
    </>
  );
}
