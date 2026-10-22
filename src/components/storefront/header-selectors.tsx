"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

function Dropdown({
  label,
  value,
  children,
  compact,
}: {
  label: string;
  value: string;
  children: (close: () => void) => ReactNode;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={label}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle transition-colors hover:text-fg",
          compact ? "h-9 px-2.5" : "h-8 px-2",
        )}
      >
        {value}
        <Icon
          path={icons.chevronDown}
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute end-0 z-50 w-48 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]",
            compact ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

/** Sélecteurs de devise et de langue de l'en-tête (et du menu mobile). */
export function HeaderSelectors({
  currency,
  locale,
  labels,
  compact = false,
}: {
  currency: string;
  locale: Locale;
  labels: Dictionary["storefront"];
  compact?: boolean;
}) {
  const pathname = usePathname();

  const hrefFor = (code: Locale) => {
    const parts = pathname.split("/");
    if (parts.length > 1) parts[1] = code;
    return parts.join("/") || `/${code}`;
  };

  return (
    <div className="flex items-center gap-1">
      <Dropdown label={labels.currencyTitle} value={currency} compact={compact}>
        {(close) => (
          <div>
            <p className="px-2.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">
              {labels.currencyTitle}
            </p>
            <button
              type="button"
              onClick={close}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium text-fg hover:bg-hairline"
            >
              {currency}
              <Icon path={icons.check} className="h-3.5 w-3.5 text-accent" strokeWidth={2.4} />
            </button>
            {["EUR", "USD"].map((code) => (
              <span
                key={code}
                aria-disabled="true"
                className="flex w-full items-center justify-between px-2.5 py-2 text-[0.8125rem] text-faint"
              >
                {code}
                <Icon path={icons.lock} className="h-3 w-3" strokeWidth={1.8} />
              </span>
            ))}
            <p className="px-2.5 pb-1.5 pt-2 text-[0.625rem] leading-relaxed text-faint">
              {labels.currencySoon}
            </p>
          </div>
        )}
      </Dropdown>

      <Dropdown label={labels.languageTitle} value={LOCALE_META[locale].short} compact={compact}>
        {(close) => (
          <div>
            <p className="px-2.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">
              {labels.languageTitle}
            </p>
            {LOCALES.map((code) => (
              <Link
                key={code}
                href={hrefFor(code)}
                onClick={close}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[0.8125rem] transition-colors hover:bg-hairline",
                  code === locale ? "font-medium text-fg" : "text-subtle",
                )}
              >
                {LOCALE_META[code].native}
                {code === locale ? (
                  <Icon path={icons.check} className="h-3.5 w-3.5 text-accent" strokeWidth={2.4} />
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </Dropdown>
    </div>
  );
}
