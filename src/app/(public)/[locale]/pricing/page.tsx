import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { MarketingReveal } from "@/components/marketing/animations";
import {
  Eyebrow,
  MarketingContainer,
  PrimaryLink,
  SecondaryLink,
  SectionHeading,
  publicHref,
} from "@/components/marketing/ui";
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
    title: content.meta.pricingTitle,
    description: content.meta.pricingDescription,
    alternates: { canonical: `/${locale}/pricing` },
    openGraph: {
      title: content.meta.pricingTitle,
      description: content.meta.pricingDescription,
      type: "website",
      url: `/${locale}/pricing`,
    },
  };
}

export default async function PricingPage({
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
              "radial-gradient(70% 70% at 50% -10%, rgba(47,92,255,0.32) 0%, transparent 65%), linear-gradient(180deg,#05070D 0%,#080D18 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.16) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(65% 70% at 50% 20%, #000 15%, transparent 80%)",
          }}
        />
        <MarketingContainer className="relative py-20 text-center sm:py-26">
          <MarketingReveal>
            <Eyebrow>{c.pricing.eyebrow}</Eyebrow>
            <h1 className="font-display mx-auto mt-7 max-w-5xl text-[clamp(2.8rem,5.8vw,5.2rem)] leading-[0.98] tracking-[-0.045em] text-white">
              {c.pricing.titleA}{" "}
              <span className="text-brand-300">{c.pricing.titleB}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
              {c.pricing.description}
            </p>
          </MarketingReveal>
        </MarketingContainer>
        </div>
      </section>

      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <MarketingContainer>
          <div className="grid gap-4 lg:grid-cols-3">
            {c.pricing.plans.map((plan, index) => (
              <MarketingReveal key={plan.code} delay={index * 0.07}>
                <article
                  className={cn(
                    "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-white p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 sm:p-7",
                    plan.popular
                      ? "border-brand-500 shadow-[0_30px_80px_-45px_rgba(47,92,255,0.55)]"
                      : "border-slate-200 shadow-[0_18px_50px_-45px_rgba(10,14,26,0.45)]",
                  )}
                >
                  {plan.popular ? (
                    <span className="absolute right-5 top-5 rounded-full bg-brand-500 px-2.5 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-white">
                      {c.pricing.popular}
                    </span>
                  ) : null}

                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-brand-600">
                    {plan.name}
                  </p>
                  <p className="mt-3 max-w-xs text-[0.8125rem] leading-relaxed text-[#6B7280]">
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-[2.8rem] leading-none tracking-[-0.04em] text-[#0A0E1A]">
                      {plan.price}
                    </span>
                    <span className="text-[0.75rem] text-[#8A93A5]">{plan.period}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1.5 text-[0.6875rem] font-semibold text-brand-700">
                      {plan.commission} {c.pricing.commissionLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-[#FAFAFA] px-3 py-1.5 text-[0.6875rem] text-[#5B6475]">
                      {plan.stores}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-[#FAFAFA] px-3 py-1.5 text-[0.6875rem] text-[#5B6475]">
                      {plan.team}
                    </span>
                  </div>

                  <ul className="mt-7 space-y-2.5 border-t border-slate-100 pt-6">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-[#4B5563]"
                      >
                        <Icon
                          path={icons.check}
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                          strokeWidth={2.2}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={publicHref(locale, "/auth/register")}
                    className={cn(
                      "mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.8125rem] font-semibold transition-[transform,background-color] hover:-translate-y-0.5",
                      plan.popular
                        ? "bg-brand-500 text-white shadow-[0_16px_35px_-14px_rgba(47,92,255,0.7)] hover:bg-brand-600"
                        : "border border-slate-300 bg-white text-[#0A0E1A] hover:border-slate-400 hover:bg-slate-50",
                    )}
                  >
                    {plan.cta}
                    <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2.2} />
                  </Link>
                </article>
              </MarketingReveal>
            ))}
          </div>

          <MarketingReveal>
            <div className="mt-6 rounded-2xl border border-brand-500/20 bg-brand-50 px-5 py-4">
              <p className="flex items-start gap-2.5 text-[0.75rem] leading-relaxed text-brand-900/80">
                <Icon path={icons.wallet} className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={1.8} />
                {c.pricing.paymentStatus}
              </p>
            </div>
            <p className="mt-4 max-w-3xl text-[0.6875rem] leading-relaxed text-[#8A93A5]">
              {c.pricing.note}
            </p>
          </MarketingReveal>
        </MarketingContainer>
      </section>

      <section className="border-t border-slate-200 bg-white py-14 sm:py-20">
        <MarketingContainer className="text-center">
          <MarketingReveal>
            <SectionHeading
              align="center"
              dark={false}
              eyebrow={c.cta.eyebrow}
              titleA={c.cta.titleA}
              titleB={c.cta.titleB}
              description={c.cta.description}
            />
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryLink href={publicHref(locale, "/auth/register")}>
                {c.cta.primary}
              </PrimaryLink>
              <SecondaryLink href={publicHref(locale, "/features")} tone="light">
                {c.nav.features}
              </SecondaryLink>
            </div>
          </MarketingReveal>
        </MarketingContainer>
      </section>
    </>
  );
}
