"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Vrai si l'utilisateur a demandé à réduire les animations (accessible + économe). */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/** Écoute une media query CSS et renvoie son état courant. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Vrai dès que l'élément entre dans le viewport (une seule fois). */
export function useInView<T extends HTMLElement>(rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      // Repli : on affiche à la frame suivante (asynchrone, sans rendu en cascade).
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin, threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView } as const;
}

/**
 * Fait défiler un index de 0 à `length - 1` en boucle.
 * Renvoie aussi le setter, pour les commandes manuelles (pastilles, onglets).
 */
export function useRotator(length: number, delay = 5000, active = true) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || length <= 1) return;

    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % length),
      delay,
    );
    return () => window.clearInterval(id);
  }, [length, delay, active]);

  return [index, setIndex] as const;
}

/** Effet machine à écrire : révèle `text` caractère par caractère. */
export function useTypewriter(text: string, active: boolean, speed = 38) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active || count >= text.length) return;

    const id = window.setTimeout(() => setCount((current) => current + 1), speed);
    return () => window.clearTimeout(id);
  }, [active, count, text.length, speed]);

  return { visible: text.slice(0, count), done: count >= text.length };
}

/**
 * Progression d'un élément dans la fenêtre, de 0 (il entre) à 1 (il sort).
 * Sert aux sections pilotées au défilement.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const next =
        travel <= 0 ? (rect.top < 0 ? 1 : 0) : Math.min(1, Math.max(0, -rect.top / travel));
      setProgress(next);
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
  }, []);

  return { ref, progress } as const;
}

/**
 * Déroule `timings` en boucle tant que `active` est vrai.
 * `timings` doit être une constante de module (référence stable).
 * Si les animations sont réduites, la dernière étape est affichée d'emblée.
 */
export function useStepLoop(
  timings: readonly number[],
  { active = true, reduced = false }: { active?: boolean; reduced?: boolean } = {},
) {
  const [tick, setTick] = useState(0);
  const lastStep = timings.length - 1;
  const step = reduced ? lastStep : tick;

  useEffect(() => {
    if (reduced || !active) return;

    const id = window.setTimeout(
      () => setTick((current) => (current + 1) % timings.length),
      timings[step],
    );
    return () => window.clearTimeout(id);
  }, [step, active, reduced, timings]);

  return step;
}
