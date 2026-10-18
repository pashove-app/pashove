"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NAV_ALL } from "@/components/dashboard/nav";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

type Entry = {
  key: string;
  label: string;
  href: string;
  icon: IconKey;
};

const PaletteContext = createContext<{ open: () => void } | null>(null);

/** Ouvre la palette depuis n'importe quel composant de la coquille. */
export function useCommandPalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error("useCommandPalette doit être utilisé sous CommandPaletteProvider");
  }
  return context;
}

/**
 * Palette de commandes (⌘K).
 *
 * Elle ne cherche pas encore dans les données — il n'y a ni produits ni
 * commandes. Elle navigue entre les sections et les actions réelles, au
 * clavier. Le jour où les données existeront, les résultats s'ajouteront à la
 * même liste.
 */
export function CommandPaletteProvider({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: Dictionary;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const entries = useMemo<Entry[]>(
    () => [
      ...NAV_ALL.map((item) => ({
        key: item.key,
        label: t.dashboard.nav[item.key],
        href: item.href,
        icon: item.icon,
      })),
      {
        key: "storeSettings",
        label: t.dashboard.palette.storeSettings,
        href: "/app/settings/store",
        icon: "store",
      },
      {
        key: "security",
        label: t.dashboard.palette.security,
        href: "/auth/security",
        icon: "shield",
      },
    ],
    [t],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <PaletteContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}

      {isOpen ? (
        <PaletteDialog
          t={t}
          entries={entries}
          onClose={() => setIsOpen(false)}
          onNavigate={(href) => {
            setIsOpen(false);
            router.push(path(locale, href));
          }}
        />
      ) : null}
    </PaletteContext.Provider>
  );
}

function PaletteDialog({
  t,
  entries,
  onClose,
  onNavigate,
}: {
  t: Dictionary;
  entries: Entry[];
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = entries.filter((entry) =>
    entry.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((index) => Math.min(index + 1, filtered.length - 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        return;
      }

      if (event.key === "Enter") {
        const entry = filtered[active];
        if (entry) onNavigate(entry.href);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtered, active, onClose, onNavigate]);

  return (
    <div
      role="presentation"
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-[14vh] backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.dashboard.palette.placeholder}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Icon path={icons.search} className="h-4 w-4 shrink-0 text-faint" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder={t.dashboard.palette.placeholder}
            className="h-12 w-full bg-transparent text-[0.9375rem] text-fg placeholder:text-faint focus:outline-none"
          />
          <kbd className="shrink-0 rounded-md border border-border-soft px-1.5 py-0.5 font-mono text-[0.625rem] text-faint">
            esc
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-[0.8125rem] text-subtle">
              {t.dashboard.palette.empty}
            </li>
          ) : (
            filtered.map((entry, index) => (
              <li key={entry.key}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => onNavigate(entry.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-[0.8125rem] transition-colors",
                    index === active
                      ? "bg-hairline-strong text-fg"
                      : "text-muted hover:bg-hairline",
                  )}
                >
                  <Icon
                    path={icons[entry.icon]}
                    className="h-4 w-4 shrink-0 text-accent"
                    strokeWidth={1.8}
                  />
                  {entry.label}
                </button>
              </li>
            ))
          )}
        </ul>

        <p className="border-t border-border px-4 py-2 text-[0.6875rem] text-faint">
          {t.dashboard.palette.hint}
        </p>
      </div>
    </div>
  );
}
