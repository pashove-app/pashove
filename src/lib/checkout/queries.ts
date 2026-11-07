import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import {
  normalizeCheckoutSettings,
  type CheckoutSettings,
} from "@/lib/checkout/settings";

/** Réglages publics du checkout d'une boutique active. */
export const getPublicCheckoutSettings = cache(
  async (slug: string): Promise<CheckoutSettings> => {
    const supabase = createPublicClient();
    const { data } = await supabase.rpc("public_checkout_settings", {
      p_slug: slug,
    });
    return normalizeCheckoutSettings(data);
  },
);

/** Réglages marchands, réservés aux membres de la boutique (RLS + RPC). */
export async function getStoreCheckoutSettings(
  storeId: string,
): Promise<CheckoutSettings> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("checkout_settings", {
    p_store_id: storeId,
  });
  return normalizeCheckoutSettings(data);
}
