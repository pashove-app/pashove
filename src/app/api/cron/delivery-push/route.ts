import { NextResponse } from "next/server";
import { drainDeliveryPush } from "@/lib/pwa/send";

export const dynamic = "force-dynamic";

/**
 * Drain manuel de la boîte d'envoi des notifications de course.
 *
 * Le chemin normal est immédiat : webhook de paiement, passage en ligne ou
 * refus d'une course appellent `drainDeliveryPush` via `after`. Cette route
 * sert de filet de sécurité et de diagnostic : elle renvoie le décompte exact
 * des offres examinées, envoyées, échouées et nettoyées.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const pushed = await drainDeliveryPush();

  return NextResponse.json({ ok: true, pushed });
}
