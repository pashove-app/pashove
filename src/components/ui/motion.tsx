"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useInView, usePrefersReducedMotion } from "@/lib/hooks";

/* ------------------------------------------------------------------ *
 *  Effets de défilement
 *  Les mutations DOM vivent dans des fonctions de module : les définir
 *  dans le corps du composant déclenche la règle react-hooks/immutability.
 * ------------------------------------------------------------------ */

function setShown(node: HTMLElement | null, shown: boolean) {
  node?.setAttribute("data-shown", shown ? "true" : "false");
}

function setParallax(node: HTMLElement, speed: number) {
  const rect = node.getBoundingClientRect();
  const progress =
    (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
  node.style.setProperty("--parallax-y", `${(-progress * speed * 100).toFixed(2)}px`);
}

/**
 * Titre révélé ligne par ligne, chaque ligne se levant derrière un masque.
 * Passer les lignes explicitement (le découpage automatique casse le SEO
 * et les langues à écriture liée comme l'arabe).
 */
export function RevealLines({
  lines,
  as: Tag = "h2",
  className,
  lineClassName,
  delay = 0,
}: {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  lineClassName?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLElement>("0px 0px -8% 0px");

  useEffect(() => {
    setShown(ref.current, inView);
  }, [inView, ref]);

  return (
    <Tag ref={ref as never} data-shown="false" className={className}>
      {lines.map((line, index) => (
        <span key={index} className={cn("reveal-line", lineClassName)}>
          <span style={{ transitionDelay: inView ? `${delay + index * 90}ms` : undefined }}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** Enfants révélés en cascade à l'entrée dans le viewport. */
export function Stagger({
  children,
  className,
  step = 70,
  as: Tag = "div",
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
  as?: ElementType;
}) {
  const { ref, inView } = useInView<HTMLElement>("0px 0px -8% 0px");

  useEffect(() => {
    setShown(ref.current, inView);
  }, [inView, ref]);

  return (
    <Tag ref={ref as never} data-shown="false" className={cn("stagger", className)}>
      {children.map((child, index) => (
        <div key={index} style={{ transitionDelay: inView ? `${index * step}ms` : undefined }}>
          {child}
        </div>
      ))}
    </Tag>
  );
}

/** Décalage vertical lié au défilement — mouvement léger, jamais décoratif gratuit. */
export function Parallax({
  children,
  className,
  speed = 14,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      setParallax(node, speed);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, speed]);

  return (
    <div
      ref={ref}
      className={cn(
        "motion-reduce:transform-none",
        "[transform:translate3d(0,var(--parallax-y,0px),0)] will-change-transform",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Trait horizontal qui se dessine à l'entrée dans le viewport. */
export function DrawLine({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>("0px 0px -8% 0px");

  useEffect(() => {
    setShown(ref.current, inView);
  }, [inView, ref]);

  return (
    <span
      ref={ref}
      data-shown="false"
      aria-hidden="true"
      className={cn("block h-px w-full bg-border", className)}
    >
      <span className="draw-line block h-px w-full bg-gradient-to-r from-brand-500 to-transparent" />
    </span>
  );
}
