"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Bandeau d'annonce. Les messages viennent des réglages réels de la boutique,
 * jamais d'une promesse inventée. Défilement désactivé si l'utilisateur
 * préfère moins de mouvement.
 */
export function AnnouncementBar({ messages }: { messages: string[] }) {
  const reduce = useReducedMotion();

  if (messages.length === 0) return null;

  if (reduce || messages.length === 1) {
    return (
      <div className="bg-fg text-bg">
        <p className="mx-auto flex h-8 max-w-7xl items-center justify-center px-5 text-center text-[0.625rem] font-medium uppercase tracking-[0.16em]">
          {messages.join("  ·  ")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-fg text-bg">
      <motion.div
        className="flex w-max items-center whitespace-nowrap py-2"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex items-center gap-12 pe-12"
          >
            {messages.map((message) => (
              <span
                key={message}
                className="text-[0.625rem] font-medium uppercase tracking-[0.16em]"
              >
                {message}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
