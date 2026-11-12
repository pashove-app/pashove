"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/platform-admin/refunds";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Confirme un remboursement SasPay exécuté dans le tableau du prestataire.
 * L'écriture compensatoire du ledger est postée par la RPC.
 */
export async function completeRefundAction(formData: FormData): Promise<void> {
  const refundId = field(formData, "refundId");
  const reference = field(formData, "reference");

  if (!refundId) redirect(`${PATH}?error=invalid`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_saspay_refund", {
    p_refund_id: refundId,
    p_reference: reference || null,
  });

  if (error) {
    console.error("[refunds] complete failed", error.message);
    redirect(`${PATH}?error=save`);
  }

  revalidatePath(PATH);
  revalidatePath("/", "layout");
  redirect(`${PATH}?ok=1`);
}
