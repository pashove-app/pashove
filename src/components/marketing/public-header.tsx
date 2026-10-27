"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, icons } from "@/components/ui/primitives";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/lib/marketing/content";
import { MarketingLogo, publicHref } from "@/components/marketing/ui";

export function PublicHeader({
  locale,
  content,
}: {
  locale: Locale;
  content: SiteContent;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    { label: content.nav.features, href: publicHref(locale, "/features") },
    { label: content.nav.pricing, href: publicHref(locale, "/pricing") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#04060D]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href={publicHref(locale, "/")} aria-label="Pashove">
          <MarketingLogo />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.8125rem] font-medium text-white/55 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={publicHref(locale, "/auth/login")}
            className="inline-flex h-10 items-center rounded-full px-4 text-[0.8125rem] font-medium text-white/65 transition-colors hover:text-white"
          >
            {content.nav.login}
          </Link>
          <Link
            href={publicHref(locale, "/auth/register")}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[0.8125rem] font-semibold text-[#05070F] transition-transform hover:-translate-y-0.5"
          >
            {content.nav.cta}
            <Icon path={icons.arrowRight} className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={content.nav.menu}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white lg:hidden"
        >
          <Icon path={icons.list} className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>

      {open
        ? createPortal(
        <div className="fixed inset-0 z-[100] bg-[#04060D] lg:hidden">
          <div className="flex h-[4.5rem] items-center justify-between border-b border-white/10 px-5">
            <Link href={publicHref(locale, "/")} onClick={() => setOpen(false)}>
              <MarketingLogo />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={content.nav.close}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
            >
              <Icon path={icons.close} className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-5 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-4 text-[1.375rem] font-medium tracking-[-0.03em] text-white transition-colors hover:bg-white/[0.05]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={publicHref(locale, "/auth/login")}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-4 text-[1rem] font-medium text-white/60"
            >
              {content.nav.login}
            </Link>
          </nav>

          <div className="absolute inset-x-5 bottom-8">
            <Link
              href={publicHref(locale, "/auth/register")}
              onClick={() => setOpen(false)}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[0.875rem] font-semibold text-[#05070F]"
            >
              {content.nav.cta}
              <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
        </div>,
        document.body,
      )
        : null}
    </header>
  );
}
