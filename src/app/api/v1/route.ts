import { NextResponse } from "next/server";
import { authenticateApiRequest, unauthorized } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/** Découverte de l'API v1. */
export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth) return unauthorized();

  return NextResponse.json({
    version: "v1",
    store_id: auth.storeId,
    endpoints: {
      store: "GET /api/v1/store",
      products: "GET /api/v1/products?limit=50",
      orders: "GET /api/v1/orders?status=paid&limit=50",
    },
  });
}
