import { NextResponse } from "next/server";
import {
  SasPayError,
  verifyPayment,
  type SasPayPayment,
} from "@/lib/payments/saspay/client";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Expiration des paiements en ligne restés en attente.
 *
 * Toutes les dix minutes, on interroge SasPay avant de décider :
 *   * SUCCESS  -> confirmation (le webhook a pu être perdu) ;
 *   * FAILED   -> compensation (commande failed, stock restauré, panier rouvert) ;
 *   * PENDING  -> expiration + compensation après le délai.
 *
 * Les abonnements et les recharges Studio suivent la même règle.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "service_role_missing" },
      { status: 503 },
    );
  }

  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const counts = {
    orders: 0,
    plans: 0,
    studio: 0,
    legacy: 0,
    orphan: 0,
    errors: 0,
  };

  async function verified(reference: string) {
    try {
      return await verifyPayment(reference);
    } catch (error) {
      // Une référence inconnue chez SasPay est considérée comme échouée.
      if (error instanceof SasPayError && error.status === 404) return null;
      throw error;
    }
  }

  function amountOf(payment: SasPayPayment) {
    const amount = Number(payment.requested_amount);
    return Number.isFinite(amount) ? amount : null;
  }

  function currencyOf(payment: SasPayPayment) {
    return typeof payment.currency === "string" ? payment.currency : "";
  }

  // 1. Commandes en ligne.
  const { data: orderPayments } = await service
    .from("payments")
    .select("reference")
    .eq("provider", "saspay")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .not("reference", "is", null)
    .limit(100);

  for (const row of orderPayments ?? []) {
    const reference = row.reference as string;
    try {
      const payment = await verified(reference);

      if (payment?.status === "SUCCESS") {
        const amount = amountOf(payment);
        const currency = currencyOf(payment);

        if (amount !== null && currency) {
          await service.rpc("confirm_saspay_payment", {
            p_reference: reference,
            p_amount: amount,
            p_currency: currency,
            p_fee: Number(payment.fee ?? 0),
            p_net:
              Number.isFinite(Number(payment.net_amount))
                ? Number(payment.net_amount)
                : null,
          });
        }
      } else {
        await service.rpc("fail_saspay_payment", { p_reference: reference });
      }

      counts.orders += 1;
    } catch (error) {
      counts.errors += 1;
      console.error("[cron] expire order payment failed", error);
    }
  }

  // 2. Paiements de commande sans référence : la compensation retrouve la
  // commande par son identifiant.
  const { data: orphanPayments } = await service
    .from("payments")
    .select("order_id")
    .eq("provider", "saspay")
    .eq("status", "pending")
    .is("reference", null)
    .lt("created_at", cutoff)
    .limit(100);

  for (const row of orphanPayments ?? []) {
    try {
      const { data: order } = await service
        .from("orders")
        .select("public_token")
        .eq("id", row.order_id)
        .maybeSingle();

      if (order?.public_token) {
        await service.rpc("fail_online_order", {
          p_order_token: order.public_token,
          p_reason: "expired_without_reference",
        });
        counts.orphan += 1;
      }
    } catch (error) {
      counts.errors += 1;
      console.error("[cron] orphan payment failed", error);
    }
  }

  // 3. Abonnements.
  const { data: plans } = await service
    .from("plan_payments")
    .select("reference")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .not("reference", "is", null)
    .limit(100);

  for (const row of plans ?? []) {
    const reference = row.reference as string;
    try {
      const payment = await verified(reference);

      if (payment?.status === "SUCCESS") {
        const amount = amountOf(payment);
        const currency = currencyOf(payment);
        if (amount !== null && currency) {
          await service.rpc("confirm_plan_payment", {
            p_reference: reference,
            p_amount: amount,
            p_currency: currency,
          });
        }
      } else {
        await service.rpc("fail_plan_payment", { p_reference: reference });
      }

      counts.plans += 1;
    } catch (error) {
      counts.errors += 1;
      console.error("[cron] expire plan payment failed", error);
    }
  }

  // 4. Recharges Studio.
  const { data: topups } = await service
    .from("studio_topups")
    .select("provider_reference")
    .in("status", ["pending", "initiated"])
    .lt("created_at", cutoff)
    .not("provider_reference", "is", null)
    .limit(100);

  for (const row of topups ?? []) {
    const reference = row.provider_reference as string;
    try {
      const payment = await verified(reference);

      if (payment?.status === "SUCCESS") {
        const amount = amountOf(payment);
        const currency = currencyOf(payment);
        if (amount !== null && currency) {
          await service.rpc("confirm_studio_topup", {
            p_reference: reference,
            p_amount: amount,
            p_currency: currency,
          });
        }
      } else {
        await service.rpc("fail_studio_topup", { p_reference: reference });
      }

      counts.studio += 1;
    } catch (error) {
      counts.errors += 1;
      console.error("[cron] expire studio payment failed", error);
    }
  }

  // 5. Anciennes commandes failed dont le stock n'a jamais été rendu.
  const { data: legacyOrders } = await service
    .from("orders")
    .select("public_token")
    .eq("payment_status", "failed")
    .is("stock_restored_at", null)
    .lt("created_at", cutoff)
    .limit(100);

  for (const order of legacyOrders ?? []) {
    try {
      await service.rpc("fail_online_order", {
        p_order_token: order.public_token,
        p_reason: "expired_legacy",
      });
      counts.legacy += 1;
    } catch (error) {
      counts.errors += 1;
      console.error("[cron] legacy order compensation failed", error);
    }
  }

  return NextResponse.json({ ok: true, ...counts });
}
