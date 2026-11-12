"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import {
  emailOrderCancelled,
  emailOrderDelivered,
  emailOrderRefunded,
  emailOrderShipped,
  formatAddress,
  type OrderEmailContext,
} from "@/lib/email/events";
import { getOrder } from "@/lib/orders/queries";
import { currentStore } from "@/lib/stores/queries";
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
  if (message.includes("refund_not_allowed")) return "errorRefundNotAllowed";
  if (message.includes("tracking_too_long")) return "errorTrackingTooLong";
  if (message.includes("order_unavailable")) return "errorOrderNotFound";

  return "errorActionFailed";
}

function refresh() {
  revalidatePath("/", "layout");
}

/** Contexte minimal pour un e-mail, lu avec la session du marchand. */
async function orderSnapshot(orderId: string): Promise<{
  status: string;
  context: OrderEmailContext;
} | null> {
  const store = await currentStore();
  if (!store) return null;

  const order = await getOrder(orderId, store.id);
  if (!order) return null;

  return {
    status: order.status,
    context: {
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      orderId: order.id,
      orderNumber: order.number,
      currency: order.currency,
      total: order.total_amount,
      subtotal: order.subtotal_amount,
      discount: order.discount_amount,
      shipping: order.shipping_amount,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      paymentMethod: order.payment_method,
      trackingNumber: order.tracking_number,
      address: formatAddress({
        address: order.shipping_address,
        city: order.shipping_city,
        country: order.shipping_country,
      }),
      items: order.items.map((item) => ({
        name: item.product_name,
        variantLabel: item.variant_label,
        quantity: item.quantity,
        lineTotal: item.line_total,
      })),
      hasDigital: order.items.some((item) => item.product_type === "digital"),
      hasService: order.items.some((item) => item.product_type === "service"),
    },
  };
}

/** Prévient le client quand la commande atteint une étape qui le concerne. */
async function notifyStatusChange(orderId: string): Promise<void> {
  try {
    const snapshot = await orderSnapshot(orderId);
    if (!snapshot) return;

    if (snapshot.status === "shipped") {
      after(async () => {
        await emailOrderShipped(snapshot.context, "fr");
      });
    } else if (snapshot.status === "delivered") {
      after(async () => {
        await emailOrderDelivered(snapshot.context, "fr");
      });
    }
  } catch (error) {
    console.error("[email] order status notification failed", error);
  }
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

  await notifyStatusChange(orderId);
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

  try {
    const snapshot = await orderSnapshot(orderId);
    if (snapshot) {
      after(async () => {
        await emailOrderCancelled(snapshot.context, "fr");
      });
    }
  } catch (notifyError) {
    console.error("[email] cancel notification failed", notifyError);
  }

  refresh();
  return { status: "saved", messageKey: "orderCancelled" };
}

/** Remboursement intégral d'une commande COD payée, par écritures compensatoires. */
export async function refundOrderAction(
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
  const { data, error } = await supabase.rpc("request_refund", {
    p_order_id: orderId,
    p_reason: null,
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  const outcome = data as { status?: string } | null;

  if (outcome?.status === "refunded") {
    try {
      const snapshot = await orderSnapshot(orderId);
      if (snapshot) {
        after(async () => {
          await emailOrderRefunded(snapshot.context, "fr");
        });
      }
    } catch (notifyError) {
      console.error("[email] refund notification failed", notifyError);
    }
  }

  refresh();
  return {
    status: "saved",
    messageKey:
      outcome?.status === "requested" ? "refundRequested" : "refundDone",
  };
}

/** Action rapide depuis la liste : avance d'une étape, sans suivi. */
export async function quickAdvanceAction(formData: FormData): Promise<void> {
  const orderId = field(formData, "orderId");
  if (!orderId || !UUID_PATTERN.test(orderId)) return;
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_order_status", {
    p_order_id: orderId,
    p_tracking: null,
  });

  if (!error) await notifyStatusChange(orderId);

  refresh();
}
