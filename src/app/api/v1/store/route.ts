import { NextResponse } from "next/server";
import { authenticateApiRequest, unauthorized } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth) return unauthorized();

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const { data, error } = await service
    .from("stores")
    .select("id, name, slug, description, country, currency, status, created_at")
    .eq("id", auth.storeId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ data });
}
