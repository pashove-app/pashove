"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Rafraîchit l'espace livreur pour voir arriver les offres. */
export function CourierRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
