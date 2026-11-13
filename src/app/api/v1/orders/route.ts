import { NextResponse } from "next/server";
import { authenticateApiRequest, unauthorized } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth) return unauthorized();

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 100)
    : 50;

  const status = url.searchParams.get("status");
  let query = service
    .from("orders")
    .select(
      "id, number, status, payment_status, payment_method, total_amount, currency, customer_name, customer_phone, created_at, items:order_items(id, product_name, variant_label, quantity, unit_price, line_total, product_type)",
    )
    .eq("store_id", auth.storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && (STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });

  return NextResponse.json({
    data: data ?? [],
    meta: { count: data?.length ?? 0, limit },
  });
}
