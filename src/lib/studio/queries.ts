import { createClient } from "@/lib/supabase/server";
import type {
  StudioBalance,
  StudioGeneration,
  StudioPrice,
  StudioSnapshot,
} from "@/lib/studio/types";

/**
 * Tout ce qu'affiche l'écran Studio pour une boutique.
 *
 * Les trois lectures sont indépendantes. Si la migration n'est pas encore
 * appliquée, on renvoie `ready: false` plutôt que de casser la page : le
 * marchand voit un écran d'activation clair au lieu d'une erreur.
 */
export async function getStudioSnapshot(
  storeId: string,
): Promise<StudioSnapshot> {
  const supabase = await createClient();

  const [balanceResult, pricingResult, generationsResult] = await Promise.all([
    supabase
      .from("store_studio_balance")
      .select("balance_fcfa, total_recharged, total_spent")
      .eq("store_id", storeId)
      .maybeSingle(),
    supabase
      .from("studio_pricing")
      .select("action_type, price_fcfa, label, description")
      .eq("is_active", true)
      .order("price_fcfa", { ascending: true }),
    supabase
      .from("studio_generations")
      .select(
        "id, action_type, prompt, price_paid_fcfa, status, result_text, video_url, created_at, completed_at",
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const ready = Boolean(
    !balanceResult.error &&
      !pricingResult.error &&
      !generationsResult.error,
  );

  const balance: StudioBalance = balanceResult.data
    ? {
        balanceFcfa: balanceResult.data.balance_fcfa,
        totalRecharged: balanceResult.data.total_recharged,
        totalSpent: balanceResult.data.total_spent,
      }
    : { balanceFcfa: 0, totalRecharged: 0, totalSpent: 0 };

  const prices: StudioPrice[] = (pricingResult.data ?? []).map((row) => ({
    actionType: row.action_type,
    priceFcfa: row.price_fcfa,
    label: row.label,
    description: row.description,
  }));

  const generations: StudioGeneration[] = (generationsResult.data ?? []).map(
    (row) => ({
      id: row.id,
      actionType: row.action_type,
      prompt: row.prompt,
      pricePaidFcfa: row.price_paid_fcfa,
      status: row.status,
      resultText: row.result_text,
      videoUrl: row.video_url,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }),
  );

  return { ready, balance, prices, generations };
}
