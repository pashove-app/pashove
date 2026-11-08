import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Libère les parts marchand arrivées à échéance (24 h après livraison ou
 * paiement). Les écritures sont idempotentes par commande.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "service_role_missing" }, { status: 503 });
  }

  const { data, error } = await service.rpc("release_matured_payouts");

  if (error) {
    console.error("[payout] release failed", error.message);
    return NextResponse.json({ error: "release_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...(data ?? {}) });
}
