"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1200),
  keys: z.object({
    p256dh: z.string().min(20).max(200),
    auth: z.string().min(8).max(100),
  }),
  userAgent: z.string().max(400).optional(),
});

export type PushActionResult = {
  ok: boolean;
  error?: "invalid" | "auth" | "server";
};

/**
 * Enregistre (ou déplace) l'abonnement push du navigateur courant.
 *
 * L'endpoint est unique : le même téléphone qui change de compte transfère son
 * abonnement au nouveau compte, plutôt que de continuer à recevoir les courses
 * du précédent.
 */
export async function savePushSubscriptionAction(
  input: unknown,
): Promise<PushActionResult> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "auth" };

  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.keys.p256dh,
    p_auth: parsed.data.keys.auth,
    p_user_agent: parsed.data.userAgent ?? null,
  });

  if (error) {
    console.error("[push] save failed", error.message);
    return { ok: false, error: "server" };
  }

  return { ok: true };
}

/** Retire l'abonnement du compte connecté, sans toucher à celui d'un autre. */
export async function deletePushSubscriptionAction(
  endpoint: string,
): Promise<PushActionResult> {
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "auth" };

  const { error } = await supabase.rpc("delete_push_subscription", {
    p_endpoint: endpoint,
  });

  if (error) {
    console.error("[push] delete failed", error.message);
    return { ok: false, error: "server" };
  }

  return { ok: true };
}
