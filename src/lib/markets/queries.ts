import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { PlatformMarket, StoreMarket } from "@/lib/markets/types";

function normalizeMarkets(value: unknown): PlatformMarket[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      code: String(entry.code ?? ""),
      countryCode: String(entry.countryCode ?? ""),
      countryName: String(entry.countryName ?? ""),
      currency: String(entry.currency ?? ""),
      isEnabled: entry.isEnabled !== false,
      note: typeof entry.note === "string" && entry.note ? entry.note : null,
    }))
    .filter((entry) => entry.code && entry.countryCode && entry.currency);
}

export async function getPlatformMarkets(): Promise<PlatformMarket[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("platform_markets");
  return normalizeMarkets(data);
}

export async function getStoreMarkets(storeId: string): Promise<PlatformMarket[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("store_markets", { p_store_id: storeId });
  return normalizeMarkets(data);
}

/** Marchés activés d'une boutique active, pour le checkout public. */
export const getPublicStoreMarkets = cache(
  async (slug: string): Promise<StoreMarket[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase.rpc("public_store_markets", { p_slug: slug });
    return normalizeMarkets(data).map((entry) => ({
      code: entry.code,
      countryCode: entry.countryCode,
      countryName: entry.countryName,
      currency: entry.currency,
    }));
  },
);
