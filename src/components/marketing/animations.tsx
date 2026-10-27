"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/cn";

/** Apparition douce au scroll, désactivée si l'utilisateur préfère moins de mouvement. */
export function MarketingReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Parallaxe très légère du visuel de hero. */
export function MarketingParallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [32, -32]);

  return (
    <motion.div ref={ref} style={{ y: reduce ? 0 : y }}>
      {children}
    </motion.div>
  );
}

type CountValue = {
  value?: number;
  text?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/** Compteur animé quand le chiffre entre dans le viewport. */
export function AnimatedCount({
  value,
  text,
  prefix = "",
  suffix = "",
  className,
}: CountValue) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  const target = value ?? 0;

  useEffect(() => {
    const node = ref.current;
    if (!node || text || target === 0) return;

    let frame = 0;
    let started = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      frame = requestAnimationFrame(() => setDisplay(target));
      return () => cancelAnimationFrame(frame);
    }

    const run = () => {
      if (started) return;
      started = true;

      // Un onglet en arrière-plan ne reçoit pas de requestAnimationFrame :
      // on affiche directement la valeur finale pour ne jamais laisser un 0.
      if (document.visibilityState !== "visible") {
        setDisplay(target);
        return;
      }

      const start = performance.now();
      const duration = 1500;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(target * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    let interval = 0;

    const check = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.88 && rect.bottom > 0) {
        window.clearInterval(interval);
        run();
      }
    };

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    interval = window.setInterval(check, 400);
    check();

    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      window.clearInterval(interval);
      cancelAnimationFrame(frame);
    };
  }, [text, target]);

  if (text) {
    return (
      <span ref={ref} className={cn("tabular-nums", className)}>
        {text}
      </span>
    );
  }

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}
