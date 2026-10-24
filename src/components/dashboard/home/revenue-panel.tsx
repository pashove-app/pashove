"use client";

import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

const PERIODS = ["day", "week", "month", "year"] as const;
type Period = (typeof PERIODS)[number];

/**
 * Panneau des revenus.
 *
 * Le graphique est vide parce qu'il n'y a aucune vente — pas parce qu'il est en
 * construction. Le sélecteur change réellement la période affichée ; le montant,
 * lui, reste zéro tant que le ledger n'existe pas.
 */
export function RevenuePanel({
  t,
  amount,
}: {
  t: Dictionary;
  /** Montant déjà mis en forme sur le serveur. */
  amount: string;
}) {
  const [period, setPeriod] = useState<Period>("month");

  const label = t.dashboard.home.revenueAmount
    .replace("{period}", t.dashboard.home.periodLabels[period])
    .replace("{amount}", amount);

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {t.dashboard.home.revenueTitle}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] text-subtle">
            <Icon path={icons.arrowUp} className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
            {t.dashboard.home.revenueEmpty}
          </p>
        </div>

        <div
          role="group"
          aria-label={t.dashboard.home.revenueTitle}
          className="flex gap-1 rounded-full border border-border bg-bg-soft p-1"
        >
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={cn(
                "rounded-full px-3 py-1.5 text-[0.75rem] font-medium transition-colors",
                period === value
                  ? "bg-surface text-fg shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                  : "text-subtle hover:text-fg",
              )}
            >
              {t.dashboard.home.periods[value]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 inline-flex rounded-full bg-hairline px-3 py-1.5 text-[0.75rem] font-medium text-body">
        {label}
      </p>

      <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-soft/40 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/[0.1] text-accent">
          <Icon path={icons.chart} className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-subtle">
          {t.dashboard.home.revenuePlaceholder}
        </p>
      </div>
    </section>
  );
}
