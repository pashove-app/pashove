"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rafraîchit une page en attente de confirmation de paiement, sans rechargement
 * complet. La page de succès repasse alors en mode « payé » dès que le webhook
 * SasPay a écrit la capture.
 */
export function OrderStatusRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
