import Link from "next/link";
import type { ReactNode } from "react";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";

export function publicHref(locale: Locale, path: string): string {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:") ||
    path.startsWith("/legal")
  ) {
    return path;
  }

  return `/${locale}${path === "/" ? "" : path}`;
}

export function MarketingContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-200">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  titleA,
  titleB,
  description,
  align = "start",
  dark = true,
}: {
  eyebrow: string;
  titleA: string;
  titleB: string;
  description?: string;
  align?: "start" | "center";
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        className={cn(
          "mt-5 text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.045em]",
          dark ? "text-white" : "text-[#0B101B]",
        )}
      >
        {titleA}
        <br />
        <span className="bg-gradient-to-r from-brand-200 via-brand-300 to-white bg-clip-text text-transparent">
          {titleB}
        </span>
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-[0.9375rem] leading-relaxed sm:text-[1.0625rem]",
            dark ? "text-white/60" : "text-[#4C5567]",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[0.8125rem] font-semibold text-[#05070F] shadow-[0_18px_45px_-18px_rgba(255,255,255,0.45)] transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
      <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2.2} />
    </Link>
  );
}

export function SecondaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 text-[0.8125rem] font-medium text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function FeatureIcon({
  icon,
  className,
}: {
  icon: IconKey;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-500/10 text-brand-200",
        className,
      )}
    >
      <Icon path={icons[icon]} className="h-5 w-5" strokeWidth={1.7} />
    </span>
  );
}

export function MarketingLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center text-white", className)}>
      <PashoveLogo
        className="gap-2.5"
        markClassName="h-7 w-7 text-brand-300"
        wordClassName="text-[1.35rem] font-medium tracking-[-0.04em] text-white"
      />
    </span>
  );
}

export function HeroMockup({
  labels,
}: {
  labels: {
    store: string;
    eyebrow: string;
    title: string;
    text: string;
    product1: string;
    product1Price: string;
    product2: string;
    product2Price: string;
    order: string;
    orderAmount: string;
    chat: string;
    chatName: string;
    badges: string[];
    home: string;
    collections: string;
    discover: string;
    codLabel: string;
  };
}) {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
      <div className="absolute -inset-8 rounded-[3rem] bg-brand-500/15 blur-3xl" aria-hidden="true" />
      <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.045] p-2.5 shadow-[0_45px_120px_-45px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#080D18]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFD166]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]/80" />
            </span>
            <span className="mx-auto flex h-7 w-[60%] max-w-64 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[0.5625rem] text-white/45">
              {labels.store}
            </span>
            <span className="h-6 w-6 rounded-full bg-white/10" />
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] font-semibold tracking-[-0.02em] text-white">
                Pashove
              </span>
              <span className="flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.14em] text-white/35">
                {labels.home} <span className="h-1 w-1 rounded-full bg-white/30" /> {labels.collections}
              </span>
            </div>

            <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#1D4ED8_0%,#0B1C56_55%,#071026_100%)] p-5">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.08) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <p className="relative text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-white/60">
                {labels.eyebrow}
              </p>
              <p className="relative mt-2 max-w-[18rem] text-[1.05rem] font-medium leading-tight tracking-[-0.03em] text-white">
                {labels.title}
              </p>
              <p className="relative mt-2 max-w-[17rem] text-[0.625rem] leading-relaxed text-white/65">
                {labels.text}
              </p>
              <span className="relative mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-[0.5625rem] font-semibold text-[#0B101B]">
                {labels.discover}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[
                { name: labels.product1, price: labels.product1Price, tone: "from-[#4B2E2E] to-[#1C1010]" },
                { name: labels.product2, price: labels.product2Price, tone: "from-[#11304A] to-[#08131D]" },
              ].map((product) => (
                <div key={product.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  <div className={`aspect-[4/3] rounded-lg bg-gradient-to-br ${product.tone}`}>
                    <div className="flex h-full items-center justify-center">
                      <span className="h-8 w-8 rounded-full border border-white/20 bg-white/10" />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-[0.625rem] font-medium text-white">{product.name}</p>
                  <p className="text-[0.5625rem] text-white/45">{product.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -left-3 hidden w-52 rounded-2xl border border-emerald-400/20 bg-[#07130F]/95 p-3 shadow-2xl backdrop-blur sm:block">
        <p className="flex items-center gap-1.5 text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {labels.order}
        </p>
        <p className="mt-1.5 text-[0.875rem] font-semibold text-white">{labels.orderAmount}</p>
        <p className="mt-0.5 text-[0.5625rem] text-white/40">{labels.codLabel}</p>
      </div>

      <div className="absolute -right-3 top-24 hidden w-56 rounded-2xl border border-white/10 bg-[#0B101B]/95 p-3 shadow-2xl backdrop-blur sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-[0.5625rem] font-semibold text-brand-200">
            A
          </span>
          <p className="text-[0.5625rem] font-medium text-white/70">{labels.chatName}</p>
        </div>
        <p className="mt-2 text-[0.625rem] leading-relaxed text-white/60">{labels.chat}</p>
      </div>

      <div className="absolute -bottom-4 right-4 hidden flex-wrap justify-end gap-1.5 sm:flex">
        {labels.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-white/10 bg-[#0B101B]/90 px-2.5 py-1 text-[0.5rem] font-medium text-white/60 backdrop-blur"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
