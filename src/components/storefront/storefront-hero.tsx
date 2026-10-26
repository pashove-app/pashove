"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { BRAND_GRID } from "@/components/storefront/brand";
import { Container } from "@/components/storefront/container";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PublicStore } from "@/lib/storefront/queries";

/**
 * Bannière d'accueil.
 *
 * Le titre et le sous-titre sont superposés à l'image, avec un dégradé sombre
 * qui garantit la lisibilité. Sans image, un fond de marque prend le relais :
 * la vitrine reste éditoriale, jamais nue.
 */
export function StorefrontHero({
  store,
  bannerUrl,
  labels,
}: {
  store: PublicStore;
  bannerUrl: string | null;
  labels: Dictionary["storefront"];
}) {
  const title = store.hero_title ?? store.name;
  const subtitle = store.hero_subtitle ?? store.description;

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-panel-to)]">
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(120% 85% at 16% 6%, var(--color-grad-1) 0%, transparent 52%), radial-gradient(110% 80% at 100% 100%, var(--color-grad-3) 0%, transparent 62%), linear-gradient(158deg, var(--color-grad-1) 0%, var(--color-grad-2) 52%, var(--color-grad-3) 100%)",
            }}
          />
          <div className={`absolute inset-0 ${BRAND_GRID}`} aria-hidden="true" />
          <svg
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className="absolute end-[-6%] top-1/2 w-[46%] max-w-[28rem] -translate-y-1/2 text-white/10"
          >
            <path
              d="M10.5 19.5 20 10l9.5 9.5"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.5 28 20 21.5 26.5 28"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" aria-hidden="true" />

      <Container className="relative flex min-h-[500px] flex-col justify-end pb-16 pt-28 sm:min-h-[580px] sm:pb-20">
        <motion.p
          {...enter(0)}
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/75"
        >
          {store.category ?? labels.navNew}
        </motion.p>

        <motion.h1
          {...enter(0.08)}
          className="mt-4 max-w-3xl text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[0.98] tracking-[-0.045em] text-white"
        >
          {title}
        </motion.h1>

        {subtitle ? (
          <motion.p
            {...enter(0.16)}
            className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-white/80 sm:text-[1.0625rem]"
          >
            {subtitle}
          </motion.p>
        ) : null}

        <motion.div {...enter(0.24)} className="mt-8 flex flex-wrap gap-3">
          <a
            href="#products"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-[0.8125rem] font-medium text-[#111] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {labels.heroCta}
          </a>

        </motion.div>
      </Container>
    </section>
  );
}
