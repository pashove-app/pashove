"use server";

import { z } from "zod";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

export type StudioActionResult = {
  status: "ok" | "error" | "unavailable";
  message: string;
};

const promptSchema = z.string().trim().min(1).max(2000);
const videoSchema = z.object({
  actionType: z.string().trim().min(1).max(64),
  prompt: z.string().trim().max(2000).default(""),
});
const rechargeSchema = z.coerce
  .number()
  .int()
  .min(500, "Le montant minimum est de 500 FCFA.")
  .max(500000, "Le montant maximum est de 500 000 FCFA.");

async function activePrice(actionType: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_pricing")
    .select("action_type, price_fcfa")
    .eq("action_type", actionType)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

/**
 * Chat & textes.
 *
 * Le moteur DeepSeek sera branché à l'étape suivante. Tant qu'il ne l'est
 * pas, aucun crédit n'est débité : on préfère un message honnête à une
 * génération factice facturée.
 */
export async function sendStudioMessage(
  prompt: string,
): Promise<StudioActionResult> {
  const store = await currentStore();
  if (!store) {
    return { status: "error", message: "Boutique introuvable." };
  }

  const parsed = promptSchema.safeParse(prompt);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Écris un message entre 1 et 2 000 caractères.",
    };
  }

  const price = await activePrice("chat_message");
  if (!price) {
    return {
      status: "error",
      message: "Le Studio n'est pas encore activé pour cette boutique.",
    };
  }

  return {
    status: "unavailable",
    message: `Le moteur de génération sera connecté à l'étape suivante. Ton solde n'a pas été débité : un message coûtera ${price.price_fcfa} FCFA.`,
  };
}

/** Générateur vidéo. Le rendu TTS/Remotion arrive après l'intégration. */
export async function requestStudioVideo(input: {
  actionType: string;
  prompt: string;
}): Promise<StudioActionResult> {
  const store = await currentStore();
  if (!store) {
    return { status: "error", message: "Boutique introuvable." };
  }

  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Choisis un format de vidéo valide." };
  }

  if (!parsed.data.actionType.startsWith("video_")) {
    return { status: "error", message: "Choisis un format de vidéo valide." };
  }

  const price = await activePrice(parsed.data.actionType);
  if (!price) {
    return {
      status: "error",
      message: "Ce format de vidéo n'est plus disponible.",
    };
  }

  return {
    status: "unavailable",
    message: `Le générateur vidéo sera connecté à l'étape suivante. Aucun montant n'a été débité : cette vidéo coûtera ${price.price_fcfa} FCFA.`,
  };
}

/**
 * Recharge du portefeuille.
 *
 * L'écran est prêt ; le paiement SasPay et le crédit idempotent arrivent à
 * l'étape 4. On ne crée pas de recharge en attente tant que le paiement n'est
 * pas réellement initié.
 */
export async function requestStudioRecharge(
  amount: number,
): Promise<StudioActionResult> {
  const store = await currentStore();
  if (!store) {
    return { status: "error", message: "Boutique introuvable." };
  }

  const parsed = rechargeSchema.safeParse(amount);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Montant invalide.",
    };
  }

  return {
    status: "unavailable",
    message:
      "Le paiement Mobile Money sera activé à l'étape SasPay. Aucun montant n'a été débité.",
  };
}
