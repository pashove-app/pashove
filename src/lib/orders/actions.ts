"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type OrderActionState = {
  status: "idle" | "saved" | "error";
  messageKey?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function messageKeyFor(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("invalid_transition")) return "errorInvalidTransition";
  if (message.includes("payment_not_pending")) return "errorPaymentNotPending";
  if (message.includes("cancel_not_allowed")) return "errorCancelNotAllowed";
  if (message.includes("refund_required")) return "errorRefundRequired";
  if (message.includes("tracking_too_long")) return "errorTrackingTooLong";
  if (message.includes("order_unavailable")) return "errorOrderNotFound";

  return "errorActionFailed";
}

function refresh() {
  revalidatePath("/", "layout");
}

/** Fait avancer la commande d'une seule étape, avec un suivi facultatif. */
export async function advanceOrderAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const orderId = field(formData, "orderId");
  const tracking = field(formData, "tracking");

  if (!orderId || !UUID_PATTERN.test(orderId)) {
    return { status: "error", messageKey: "errorOrderNotFound" };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", messageKey: "errorActionFailed" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_order_status", {
    p_order_id: orderId,
    p_tracking: tracking || null,
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  refresh();
  return { status: "saved", messageKey: "statusUpdated" };
}

/** Encaissement COD, idempotent. */
export async function markOrderPaidAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const orderId = field(formData, "orderId");

  if (!orderId || !UUID_PATTERN.test(orderId)) {
    return { status: "error", messageKey: "errorOrderNotFound" };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", messageKey: "errorActionFailed" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_order_paid", {
    p_order_id: orderId,
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  refresh();
  return { status: "saved", messageKey: "paymentCollected" };
}

/** Annulation avant expédition, avec restockage. */
export async function cancelOrderAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const orderId = field(formData, "orderId");

  if (!orderId || !UUID_PATTERN.test(orderId)) {
    return { status: "error", messageKey: "errorOrderNotFound" };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", messageKey: "errorActionFailed" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
    p_reason: null,
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  refresh();
  return { status: "saved", messageKey: "orderCancelled" };
}

/** Action rapide depuis la liste : avance d'une étape, sans suivi. */
export async function quickAdvanceAction(formData: FormData): Promise<void> {
  const orderId = field(formData, "orderId");
  if (!orderId || !UUID_PATTERN.test(orderId)) return;
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase.rpc("advance_order_status", {
    p_order_id: orderId,
    p_tracking: null,
  });

  refresh();
}
