import type { Metadata } from "next";
import Link from "next/link";
import { MarketingReveal } from "@/components/marketing/animations";
import {
  Eyebrow,
  FeatureIcon,
  MarketingContainer,
  PrimaryLink,
  SecondaryLink,
  publicHref,
} from "@/components/marketing/ui";
import { cn } from "@/lib/cn";
import { resolveLocale } from "@/i18n/config";
import { getSiteContent } from "@/lib/marketing/content";

const ANCHORS = ["boutique", "vendre", "grandir", "piloter"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const content = getSiteContent(locale);

  return {
    title: content.meta.featuresTitle,
    description: content.meta.featuresDescription,
    alternates: { canonical: `/${locale}/features` },
    openGraph: {
      title: content.meta.featuresTitle,
      description: content.meta.featuresDescription,
      type: "website",
      url: `/${locale}/features`,
    },
  };
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const c = getSiteContent(locale);

  return (
    <>
      <section className="bg-[#FAFAFA] px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0E1A]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 75% -5%, rgba(47,92,255,0.32) 0%, transparent 65%), linear-gradient(180deg,#05070D 0%,#080D18 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.16) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(65% 70% at 40% 20%, #000 15%, transparent 80%)",
          }}
        />
        <MarketingContainer className="relative py-20 sm:py-24">
          <MarketingReveal>
            <Eyebrow>{c.featuresPage.eyebrow}</Eyebrow>
            <h1 className="font-display mt-7 max-w-4xl text-[clamp(2.8rem,5.8vw,5.2rem)] leading-[0.98] tracking-[-0.045em] text-white">
              {c.featuresPage.titleA}{" "}
              <span className="text-brand-300">{c.featuresPage.titleB}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
              {c.featuresPage.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {c.featuresPage.groups.map((group, index) => (
                <Link
                  key={group.title}
                  href={`#${ANCHORS[index]}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[0.6875rem] font-medium text-white/50 transition-colors hover:border-brand-400/30 hover:text-white"
                >
                  {group.title}
                </Link>
              ))}
            </div>
          </MarketingReveal>
        </MarketingContainer>
        </div>
      </section>

      {c.featuresPage.groups.map((group, index) => (
        <section
          key={group.title}
          id={ANCHORS[index]}
          className={cn(
            "scroll-mt-24 py-16 sm:py-20",
            index % 2 === 1 ? "border-y border-slate-200 bg-[#F4F6FB]" : "bg-[#FAFAFA]",
          )}
        >
          <MarketingContainer>
            <MarketingReveal>
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <Eyebrow tone="light">
                    0{index + 1} · {group.title}
                  </Eyebrow>
                  <h2 className="font-display mt-3 max-w-2xl text-[clamp(1.8rem,3.2vw,2.75rem)] leading-[1.06] tracking-[-0.035em] text-[#0A0E1A]">
                    {group.text}
                  </h2>
                </div>
              </div>
            </MarketingReveal>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {group.items.map((item, itemIndex) => (
                <MarketingReveal key={item.title} delay={itemIndex * 0.04}>
                  <article className="group flex h-full gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-42px_rgba(10,14,26,0.5)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_24px_55px_-40px_rgba(47,92,255,0.35)] sm:p-6">
                    <FeatureIcon icon={item.icon} tone="light" className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[0.9375rem] font-semibold text-[#0A0E1A]">
                          {item.title}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[#6B7280]">
                        {item.text}
                      </p>
                    </div>
                  </article>
                </MarketingReveal>
              ))}
            </div>
          </MarketingContainer>
        </section>
      ))}

      <section className="bg-[#0A0E1A] py-16 sm:py-20">
        <MarketingContainer>
          <MarketingReveal>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-10">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                  <Eyebrow>{c.featuresPage.roadmapTitle}</Eyebrow>
                  <p className="mt-3 text-[0.875rem] leading-relaxed text-white/50">
                    {c.featuresPage.roadmapText}
                  </p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {c.featuresPage.roadmap.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[0.6875rem] text-white/55"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </MarketingReveal>

        </MarketingContainer>
      </section>

      <section className="border-t border-slate-200 bg-white py-20 sm:py-24">
        <MarketingContainer className="text-center">
          <MarketingReveal>
            <Eyebrow tone="light">{c.cta.eyebrow}</Eyebrow>
            <h2 className="font-display mx-auto mt-4 max-w-3xl text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.02] tracking-[-0.04em] text-[#0A0E1A]">
              {c.cta.titleA}{" "}
              <span className="text-brand-600">{c.cta.titleB}</span>
            </h2>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
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
