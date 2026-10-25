"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { AdminActionState } from "@/lib/platform/types";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function messageFor(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("kyc_required")) {
    return "Le KYC du marchand doit être approuvé avant cette étape.";
  }
  if (message.includes("reference_required")) {
    return "Indique la référence du virement.";
  }
  if (message.includes("invalid_transition")) {
    return "Cette transition n'est pas autorisée.";
  }
  if (message.includes("invalid_decision")) {
    return "Décision invalide.";
  }
  if (message.includes("reason_required")) {
    return "Un motif est obligatoire pour un rejet.";
  }
  if (message.includes("not_allowed")) {
    return "Ton rôle ne permet pas cette action.";
  }
  if (message.includes("payout_not_found") || message.includes("kyc_not_found")) {
    return "Élément introuvable.";
  }

  return "L'action a échoué. Réessaie.";
}

export async function reviewKycAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const caseId = field(formData, "caseId");
  const decision = field(formData, "decision");
  const reason = field(formData, "reason");

  if (!isSupabaseConfigured() || !caseId) {
    return { status: "error", message: "Action impossible." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_kyc", {
    p_case_id: caseId,
    p_decision: decision,
    p_reason: reason || null,
  });

  if (error) return { status: "error", message: messageFor(error) };

  revalidatePath("/platform-admin", "layout");
  return { status: "saved", message: "Décision enregistrée." };
}

export async function transitionPayoutAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const payoutId = field(formData, "payoutId");
  const action = field(formData, "action");
  const reference = field(formData, "reference");
  const reason = field(formData, "reason");

  if (!isSupabaseConfigured() || !payoutId) {
    return { status: "error", message: "Action impossible." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_transition_payout", {
    p_payout_id: payoutId,
    p_action: action,
    p_reference: reference || null,
    p_reason: reason || null,
  });

  if (error) return { status: "error", message: messageFor(error) };

  revalidatePath("/platform-admin", "layout");
  return { status: "saved", message: "Retrait mis à jour." };
}
