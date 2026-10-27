import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
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
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 70% at 50% 0%, rgba(47,92,255,0.22) 0%, transparent 65%), linear-gradient(180deg,#04060D 0%,#050A18 100%)",
          }}
        />
        <MarketingContainer className="relative py-20 text-center sm:py-24">
          <Eyebrow>{c.pricing.eyebrow}</Eyebrow>
          <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(2.6rem,5.4vw,4.8rem)] font-medium leading-[0.96] tracking-[-0.055em] text-white">
            {c.pricing.titleA}{" "}
            <span className="bg-gradient-to-r from-white via-brand-200 to-brand-400 bg-clip-text text-transparent">
              {c.pricing.titleB}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[1rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
            {c.pricing.description}
          </p>
        </MarketingContainer>
      </section>

      <section className="py-14 sm:py-20">
        <MarketingContainer>
          <div className="grid gap-4 lg:grid-cols-3">
            {c.pricing.plans.map((plan) => (
              <article
                key={plan.code}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-[1.75rem] border p-6 sm:p-7",
                  plan.popular
                    ? "border-brand-400/45 bg-[linear-gradient(160deg,rgba(47,92,255,0.18),rgba(255,255,255,0.03))] shadow-[0_30px_80px_-40px_rgba(47,92,255,0.7)]"
                    : "border-white/10 bg-white/[0.03]",
                )}
              >
                {plan.popular ? (
                  <span className="absolute right-5 top-5 rounded-full bg-brand-500 px-2.5 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-white">
                    {c.pricing.popular}
                  </span>
                ) : null}

                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-brand-200">
                  {plan.name}
                </p>
                <p className="mt-3 max-w-xs text-[0.8125rem] leading-relaxed text-white/45">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-[2.6rem] font-medium tracking-[-0.055em] text-white">
                    {plan.price}
                  </span>
                  <span className="text-[0.75rem] text-white/40">{plan.period}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/25 bg-brand-500/10 px-3 py-1.5 text-[0.6875rem] font-medium text-brand-200">
                    {plan.commission} {c.pricing.commissionLabel}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.6875rem] text-white/50">
                    {plan.stores}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.6875rem] text-white/50">
                    {plan.team}
                  </span>
                </div>

                <ul className="mt-7 space-y-2.5 border-t border-white/10 pt-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-white/60"
                    >
                      <Icon
                        path={icons.check}
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        strokeWidth={2.2}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={publicHref(locale, "/auth/register")}
                  className={cn(
                    "mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.8125rem] font-semibold transition-transform hover:-translate-y-0.5",
                    plan.popular
                      ? "bg-white text-[#05070F]"
                      : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]",
                  )}
                >
                  {plan.cta}
                  <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2.2} />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4">
            <p className="flex items-start gap-2.5 text-[0.75rem] leading-relaxed text-amber-100/75">
              <Icon path={icons.wallet} className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" strokeWidth={1.8} />
              {c.pricing.paymentStatus}
            </p>
          </div>
          <p className="mt-4 max-w-3xl text-[0.6875rem] leading-relaxed text-white/30">
            {c.pricing.note}
          </p>
        </MarketingContainer>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] py-14 sm:py-18">
        <MarketingContainer>
          <SectionHeading
            eyebrow={c.cta.eyebrow}
            titleA={c.cta.titleA}
            titleB={c.cta.titleB}
            description={c.cta.description}
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href={publicHref(locale, "/auth/register")}>
              {c.cta.primary}
            </PrimaryLink>
            <SecondaryLink href={publicHref(locale, "/features")}>
              {c.nav.features}
            </SecondaryLink>
          </div>
        </MarketingContainer>
      </section>
    </>
  );
}
