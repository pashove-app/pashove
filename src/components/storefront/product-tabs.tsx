"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

export type ProductTab = {
  id: string;
  label: string;
  content: ReactNode;
};

/** Onglets de la fiche produit, avec un fondu léger au changement. */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const reduce = useReducedMotion();
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  if (!current) return null;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Informations produit"
        className="flex flex-wrap gap-6 border-b border-border"
      >
        {tabs.map((tab) => {
          const selected = tab.id === current.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={cn(
                "-mb-px border-b-2 pb-3 text-[0.8125rem] font-medium transition-colors",
                selected
                  ? "border-fg text-fg"
                  : "border-transparent text-subtle hover:text-fg",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <motion.div
        key={current.id}
        role="tabpanel"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="pt-6"
      >
        {current.content}
      </motion.div>
    </div>
  );
}
