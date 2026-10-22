"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HeaderSelectors } from "@/components/storefront/header-selectors";
import { Icon, icons } from "@/components/ui/primitives";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

type NavLink = { href: string; label: string };

/** Menu mobile plein écran, fermé au clic sur un lien. */
export function MobileMenu({
  links,
  labels,
  currency,
  locale,
}: {
  links: NavLink[];
  labels: Dictionary["storefront"];
  currency: string;
  locale: Locale;
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.menuOpen}
        title={labels.menuOpen}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-body transition-colors hover:border-border-strong hover:text-fg md:hidden"
      >
        <Icon path={icons.menu} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
      </button>

      {open
        ? createPortal(
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            aria-label={labels.menuClose}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 start-0 flex w-[86%] max-w-sm flex-col border-e border-border bg-bg p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
                {labels.menuOpen}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.menuClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
              >
                <Icon path={icons.close} className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
              </button>
            </div>

            <nav className="mt-8 flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-hairline py-4 text-[1.375rem] font-medium tracking-[-0.02em] text-fg transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto">
              <div className="mb-4 border-t border-hairline pt-4">
                <HeaderSelectors
                  currency={currency}
                  locale={locale}
                  labels={labels}
                  compact
                />
              </div>

              <Link
                href={links[0]?.href ?? "#"}
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-fg px-5 py-3 text-center text-[0.8125rem] font-medium text-bg"
              >
                {labels.continueShopping}
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}
