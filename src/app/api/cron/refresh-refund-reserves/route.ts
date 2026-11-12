import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Recalcule la réserve de remboursement de chaque boutique.
 *
 * Réserve = 5 % du chiffre d'affaires payé sur les 30 derniers jours. Elle est
 * déduite du montant retirable, jamais du solde comptable du ledger.
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

  const { data, error } = await service.rpc("refresh_refund_reserves");

  if (error) {
    console.error("[cron] refresh_refund_reserves failed", error);
    return NextResponse.json({ error: "refresh_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}
