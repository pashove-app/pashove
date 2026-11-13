"use client";

import { useEffect } from "react";

/** Enregistre une visite `?ref=CODE` sans bloquer l'affichage de la vitrine. */
export function AffiliateClickTracker() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref || !/^[A-Za-z0-9]{6,16}$/.test(ref)) return;

    void fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}
