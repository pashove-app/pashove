import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Downgrade quotidien des abonnements expirés.
 *
 * Le retour au Free réapplique la commission de 10 % et repasse en brouillon
 * les boutiques au-delà de la limite. Les données restent intactes.
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

  const { data, error } = await service.rpc("expire_account_plans");

  if (error) {
    console.error("[plans] expiry failed", error.message);
    return NextResponse.json({ error: "expiry_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...(data ?? {}) });
}
