"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { emailKycDecision, emailPayoutProcessed } from "@/lib/email/events";
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

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  completed: "payé",
  sent: "envoyé",
  processing: "en cours de traitement",
  failed: "échoué",
  reversed: "annulé",
  cancelled: "annulé",
};

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

  after(async () => {
    try {
      const { data } = await supabase
        .from("kyc_cases")
        .select("store_id, status, rejection_reason, stores(name)")
        .eq("id", caseId)
        .maybeSingle();

      const row = data as
        | {
            store_id: string;
            status: string;
            rejection_reason: string | null;
            stores: { name: string } | null;
          }
        | null;

      if (!row) return;

      await emailKycDecision({
        storeId: row.store_id,
        storeName: row.stores?.name ?? "Pashove",
        approved: row.status === "approved",
        reason: row.rejection_reason,
        locale: "fr",
      });
    } catch (notifyError) {
      console.error("[email] kyc notification failed", notifyError);
    }
  });

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

  after(async () => {
    try {
      const { data } = await supabase
        .from("payouts")
        .select(
          "store_id, amount, currency, status, provider_reference, failure_reason, stores(name)",
        )
        .eq("id", payoutId)
        .maybeSingle();

      const row = data as
        | {
            store_id: string;
            amount: number;
            currency: string;
            status: string;
            provider_reference: string | null;
            failure_reason: string | null;
            stores: { name: string } | null;
          }
        | null;

      if (!row) return;

      await emailPayoutProcessed({
        storeId: row.store_id,
        storeName: row.stores?.name ?? "Pashove",
        amount: row.amount,
        currency: row.currency,
        statusLabel: PAYOUT_STATUS_LABEL[row.status] ?? row.status,
        reference: row.provider_reference,
        reason: row.failure_reason,
        locale: "fr",
      });
    } catch (notifyError) {
      console.error("[email] payout notification failed", notifyError);
    }
  });

  revalidatePath("/platform-admin", "layout");
  return { status: "saved", message: "Retrait mis à jour." };
}
