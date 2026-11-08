import { createPublicClient } from "@/lib/supabase/public";
import {
  normalizeTracking,
  type TrackingData,
} from "@/lib/delivery/tracking-types";

export type {
  TrackingData,
  TrackingDelivery,
  TrackingLocation,
  TrackingOrder,
  TrackingPoint,
} from "@/lib/delivery/tracking-types";

export async function getPublicTracking(
  token: string,
): Promise<TrackingData | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("public_tracking", {
    p_token: token,
  });

  if (error) return null;
  return normalizeTracking(data);
}
