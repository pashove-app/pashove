import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { drainDeliveryPush } from "@/lib/pwa/send";

export const dynamic = "force-dynamic";

/**
 * Filet de sécurité du dispatch.
 *
 * Une offre non répondue expire même si le livreur a fermé son navigateur, et
 * les courses en attente sont reproposées dès qu'un livreur est disponible.
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

  const expired = await service.rpc("expire_delivery_offers");
  const dispatched = await service.rpc("dispatch_waiting_deliveries");

  if (expired.error || dispatched.error) {
    console.error(
      "[delivery] cron failed",
      expired.error?.message,
      dispatched.error?.message,
    );
    return NextResponse.json({ error: "cron_failed" }, { status: 500 });
  }

  // Les expirations et le dispatch viennent d'écrire de nouvelles offres.
  const pushed = await drainDeliveryPush();

  return NextResponse.json({
    ok: true,
    expired: expired.data,
    dispatched: dispatched.data,
    pushed,
  });
}
