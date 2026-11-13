import { NextResponse } from "next/server";
import { authenticateApiRequest, unauthorized } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const LIMIT_DEFAULT = 50;
const LIMIT_MAX = 100;

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth) return unauthorized();

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), LIMIT_MAX)
    : LIMIT_DEFAULT;

  let query = service
    .from("products")
    .select(
      "id, name, slug, description, status, product_type, price_amount, stock_quantity, created_at, updated_at, variants:product_variants(id, sku, option_values, price_amount, stock_quantity, position)",
    )
    .eq("store_id", auth.storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const status = url.searchParams.get("status");
  if (status === "published" || status === "draft") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });

  return NextResponse.json({
    data: (data ?? []).map((row) => ({
      ...row,
      variants: [...(row.variants ?? [])].sort(
        (left, right) => (left.position ?? 0) - (right.position ?? 0),
      ),
    })),
    meta: { count: data?.length ?? 0, limit },
  });
}
