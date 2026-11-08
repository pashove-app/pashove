import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { MarketingReveal } from "@/components/marketing/animations";
import {
  Eyebrow,
  MarketingContainer,
  PrimaryLink,
  SectionHeading,
  publicHref,
} from "@/components/marketing/ui";
import { resolveLocale, type Locale } from "@/i18n/config";
import { THEME_PRESETS } from "@/lib/theme/presets";

const COPY = {
  fr: {
    eyebrow: "Thèmes",
    titleA: "Des vitrines qui",
    titleB: "te ressemblent.",
    description:
      "Cinq ambiances prêtes à l’emploi. Change les couleurs, la typographie et l’ordre des sections sans toucher au code.",
    use: "Utiliser ce thème",
    fontLabel: "Police",
    controlsEyebrow: "Personnalisation",
    controlsTitleA: "Ta marque,",
    controlsTitleB: "pas un gabarit.",
    controlsText:
      "Chaque thème reste entièrement réglable depuis ton dashboard. Aperçu en direct, publication en un clic.",
    controls: [
      { icon: "palette" as const, title: "Couleurs", text: "Accent, fond, surfaces et texte." },
      { icon: "file" as const, title: "Typographie", text: "Sans, serif ou mono, appliquée partout." },
      { icon: "layers" as const, title: "Sections", text: "Ordre des produits, collections et paquets." },
      { icon: "phone" as const, title: "Mobile d’abord", text: "Chaque thème est pensé pour le téléphone." },
    ],
    ctaTitle: "Prêt à ouvrir ta boutique ?",
    ctaText: "Crée ton compte, choisis un thème, ajoute un produit. Tu peux vendre le jour même.",
    cta: "Créer ma boutique",
    demo: "Voir une boutique en ligne",
  },
  en: {
    eyebrow: "Themes",
    titleA: "Storefronts that",
    titleB: "feel like you.",
    description:
      "Five ready-made moods. Change colours, typography and section order without touching code.",
    use: "Use this theme",
    fontLabel: "Font",
    controlsEyebrow: "Customisation",
    controlsTitleA: "Your brand,",
    controlsTitleB: "not a template.",
    controlsText:
      "Every theme stays fully editable from your dashboard. Live preview, one-click publish.",
    controls: [
      { icon: "palette" as const, title: "Colours", text: "Accent, background, surfaces and text." },
      { icon: "file" as const, title: "Typography", text: "Sans, serif or mono, applied everywhere." },
      { icon: "layers" as const, title: "Sections", text: "Order products, collections and bundles." },
      { icon: "phone" as const, title: "Mobile first", text: "Every theme is designed for the phone." },
    ],
    ctaTitle: "Ready to open your store?",
    ctaText: "Create an account, pick a theme, add a product. You can sell the same day.",
    cta: "Create my store",
    demo: "See a live store",
  },
};

function copyFor(locale: Locale) {
  return locale === "en" ? COPY.en : COPY.fr;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = copyFor(locale);
  const title = `${copy.titleA} ${copy.titleB}`;

  return {
    title,
    description: copy.description,
    alternates: { canonical: `/${locale}/themes` },
    openGraph: {
      title,
      description: copy.description,
      type: "website",
      url: `/${locale}/themes`,
    },
  };
}

function ThemePreview({ preset }: { preset: (typeof THEME_PRESETS)[number] }) {
  const fontClass = preset.font === "serif" ? "font-display" : "font-sans";

  return (
    <div className="p-4" style={{ backgroundColor: "#F4F6FB" }}>
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          backgroundColor: preset.backgroundColor,
          color: preset.foregroundColor,
        }}
      >
        <div className="flex items-center justify-between px-3 pt-3">
          <span className={`text-[0.625rem] font-semibold ${fontClass}`}>
            {preset.name} Store
          </span>
          <span className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: preset.foregroundColor,
                  opacity: 0.35,
                }}
              />
            ))}
          </span>
        </div>

        <div
          className="m-3 rounded-xl p-4"
          style={{ backgroundColor: preset.accentColor }}
        >
          <p className="text-[0.5rem] font-semibold uppercase tracking-[0.16em] opacity-80">
            Nouvelle collection
          </p>
          <p className={`mt-1 text-[0.95rem] leading-tight ${fontClass}`}>
            Des objets qui racontent ton quartier.
          </p>
          <span className="mt-2 inline-flex rounded-full bg-white/20 px-2 py-1 text-[0.5rem] font-medium">
            Découvrir
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="rounded-lg p-2"
              style={{ backgroundColor: preset.surfaceColor }}
            >
              <div
                className="h-10 rounded-md"
                style={{
                  backgroundColor: preset.foregroundColor,
                  opacity: 0.12,
                }}
              />
              <div
                className="mt-1.5 h-1 w-2/3 rounded-full"
                style={{
                  backgroundColor: preset.foregroundColor,
                  opacity: 0.55,
                }}
              />
              <div
                className="mt-1 h-1 w-1/3 rounded-full"
                style={{ backgroundColor: preset.accentColor }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ThemesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = copyFor(locale);

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
          <MarketingContainer className="relative py-16 text-center sm:py-20">
            <MarketingReveal>
              <Eyebrow>{copy.eyebrow}</Eyebrow>
              <h1 className="font-display mx-auto mt-7 max-w-4xl text-[clamp(2.6rem,5.2vw,4.6rem)] leading-[0.98] tracking-[-0.045em] text-white">
                {copy.titleA}{" "}
                <span className="text-brand-300">{copy.titleB}</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-white/55 sm:text-[1.0625rem]">
                {copy.description}
              </p>
            </MarketingReveal>
          </MarketingContainer>
        </div>
      </section>

      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <MarketingContainer>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {THEME_PRESETS.map((preset, index) => (
              <MarketingReveal key={preset.id} delay={index * 0.05}>
                <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_60px_-50px_rgba(10,14,26,0.5)]">
                  <ThemePreview preset={preset} />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className={`text-[1.35rem] leading-none tracking-[-0.02em] text-[#0A0E1A] ${preset.font === "serif" ? "font-display" : ""}`}>
                          {preset.name}
                        </h2>
                        <p className="mt-2 text-[0.8125rem] leading-relaxed text-[#6B7280]">
                          {preset.description}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[0.625rem] font-medium text-[#5B6475]">
                        {preset.font === "serif"
                          ? "Serif"
                          : preset.font === "mono"
                            ? "Mono"
                            : "Sans"}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-1.5">
                      {[
                        preset.accentColor,
                        preset.backgroundColor,
                        preset.surfaceColor,
                        preset.foregroundColor,
                      ].map((color) => (
                        <span
                          key={color}
                          className="h-5 w-5 rounded-full border border-black/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <Link
                      href={publicHref(locale, "/auth/register")}
                      className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-500 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-brand-600"
                    >
                      {copy.use}
                      <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2.2} />
                    </Link>
                  </div>
                </article>
              </MarketingReveal>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section className="border-t border-slate-200 bg-white py-14 sm:py-20">
        <MarketingContainer>
          <MarketingReveal>
            <SectionHeading
              align="center"
              dark={false}
              eyebrow={copy.controlsEyebrow}
              titleA={copy.controlsTitleA}
              titleB={copy.controlsTitleB}
              description={copy.controlsText}
            />
          </MarketingReveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.controls.map((item, index) => (
              <MarketingReveal key={item.title} delay={index * 0.05}>
                <article className="h-full rounded-2xl border border-slate-200 bg-[#FAFAFA] p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/[0.1] text-brand-600">
                    <Icon path={icons[item.icon]} className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 text-[0.9375rem] font-semibold text-[#0A0E1A]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[#6B7280]">
                    {item.text}
                  </p>
                </article>
              </MarketingReveal>
            ))}
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
            <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.04] tracking-[-0.04em] text-white">
              {copy.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/55">
              {copy.ctaText}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryLink href={publicHref(locale, "/auth/register")}>
                {copy.cta}
              </PrimaryLink>
              <Link
                href={publicHref(locale, "/store/maboutie")}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-[0.875rem] font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
              >
                {copy.demo}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
