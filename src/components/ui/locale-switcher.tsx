"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { isLocale, LOCALE_META, LOCALES, type Locale } from "@/i18n/config";

const LOCALE_COOKIE = "pashove_locale";

/** Mémorise le choix pour que la prochaine visite sans préfixe soit redirigée au bon endroit. */
function persistLocale(locale: Locale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${oneYear};samesite=lax`;
}

function swapLocaleInPath(pathname: string, next: Locale): string {
  const segments = pathname.split("/");
  // segments[0] est toujours "" (chemin absolu) ; segments[1] est la langue.
  if (isLocale(segments[1])) {
    segments[1] = next;
  } else {
    segments.splice(1, 0, next);
  }
  return segments.join("/") || `/${next}`;
}

export function LocaleSwitcher({
  locale,
  labels,
  className,
}: {
  locale: Locale;
  labels: { label: string; current: string };
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function select(next: Locale) {
    setOpen(false);
    if (next === locale) return;

    persistLocale(next);
    router.push(swapLocaleInPath(pathname, next));
  }

  const active = LOCALE_META[locale];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={labels.label}
        title={labels.label}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-border-soft bg-hairline px-3",
          "text-[0.8125rem] font-medium text-muted transition-colors",
          "hover:border-border-strong hover:bg-hairline-strong hover:text-fg",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17" />
          <path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
        </svg>
        <span className="hidden sm:inline">{active.short}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        >
          <path d="m6 9.5 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={labels.label}
          className={cn(
            "absolute end-0 top-full z-50 mt-2 w-52 animate-pop overflow-hidden rounded-2xl",
            "border border-border bg-surface p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]",
          )}
        >
          {LOCALES.map((code) => {
            const meta = LOCALE_META[code];
            const selected = code === locale;
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => select(code)}
                  lang={code}
                  dir={meta.dir}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-[0.875rem] transition-colors",
                    selected
                      ? "bg-brand-500/12 font-semibold text-fg"
                      : "text-body hover:bg-hairline hover:text-fg",
                  )}
                >
                  <span className="w-6 shrink-0 text-[0.6875rem] font-semibold uppercase tracking-wider text-subtle">
                    {meta.short}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{meta.native}</span>
                  {selected ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0 text-brand-400"
                      aria-hidden="true"
                    >
                      <path d="m4.5 12.5 5 5 10-11" />
                    </svg>
                  ) : null}
                </button>
              </li>
            );
          })}
          <li className="sr-only">{labels.current}</li>
        </ul>
      ) : null}
    </div>
  );
}
