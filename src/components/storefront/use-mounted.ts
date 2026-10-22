"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Vrai après l'hydratation uniquement. Permet de lire une préférence
 * navigateur sans faire diverger le HTML serveur.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
