"use client";

import { useEffect, useRef } from "react";

/**
 * Son court « cha-ching » synthétisé (Web Audio), joué quand la clé change.
 *
 * Les navigateurs bloquent l'audio avant une interaction : le contexte est
 * débloqué au premier clic ou touche. Si ce n'est pas possible, le composant
 * reste silencieux sans erreur.
 */
export function SoundAlert({
  triggerKey,
}: {
  triggerKey: string | number | null | undefined;
}) {
  const contextRef = useRef<AudioContext | null>(null);
  const previous = useRef(triggerKey);

  useEffect(() => {
    const unlock = () => {
      if (!contextRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (Ctor) contextRef.current = new Ctor();
      }
      if (contextRef.current?.state === "suspended") {
        void contextRef.current.resume();
      }
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (previous.current === triggerKey) return;

    const hadValue =
      previous.current !== null &&
      previous.current !== undefined &&
      previous.current !== "";
    previous.current = triggerKey;

    if (!hadValue) return;
    if (triggerKey === null || triggerKey === undefined || triggerKey === "") {
      return;
    }

    const context = contextRef.current;
    if (!context) return;

    const play = () => {
      const now = context.currentTime;
      [880, 1174.66].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + index * 0.12;

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.4);
      });
    };

    if (context.state === "suspended") {
      void context.resume().then(play).catch(() => undefined);
    } else {
      play();
    }
  }, [triggerKey]);

  return null;
}
