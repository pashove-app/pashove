import type { Metadata } from "next";
import Image from "next/image";
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
  MarketingContainer,
  PrimaryLink,
  SecondaryLink,
  SectionHeading,
  publicHref,
} from "@/components/marketing/ui";
import { PublicMediaShowcase } from "@/components/marketing/media-showcase";
import { cn } from "@/lib/cn";
import { resolveLocale } from "@/i18n/config";
import { getSiteContent } from "@/lib/marketing/content";
import { getAboutContent } from "@/lib/marketing/about";
import {
  getTopMerchantsOfMonth,
  initialsFor,
} from "@/lib/marketing/top-merchants";

// Le classement du mois est recalculé côté base ; on rafraîchit la page
// d'accueil au plus une fois par demi-heure.
export const revalidate = 1800;

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
  const about = getAboutContent(locale);
  const topMerchants = await getTopMerchantsOfMonth();
  const miniIcons = [icons.globe, icons.wallet, icons.box, icons.store];

  return (
    <>
      {/* Hero — dark rounded card */}
      <section className="bg-[#FAFAFA] px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 55% at 50% -5%, rgba(47,92,255,0.38) 0%, transparent 65%), radial-gradient(35% 45% at 92% 18%, rgba(92,133,255,0.16) 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.14) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
              maskImage:
                "radial-gradient(75% 65% at 50% 30%, #000 15%, transparent 80%)",
            }}
          />

          <MarketingContainer className="relative pt-14 text-center sm:pt-18">
            <MarketingReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-brand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                {c.hero.eyebrow}
              </span>
            </MarketingReveal>

            <MarketingReveal delay={0.06}>
              <h1 className="font-display mx-auto mt-6 max-w-5xl text-[clamp(2.9rem,6.4vw,5.6rem)] leading-[0.96] tracking-[-0.045em] text-white">
                {c.hero.titleBefore}{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span
                    className="absolute inset-x-[-0.1em] bottom-[0.04em] top-[0.13em] -rotate-[1.2deg] rounded-[0.12em] bg-brand-500"
                    aria-hidden="true"
                  />
                  <span className="relative text-white">{c.hero.titleHighlight}</span>
                </span>{" "}
                {c.hero.titleAfter}
              </h1>
            </MarketingReveal>

            <MarketingReveal delay={0.12}>
              <p className="mx-auto mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
                {c.hero.description}
              </p>
            </MarketingReveal>

            <MarketingReveal delay={0.18}>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
              <div className="mx-auto mt-9 grid max-w-4xl grid-cols-2 gap-x-4 gap-y-4 border-y border-white/10 py-5 sm:grid-cols-4">
                {c.hero.miniStats.map((stat, index) => (
                  <div key={stat.label} className="flex items-center justify-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-brand-200">
                      <Icon path={miniIcons[index] ?? icons.sparkle} className="h-4 w-4" strokeWidth={1.7} />
                    </span>
                    <span className="text-left">
                      <span className="block font-display text-[1.15rem] leading-none tracking-[-0.02em] text-white">
                        {stat.value}
                      </span>
                      <span className="mt-0.5 block text-[0.5625rem] uppercase tracking-[0.1em] text-white/35">
                        {stat.label}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </MarketingReveal>
          </MarketingContainer>

          <div className="relative mx-auto mt-9 w-full max-w-5xl px-4 pb-0 sm:mt-11">
            <MarketingReveal delay={0.28}>
              <MarketingParallax>
                <PublicMediaShowcase
                  poster="/marketing/storefront.png"
                  video="/marketing/demo.mp4"
                  domain={c.hero.mock.store}
                  title={c.hero.videoTitle}
                  caption={c.hero.videoCaption}
                />
              </MarketingParallax>
            </MarketingReveal>
          </div>
        </div>
      </section>

      {/* Product feature rows with real screenshots */}
      <section id="features" className="bg-white py-20 sm:py-28">
        <MarketingContainer>
          <MarketingReveal>
            <SectionHeading
              align="center"
              dark={false}
              eyebrow={c.why.eyebrow}
              titleA={c.why.titleA}
              titleB={c.why.titleB}
              description={c.why.description}
            />
          </MarketingReveal>

          <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
            {c.why.items.map((item, index) => (
              <MarketingReveal key={item.title} delay={0.04}>
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

                    <div className="mt-5 flex flex-wrap items-center gap-4">
                      <PrimaryLink href={publicHref(locale, "/auth/register")}>
                        {item.cta}
                      </PrimaryLink>
                      <Link
                        href={publicHref(locale, "/features")}
                        className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-600 transition-colors hover:text-brand-700"
                      >
                        {item.linkLabel}
                        <Icon path={icons.arrowRight} className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </Link>
                    </div>

                    <figure className="mt-7 rounded-2xl border border-slate-200 bg-[#FAFAFA] p-4">
                      <blockquote className="text-[0.8125rem] leading-relaxed text-[#4B5563]">
                        “{item.quote.text}”
                      </blockquote>
                      <figcaption className="mt-3 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-[0.5625rem] font-semibold text-brand-600">
                          {item.quote.initials}
                        </span>
                        <span>
                          <span className="block text-[0.75rem] font-semibold text-[#0A0E1A]">
                            {item.quote.name}
                          </span>
                          <span className="block text-[0.625rem] text-[#8A93A5]">
                            {item.quote.role}
                          </span>
                        </span>
                      </figcaption>
                    </figure>
                  </div>

                  <div className={cn(index % 2 === 1 && "lg:order-1")}>
                    <div className="group relative rounded-[1.75rem] border border-slate-200 bg-white p-2.5 shadow-[0_30px_80px_-45px_rgba(10,14,26,0.5)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_35px_90px_-40px_rgba(47,92,255,0.35)]">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-[#0A0E1A]">
                        <Image
                          src={item.image}
                          alt={item.imageAlt}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.015]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </MarketingReveal>
            ))}
          </div>
        </MarketingContainer>
      </section>

      {/* Logo cloud */}
      <section className="border-y border-slate-200 bg-[#FAFAFA] py-12 sm:py-16">
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
            {topMerchants.map((merchant, index) => (
              <MarketingReveal key={merchant.id} delay={index * 0.03}>
                <Link
                  href={publicHref(locale, `/store/${merchant.slug}`)}
                  className="group flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 transition-colors hover:border-brand-300 hover:shadow-[0_18px_40px_-30px_rgba(47,92,255,0.45)]"
                >
                  {merchant.logoUrl ? (
                    <Image
                      src={merchant.logoUrl}
                      alt=""
                      width={160}
                      height={48}
                      className="h-9 w-auto max-w-[80%] object-contain"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-[0.6875rem] font-semibold text-brand-600">
                      {initialsFor(merchant.name)}
                    </span>
                  )}
                  <span className="w-full truncate text-center text-[0.6875rem] font-semibold text-[#0A0E1A]">
                    {merchant.name}
                  </span>
                </Link>
              </MarketingReveal>
            ))}

            {Array.from({
              length: Math.max(0, 8 - topMerchants.length),
            }).map((_, index) => (
              <MarketingReveal
                key={`empty-${index}`}
                delay={(topMerchants.length + index) * 0.03}
              >
                <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-3 text-center text-[0.625rem] font-medium uppercase tracking-[0.12em] text-slate-300 transition-colors hover:border-brand-300 hover:text-brand-400">
                  {c.trustLogos.placeholder}
                </div>
              </MarketingReveal>
            ))}
          </div>
          <p className="mt-4 text-center text-[0.75rem] text-[#8A93A5]">
            {c.trustLogos.note}
          </p>
        </MarketingContainer>
      </section>

      {/* Panneau de statistiques sombre */}
      <section className="bg-[#FAFAFA] px-3 py-4 sm:px-5 sm:py-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A] px-5 py-16 sm:px-10 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(45% 55% at 50% 100%, rgba(47,92,255,0.32) 0%, transparent 70%)",
            }}
          />
          <MarketingContainer className="relative text-center">
            <MarketingReveal>
              <Eyebrow>{c.impact.eyebrow}</Eyebrow>
              <h2 className="font-display mx-auto mt-5 max-w-4xl text-[clamp(2.3rem,4.6vw,4rem)] leading-[1.02] tracking-[-0.04em] text-white">
                {c.impact.titleA}{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="absolute inset-x-[-0.08em] bottom-[0.05em] top-[0.15em] -rotate-[1deg] rounded-[0.1em] bg-brand-500" aria-hidden="true" />
                  <span className="relative text-white">{c.impact.titleHighlight}</span>
                </span>{" "}
                <span className="text-brand-200">{c.impact.titleB}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-white/45">
                {c.impact.description}
              </p>
            </MarketingReveal>

            <div className="mx-auto mt-12 grid max-w-4xl gap-y-10 sm:grid-cols-2">
              {c.impactStats.map((stat, index) => (
                <MarketingReveal key={stat.label} delay={index * 0.04}>
                  <div className="flex flex-col items-center text-center">
                    <FeatureIcon icon={stat.icon} className="h-10 w-10 rounded-full" />
                    <p className="font-display mt-4 text-[2.3rem] leading-none tracking-[-0.04em] text-white sm:text-[2.8rem]">
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
                    <p className="mt-2 text-[0.875rem] font-medium text-white/75">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-[0.75rem] text-white/30">{stat.detail}</p>
                  </div>
                </MarketingReveal>
              ))}
            </div>
          </MarketingContainer>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <MarketingContainer>
          <MarketingReveal>
            <SectionHeading
              align="center"
              dark={false}
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
                  <span className="font-display text-[2.4rem] leading-none text-brand-500">“</span>
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

      {/* Founder conviction */}
      <section className="bg-[#FAFAFA] pb-14 pt-3 sm:pb-16 sm:pt-4">
        <MarketingContainer>
          <MarketingReveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A] px-5 py-14 text-center sm:px-10 sm:py-18">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(45% 70% at 50% 100%, rgba(47,92,255,0.3) 0%, transparent 72%)",
                }}
              />
              <div className="relative mx-auto max-w-3xl">
                <Image
                  src="/about/ibrahim-avatar.jpg"
                  alt="Ibrahim Sidibé, initiateur de Pashove"
                  width={100}
                  height={100}
                  className="mx-auto h-[100px] w-[100px] rounded-full border-2 border-white/15 object-cover shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]"
                />
                <p className="mt-6 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-300">
                  {about.home.title}
                </p>
                <blockquote className="font-display mx-auto mt-4 max-w-2xl text-[clamp(1.7rem,3.4vw,2.8rem)] leading-[1.15] tracking-[-0.03em] text-white">
                  “{about.home.quote}”
                </blockquote>
                <Link
                  href={publicHref(locale, "/about")}
                  className="mt-6 inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-brand-200 transition-colors hover:text-white"
                >
                  {about.home.link}
                  <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2.2} />
                </Link>
              </div>
            </div>
          </MarketingReveal>
        </MarketingContainer>
      </section>

      {/* Appel à l’action clair */}
      <section className="border-t border-slate-200 bg-white py-14 sm:py-20">
        <MarketingContainer className="text-center">
          <MarketingReveal>
            <Eyebrow tone="light">{c.cta.eyebrow}</Eyebrow>
            <h2 className="font-display mx-auto mt-5 max-w-4xl text-[clamp(2.4rem,4.8vw,4.2rem)] leading-[0.99] tracking-[-0.045em] text-[#0A0E1A]">
              {c.cta.titleA}{" "}
              <span className="text-brand-600">{c.cta.titleB}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-[#5B6475]">
              {c.cta.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryLink href={publicHref(locale, "/auth/register")}>
                {c.cta.primary}
              </PrimaryLink>
              <SecondaryLink href={publicHref(locale, "/pricing")} tone="light">
                {c.cta.secondary}
              </SecondaryLink>
            </div>
          </MarketingReveal>
        </MarketingContainer>
      </section>
    </>
  );
}
