import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import {
  AnimatedCount,
  MarketingParallax,
  MarketingReveal,
} from "@/components/marketing/animations";
import {
  Eyebrow,
  FeatureIcon,
  HeroMockup,
  MarketingContainer,
  PrimaryLink,
  SecondaryLink,
  SectionHeading,
  publicHref,
} from "@/components/marketing/ui";
import { WhyMockup } from "@/components/marketing/why-mockups";
import { cn } from "@/lib/cn";
import { resolveLocale } from "@/i18n/config";
import { getSiteContent } from "@/lib/marketing/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const content = getSiteContent(locale);

  return {
    title: content.meta.homeTitle,
    description: content.meta.homeDescription,
    alternates: { canonical: `/${locale}` },
    openGraph: {
      title: content.meta.homeTitle,
      description: content.meta.homeDescription,
      type: "website",
      url: `/${locale}`,
    },
  };
}

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const c = getSiteContent(locale);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#05070D]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 65% at 50% -5%, rgba(47,92,255,0.34) 0%, transparent 62%), radial-gradient(45% 40% at 8% 35%, rgba(92,133,255,0.12) 0%, transparent 70%), radial-gradient(40% 40% at 95% 50%, rgba(47,92,255,0.10) 0%, transparent 65%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.16) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(75% 65% at 50% 30%, #000 15%, transparent 80%)",
          }}
        />

        <MarketingContainer className="relative pt-16 text-center sm:pt-20 lg:pt-24">
          <MarketingReveal>
            <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          </MarketingReveal>

          <MarketingReveal delay={0.06}>
            <h1 className="font-display mx-auto mt-7 max-w-5xl text-[clamp(3rem,7.2vw,6.4rem)] leading-[0.96] tracking-[-0.045em] text-white">
              {c.hero.titleBefore}{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span
                  className="absolute inset-x-[-0.12em] bottom-[0.06em] top-[0.14em] -rotate-[1.5deg] rounded-[0.14em] bg-brand-500"
                  aria-hidden="true"
                />
                <span className="relative text-white">
                  {c.hero.titleHighlight}
                </span>
              </span>{" "}
              {c.hero.titleAfter}
            </h1>
          </MarketingReveal>

          <MarketingReveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
              {c.hero.description}
            </p>
          </MarketingReveal>

          <MarketingReveal delay={0.18}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <PrimaryLink href={publicHref(locale, "/auth/register")}>
                {c.hero.primary}
              </PrimaryLink>
              <SecondaryLink
                href={publicHref(locale, c.hero.demoHref)}
                target="_blank"
              >
                {c.hero.secondary}
                <Icon path={icons.arrowUpRight} className="h-4 w-4" strokeWidth={2} />
              </SecondaryLink>
            </div>
          </MarketingReveal>

          <MarketingReveal delay={0.24}>
            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-y-4 border-y border-white/10 py-5 sm:grid-cols-4">
              {c.hero.miniStats.map((stat) => (
                <div key={stat.label} className="px-2 text-center">
                  <p className="font-display text-[1.5rem] leading-none tracking-[-0.03em] text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[0.625rem] uppercase tracking-[0.12em] text-white/35">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </MarketingReveal>
        </MarketingContainer>

        <MarketingContainer className="relative mt-12 pb-16 sm:mt-16 sm:pb-20">
          <MarketingReveal delay={0.28}>
            <MarketingParallax>
              <div className="mx-auto w-full max-w-4xl">
                <HeroMockup labels={c.hero.mock} />
              </div>
            </MarketingParallax>
          </MarketingReveal>
        </MarketingContainer>
      </section>

      {/* Impact stats */}
      <section id="impact" className="border-y border-white/10 bg-[#0A0E1A] py-16 sm:py-20">
        <MarketingContainer>
          <MarketingReveal>
            <div className="max-w-2xl">
              <Eyebrow>{c.impact.eyebrow}</Eyebrow>
              <h2 className="font-display mt-4 text-[clamp(2rem,3.4vw,3rem)] leading-[1.04] tracking-[-0.035em] text-white">
                {c.impact.titleA}{" "}
                <span className="text-brand-300">{c.impact.titleB}</span>
              </h2>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-white/45">
                {c.impact.description}
              </p>
            </div>
          </MarketingReveal>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.impactStats.map((stat, index) => (
              <MarketingReveal key={stat.label} delay={index * 0.05}>
                <div className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-brand-400/30 hover:shadow-[0_24px_55px_-30px_rgba(47,92,255,0.55)] sm:p-6">
                  <FeatureIcon icon={stat.icon} />
                  <p className="font-display mt-5 text-[2rem] leading-none tracking-[-0.04em] text-white sm:text-[2.35rem]">
                    {"text" in stat && stat.text ? (
                      <AnimatedCount text={stat.text} />
                    ) : (
                      <AnimatedCount
                        value={"value" in stat ? stat.value ?? 0 : 0}
                        prefix={"prefix" in stat ? stat.prefix : ""}
                        suffix={"suffix" in stat ? stat.suffix : ""}
                      />
                    )}
                  </p>
                  <p className="mt-2 text-[0.8125rem] font-medium text-white/75">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-white/30">
                    {stat.detail}
                  </p>
                </div>
              </MarketingReveal>
            ))}
          </div>
        </MarketingContainer>
      </section>

      {/* Why Pashove — alternating */}
      <section id="why" className="bg-[#FAFAFA] py-20 sm:py-28">
        <MarketingContainer>
          <MarketingReveal>
            <SectionHeading
              dark={false}
              eyebrow={c.why.eyebrow}
              titleA={c.why.titleA}
              titleB={c.why.titleB}
              description={c.why.description}
            />
          </MarketingReveal>

          <div className="mt-14 space-y-14 sm:mt-20 sm:space-y-20">
            {c.why.items.map((item, index) => (
              <MarketingReveal key={item.title} delay={0.05}>
                <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                  <div className={cn(index % 2 === 1 && "lg:order-2")}>
                    <div className="flex items-center gap-3">
                      <FeatureIcon icon={item.icon} tone="light" />
                      <span className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-600">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="font-display mt-5 text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.05] tracking-[-0.035em] text-[#0A0E1A]">
                      {item.title}
                    </h3>
                    <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-[#5B6475]">
                      {item.text}
                    </p>
                    <Link
                      href={publicHref(locale, "/features")}
                      className="mt-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-600 transition-colors hover:text-brand-700"
                    >
                      {locale === "en" ? "Explore this feature" : "Découvrir cette fonctionnalité"}
                      <Icon path={icons.arrowRight} className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </Link>
                  </div>

                  <div className={cn(index % 2 === 1 && "lg:order-1")}>
                    <WhyMockup variant={item.mock} />
                  </div>
                </div>
              </MarketingReveal>
            ))}
          </div>
        </MarketingContainer>
      </section>

      {/* Testimonials */}
      <section className="bg-[#F4F6FB] py-20 sm:py-28">
        <MarketingContainer>
          <MarketingReveal>
            <SectionHeading
              dark={false}
              align="center"
              eyebrow={c.testimonials.eyebrow}
              titleA={c.testimonials.titleA}
              titleB={c.testimonials.titleB}
              description={c.testimonials.description}
            />
          </MarketingReveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {c.testimonials.items.map((testimonial, index) => (
              <MarketingReveal key={testimonial.name} delay={index * 0.07}>
                <figure className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(10,14,26,0.45)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-40px_rgba(10,14,26,0.45)]">
                  <span className="font-display text-[2.4rem] leading-none text-brand-500">
                    “
                  </span>
                  <blockquote className="mt-2 text-[0.9375rem] leading-relaxed text-[#394150]">
                    {testimonial.quote}
                  </blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-[0.6875rem] font-semibold text-brand-600">
                      {testimonial.initials}
                    </span>
                    <span>
                      <span className="block text-[0.8125rem] font-semibold text-[#0A0E1A]">
                        {testimonial.name}
                      </span>
                      <span className="block text-[0.6875rem] text-[#7B8496]">
                        {testimonial.store}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </MarketingReveal>
            ))}
          </div>
        </MarketingContainer>
      </section>

      {/* Logo cloud */}
      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <MarketingContainer>
          <MarketingReveal>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow tone="light">{c.trustLogos.eyebrow}</Eyebrow>
              <h2 className="font-display mt-4 text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.08] tracking-[-0.03em] text-[#0A0E1A]">
                {c.trustLogos.titleA}{" "}
                <span className="text-brand-600">{c.trustLogos.titleB}</span>
              </h2>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-[#5B6475]">
                {c.trustLogos.description}
              </p>
            </div>
          </MarketingReveal>

          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <MarketingReveal key={index} delay={index * 0.03}>
                <div className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#FAFAFA] text-[0.625rem] font-medium uppercase tracking-[0.12em] text-slate-300 transition-colors hover:border-brand-300 hover:text-brand-400">
                  {locale === "en" ? "Your logo" : "Votre logo"}
                </div>
              </MarketingReveal>
            ))}
          </div>
          <p className="mt-4 text-center text-[0.75rem] text-[#8A93A5]">
            {c.trustLogos.note}
          </p>
        </MarketingContainer>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[#0A0E1A] py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 70% at 50% 100%, rgba(47,92,255,0.35) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.16) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(55% 60% at 50% 70%, #000 20%, transparent 80%)",
          }}
        />
        <MarketingContainer className="relative text-center">
          <MarketingReveal>
            <Eyebrow>{c.cta.eyebrow}</Eyebrow>
            <h2 className="font-display mx-auto mt-6 max-w-4xl text-[clamp(2.6rem,5.2vw,4.8rem)] leading-[0.98] tracking-[-0.045em] text-white">
              {c.cta.titleA}{" "}
              <span className="text-brand-300">{c.cta.titleB}</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-white/50">
              {c.cta.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryLink href={publicHref(locale, "/auth/register")}>
                {c.cta.primary}
              </PrimaryLink>
              <SecondaryLink href={publicHref(locale, "/pricing")}>
                {c.cta.secondary}
              </SecondaryLink>
            </div>
          </MarketingReveal>
        </MarketingContainer>
      </section>
    </>
  );
}
