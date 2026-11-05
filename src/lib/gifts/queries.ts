import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  GiftInfo,
  MerchantGift,
  ReceivedGift,
} from "./types";

export async function getGiftClaimInfo(
  token: string,
): Promise<GiftInfo | null> {
  const clean = token?.trim();
  if (!clean) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("gift_claim_info", {
    p_token: clean,
  });

  if (error || !data) return null;
  return data as GiftInfo;
}

export async function listSentGifts(storeId: string): Promise<MerchantGift[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("store_gift_claims", {
    p_store_id: storeId,
  });

  return (data ?? []) as MerchantGift[];
}

export async function listReceivedGifts(): Promise<ReceivedGift[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("received_gift_claims");
  return (data ?? []) as ReceivedGift[];
}

export type GiftBuyer = {
  email: string;
  name: string;
  orderNumber: number;
  storeName: string;
  storeSlug: string;
};

/**
 * Coordonnées de l'acheteur, lues avec le service role.
 *
 * Le jeton du cadeau est secret, mais il circule dans un e-mail : on ne veut
 * pas y joindre l'adresse de l'acheteur dans la réponse publique. Cette
 * lecture sert uniquement à prévenir l'acheteur que le cadeau a été réclamé.
 */
export async function getGiftBuyer(token: string): Promise<GiftBuyer | null> {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from("gift_claims")
    .select(
      "order_id, orders(customer_email, customer_name, number, stores(name, slug))",
    )
    .eq("token", token)
    .maybeSingle();

  const row = data as
    | {
        order_id: string;
        orders: {
          customer_email: string;
          customer_name: string;
          number: number;
          stores: { name: string; slug: string } | null;
        } | null;
      }
    | null;

  if (!row?.orders) return null;

  return {
    email: row.orders.customer_email,
    name: row.orders.customer_name,
    orderNumber: row.orders.number,
    storeName: row.orders.stores?.name ?? "Pashove",
    storeSlug: row.orders.stores?.slug ?? "",
  };
}

/** Marque paresseusement les cadeaux de plus de 90 jours comme expirés. */
export async function expireOldGiftClaims(): Promise<void> {
  const service = createServiceClient();
  if (!service) return;

  await service
    .from("gift_claims")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("status", "pending")
    .lt("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString());
}
