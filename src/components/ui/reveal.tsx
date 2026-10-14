"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useInView } from "@/lib/hooks";

/**
 * Apparition douce au défilement.
 * `data-reveal` sert de crochet à la règle `<noscript>` du layout public,
 * qui force l'affichage complet quand JavaScript est désactivé.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "span";
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      style={{ transitionDelay: inView ? `${delay}ms` : undefined }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        inView
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
