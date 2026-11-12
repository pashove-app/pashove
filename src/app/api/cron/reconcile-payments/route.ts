import { NextResponse } from "next/server";
import { SasPayError, verifyPayment } from "@/lib/payments/saspay/client";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Réconciliation des paiements échoués localement.
 *
 * Un succès SasPay arrivé après une expiration ne doit jamais passer
 * inaperçu : on relit son statut réel et on crée une alerte pour l'équipe.
 * On ne recrédite pas automatiquement la commande (le stock a pu être
 * restauré et revendu) ; l'alerte permet un remboursement ou une décision
 * manuelle.
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

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: failedPayments, error } = await service
    .from("payments")
    .select("id, order_id, store_id, reference, amount, currency")
    .eq("provider", "saspay")
    .eq("status", "failed")
    .not("reference", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[reconcile] list failed payments", error.message);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }

  let alerts = 0;
  let errors = 0;

  for (const payment of failedPayments ?? []) {
    try {
      const remote = await verifyPayment(payment.reference as string);

      if (remote.status !== "SUCCESS") continue;

      const { error: insertError } = await service
        .from("payment_reconciliation_alerts")
        .upsert(
          {
            store_id: payment.store_id,
            order_id: payment.order_id,
            payment_id: payment.id,
            reference: payment.reference,
            kind: "late_success",
            amount: payment.amount,
            currency: payment.currency,
            details: {
              provider_status: remote.status,
              remote_amount: remote.requested_amount ?? null,
              remote_currency: remote.currency ?? null,
            },
          },
          { onConflict: "reference,kind", ignoreDuplicates: true },
        );

      if (insertError) {
        errors += 1;
        console.error("[reconcile] alert insert", insertError.message);
      } else {
        alerts += 1;
      }
    } catch (verifyError) {
      // Une référence inconnue (404) ou une panne réseau n'est pas une alerte
      // de succès tardif ; on réessaiera au prochain passage.
      if (
        !(verifyError instanceof SasPayError) ||
        verifyError.status !== 404
      ) {
        errors += 1;
      }
      console.error("[reconcile] verify failed", verifyError);
    }
  }

  return NextResponse.json({
    ok: true,
    checked: failedPayments?.length ?? 0,
    alerts,
    errors,
  });
}
