"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { encryptSensitive } from "@/lib/finance/crypto";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PaymentActionResult = {
  ok: boolean;
  messageKey?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Remboursement COD ou en ligne, avec compensation ledger. */
export async function refundAdminPaymentAction(
  orderId: string,
): Promise<PaymentActionResult> {
  if (!UUID_PATTERN.test(orderId) || !isSupabaseConfigured()) {
    return { ok: false, messageKey: "paymentRefundFailed" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("refund_payment", {
    p_order_id: orderId,
    p_reason: null,
  });

  if (error) {
    return {
      ok: false,
      messageKey: error.message.includes("already")
        ? "paymentAlreadyRefunded"
        : "paymentRefundFailed",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Enregistre les clés d'un fournisseur, chiffrées AES-256-GCM. */
export async function savePaymentProviderAction(
  _previous: PaymentActionResult,
  formData: FormData,
): Promise<PaymentActionResult> {
  const code = field(formData, "code");
  const status = field(formData, "status");
  const mode = field(formData, "mode") || "test";
  const publicKey = field(formData, "publicKey");
  const secretKey = field(formData, "secretKey");
  const webhookSecret = field(formData, "webhookSecret");

  if (!["mock", "flutterwave", "cinetpay", "paydunya"].includes(code)) {
    return { ok: false, messageKey: "paymentProviderInvalid" };
  }

  if (!["active", "not_configured", "disabled"].includes(status)) {
    return { ok: false, messageKey: "paymentProviderInvalid" };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, messageKey: "paymentProviderUnavailable" };
  }

  let config: string | null = null;

  if (code !== "mock" && (publicKey || secretKey || webhookSecret)) {
    try {
      config = encryptSensitive(
        JSON.stringify({ publicKey, secretKey, webhookSecret }),
      );
    } catch {
      return { ok: false, messageKey: "paymentProviderEncryption" };
    }
  }

  if (code !== "mock" && status === "active" && !config) {
    return { ok: false, messageKey: "paymentProviderKeysRequired" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_payment_provider", {
    p_code: code,
    p_status: status,
    p_mode: mode,
    p_config_encrypted: config,
  });

  if (error) {
    return { ok: false, messageKey: "paymentProviderUnavailable" };
  }

  revalidatePath("/platform-admin/payment-providers");
  return { ok: true, messageKey: "paymentProviderSaved" };
}
