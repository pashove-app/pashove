import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function hash(value: string): string {
  return createHash("sha256")
    .update(`${process.env.AFFILIATE_HASH_SALT ?? "pashove-affiliate"}:${value}`)
    .digest("hex");
}

/** Trace un clic d'affiliation, sans cookie ni donnée personnelle brute. */
export async function POST(request: Request) {
  let body: { ref?: unknown };
  try {
    body = (await request.json()) as { ref?: unknown };
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const ref = typeof body.ref === "string" ? body.ref.trim() : "";
  if (!/^[A-Za-z0-9]{6,16}$/.test(ref)) {
    return new NextResponse(null, { status: 204 });
  }

  const service = createServiceClient();
  if (!service) return new NextResponse(null, { status: 204 });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "";
  const userAgent = request.headers.get("user-agent") ?? "";

  await service.rpc("record_affiliate_click", {
    p_code: ref.toUpperCase(),
    p_ip_hash: ip ? hash(ip) : null,
    p_user_agent_hash: userAgent ? hash(userAgent) : null,
  });

  return new NextResponse(null, { status: 204 });
}
