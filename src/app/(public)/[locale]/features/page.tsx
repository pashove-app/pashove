import type { Metadata } from "next";
import Link from "next/link";
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
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 75% 0%, rgba(47,92,255,0.26) 0%, transparent 62%), linear-gradient(180deg,#04060D 0%,#050A18 100%)",
          }}
        />
        <MarketingContainer className="relative py-20 sm:py-24">
          <Eyebrow>{c.featuresPage.eyebrow}</Eyebrow>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.6rem,5.4vw,4.8rem)] font-medium leading-[0.96] tracking-[-0.055em] text-white">
            {c.featuresPage.titleA}{" "}
            <span className="bg-gradient-to-r from-white via-brand-200 to-brand-400 bg-clip-text text-transparent">
              {c.featuresPage.titleB}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
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
        </MarketingContainer>
      </section>

      {c.featuresPage.groups.map((group, index) => (
        <section
          key={group.title}
          id={ANCHORS[index]}
          className={cn(
            "scroll-mt-24 py-16 sm:py-20",
            index % 2 === 1 && "border-y border-white/10 bg-white/[0.02]",
          )}
        >
          <MarketingContainer>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
                  0{index + 1} · {group.title}
                </p>
                <h2 className="mt-2 text-[1.75rem] font-medium tracking-[-0.04em] text-white sm:text-[2.25rem]">
                  {group.text}
                </h2>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <article
                  key={item.title}
                  className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-400/25 hover:bg-white/[0.05] sm:p-6"
                >
                  <FeatureIcon icon={item.icon} className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[0.9375rem] font-medium text-white">
                        {item.title}
                      </h3>
                      {"badge" in item && item.badge ? (
                        <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-amber-200">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-white/45">
                      {item.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </MarketingContainer>
        </section>
      ))}

      <section className="py-16 sm:py-20">
        <MarketingContainer>
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(150deg,rgba(47,92,255,0.14),rgba(255,255,255,0.025))] p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
                  {c.featuresPage.roadmapTitle}
                </p>
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

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
                {c.cta.eyebrow}
              </p>
              <h2 className="mt-2 text-[1.75rem] font-medium tracking-[-0.04em] text-white sm:text-[2.25rem]">
                {c.cta.titleA} <span className="text-white/35">{c.cta.titleB}</span>
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryLink href={publicHref(locale, "/auth/register")}>
                {c.cta.primary}
              </PrimaryLink>
              <SecondaryLink href={publicHref(locale, "/pricing")}>
                {c.cta.secondary}
              </SecondaryLink>
            </div>
          </div>
        </MarketingContainer>
      </section>
    </>
  );
}
