import Link from "next/link";
import type { ReactNode } from "react";

/** Coquille autonome des pages cadeau, hors navigation de la boutique. */
export function GiftShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-[0.875rem] font-bold text-white">
              P
            </span>
            <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-fg">
              Pashove
            </span>
          </Link>
          <span className="rounded-full border border-border px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">
            Cadeau
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-5 pb-8 text-center text-[0.6875rem] text-faint sm:px-8">
        Pashove · La plateforme des marchands d’Afrique de l’Ouest.
      </footer>
    </div>
  );
}

export function GiftBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "pending" | "success";
}) {
  const classes =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
      : tone === "pending"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-400"
        : "border-border bg-hairline text-subtle";

  return (
    <span
      className={`ms-auto shrink-0 rounded-full border px-2.5 py-1 text-[0.625rem] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
