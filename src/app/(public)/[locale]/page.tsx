import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import {
  FeatureIcon,
  HeroMockup,
  MarketingContainer,
  PrimaryLink,
  SecondaryLink,
  SectionHeading,
  publicHref,
} from "@/components/marketing/ui";
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
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 60% at 72% 10%, rgba(47,92,255,0.30) 0%, transparent 60%), radial-gradient(60% 50% at 15% 35%, rgba(92,133,255,0.14) 0%, transparent 65%), linear-gradient(180deg, #04060D 0%, #050A18 58%, #04060D 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(80% 70% at 50% 35%, #000 20%, transparent 80%)",
          }}
        />

        <MarketingContainer className="relative grid gap-14 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {c.hero.eyebrow}
            </span>

            <h1 className="mt-7 text-[clamp(2.55rem,4.7vw,4.15rem)] font-medium leading-[0.94] tracking-[-0.06em] text-white">
              {c.hero.titleA}
              <br />
              <span className="bg-gradient-to-r from-white via-brand-200 to-brand-400 bg-clip-text text-transparent">
                {c.hero.titleB}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[1rem] leading-relaxed text-white/60 sm:text-[1.125rem]">
              {c.hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryLink href={publicHref(locale, "/auth/register")}>
                {c.hero.primary}
              </PrimaryLink>
              <SecondaryLink href={publicHref(locale, "/auth/login")}>
                {c.hero.secondary}
              </SecondaryLink>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {c.hero.trust.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 text-[0.75rem] text-white/45"
                >
                  <Icon path={icons.check} className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <HeroMockup labels={c.hero.mock} />
        </MarketingContainer>
      </section>

      <section className="border-b border-white/10 bg-white/[0.02]">
        <MarketingContainer className="grid gap-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {c.hero.stats.map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-3">
              <span className="text-[1.5rem] font-medium tracking-[-0.04em] text-white">
                {value}
              </span>
              <span className="text-[0.75rem] leading-relaxed text-white/40">
                {label}
              </span>
            </div>
          ))}
        </MarketingContainer>
      </section>

      <section id="why" className="relative py-20 sm:py-28">
        <MarketingContainer>
          <SectionHeading
            eyebrow={c.why.eyebrow}
            titleA={c.why.titleA}
            titleB={c.why.titleB}
            description={c.why.description}
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.why.items.map((item, index) => (
              <article
                key={item.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-brand-400/30 hover:bg-white/[0.055] sm:p-6"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <FeatureIcon icon={item.icon} />
                <h3 className="mt-5 text-[1rem] font-medium text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/50">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section className="border-y border-white/10 bg-[#050912] py-20 sm:py-28">
        <MarketingContainer>
          <SectionHeading
            eyebrow={c.how.eyebrow}
            titleA={c.how.titleA}
            titleB={c.how.titleB}
            description={c.how.description}
          />

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {c.how.items.map((item, index) => (
              <article
                key={item.title}
                className="relative rounded-3xl border border-white/10 bg-white/[0.035] p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-400/25 bg-brand-500/10 text-[0.75rem] font-semibold text-brand-200">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-[1.125rem] font-medium text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/50">
                  {item.text}
                </p>
                {index < c.how.items.length - 1 ? (
                  <Icon
                    path={icons.arrowRight}
                    className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/25 lg:block rtl:rotate-180"
                    strokeWidth={1.8}
                  />
                ) : null}
              </article>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section id="features" className="py-20 sm:py-28">
        <MarketingContainer>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={c.features.eyebrow}
              titleA={c.features.titleA}
              titleB={c.features.titleB}
              description={c.features.description}
            />
            <Link
              href={publicHref(locale, "/features")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-[0.8125rem] font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              {c.features.cta}
              <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.items.map((item) => (
              <Link
                key={item.title}
                href={publicHref(locale, "/features")}
                className="group flex gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-400/30 hover:bg-white/[0.055] sm:p-6"
              >
                <FeatureIcon icon={item.icon} className="h-10 w-10 shrink-0 rounded-xl" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[0.9375rem] font-medium text-white">
                    {item.title}
                    <Icon
                      path={icons.arrowUpRight}
                      className="h-3.5 w-3.5 text-white/20 transition-colors group-hover:text-brand-200"
                      strokeWidth={2}
                    />
                  </span>
                  <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-white/45">
                    {item.text}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section className="border-y border-white/10 bg-[#050912] py-20 sm:py-24">
        <MarketingContainer>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
                {c.pricing.eyebrow}
              </p>
              <h2 className="mt-3 text-[2rem] font-medium tracking-[-0.04em] text-white sm:text-[2.5rem]">
                {c.pricing.titleA} <span className="text-white/35">{c.pricing.titleB}</span>
              </h2>
            </div>
            <Link
              href={publicHref(locale, "/pricing")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-[0.8125rem] font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              {c.cta.secondary}
              <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {c.pricing.plans.map((plan) => (
              <div
                key={plan.code}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <p className="text-[0.75rem] font-medium text-white/55">{plan.name}</p>
                <p className="mt-2 text-[1.5rem] font-medium tracking-[-0.04em] text-white">
                  {plan.price} <span className="text-[0.75rem] font-normal text-white/35">{plan.period}</span>
                </p>
                <p className="mt-2 text-[0.75rem] text-brand-200">{plan.commission} {c.pricing.commissionLabel}</p>
              </div>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section className="py-20 sm:py-28">
        <MarketingContainer>
          <div className="relative overflow-hidden rounded-[2rem] border border-brand-400/20 bg-[linear-gradient(120deg,#0B1C56_0%,#071026_55%,#04060D_100%)] px-6 py-12 sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(60% 100% at 80% 0%, rgba(92,133,255,.5) 0%, transparent 70%)",
              }}
            />
            <div className="relative max-w-2xl">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
                {c.cta.eyebrow}
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.05em] text-white">
                {c.cta.titleA} <span className="text-white/40">{c.cta.titleB}</span>
              </h2>
              <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/55">
                {c.cta.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <PrimaryLink href={publicHref(locale, "/auth/register")}>
                  {c.cta.primary}
                </PrimaryLink>
                <SecondaryLink href={publicHref(locale, "/pricing")}>
                  {c.cta.secondary}
                </SecondaryLink>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </section>
    </>
  );
}
