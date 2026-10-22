"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const EMPTY: string[] = [];
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string; ids: string[] }>();

function read(key: string): string[] {
  let raw = "";
  try {
    raw = window.localStorage.getItem(key) ?? "";
  } catch {
    return EMPTY;
  }

  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.ids;

  let ids: string[] = [];
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        ids = parsed.filter((value): value is string => typeof value === "string");
      }
    } catch {
      ids = [];
    }
  }

  cache.set(key, { raw, ids });
  return ids;
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("pashove_wishlist_")) {
      cache.delete(event.key);
      callback();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function toggle(key: string, productId: string) {
  const current = new Set(read(key));
  if (current.has(productId)) current.delete(productId);
  else current.add(productId);

  const ids = [...current];
  const raw = JSON.stringify(ids);

  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // Le favori reste actif pour la session même sans stockage.
  }

  cache.set(key, { raw, ids });
  for (const listener of listeners) listener();
}

const StoreIdContext = createContext<string | null>(null);

/** Porte l'identifiant de la boutique pour cloisonner les favoris. */
export function WishlistProvider({
  storeId,
  children,
}: {
  storeId: string;
  children: ReactNode;
}) {
  return (
    <StoreIdContext.Provider value={storeId}>
      {children}
    </StoreIdContext.Provider>
  );
}

/**
 * Favoris du visiteur, par boutique. Aucun compte pour l'instant : la liste
 * vit dans le navigateur et se synchronise entre onglets.
 */
export function useWishlist() {
  const storeId = useContext(StoreIdContext);
  const key = `pashove_wishlist_${storeId ?? "guest"}`;

  const ids = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );

  return {
    has: (productId: string) => ids.includes(productId),
    toggle: (productId: string) => toggle(key, productId),
  };
}
