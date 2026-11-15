import { NextResponse } from "next/server";
import { editorContext, readJson } from "@/lib/theme-editor/api";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OWNERS = ["product", "collection", "page", "article", "shop"] as const;
const TYPES = ["text", "number", "boolean", "json", "url", "image"] as const;

export async function GET(request: Request) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const ownerType = url.searchParams.get("ownerType");
  const ownerId = url.searchParams.get("ownerId");

  const supabase = await createClient();
  let query = supabase
    .from("metafields")
    .select("id, owner_type, owner_id, namespace, key, value, type")
    .eq("store_id", context.storeId)
    .order("key", { ascending: true });

  if (ownerType && OWNERS.includes(ownerType as (typeof OWNERS)[number])) {
    query = query.eq("owner_type", ownerType);
  }
  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await readJson(request);
  const ownerType = body.ownerType;
  const ownerId = body.ownerId;
  const key = body.key;
  const namespace = typeof body.namespace === "string" ? body.namespace : "custom";
  const type = typeof body.type === "string" ? body.type : "text";

  if (
    !OWNERS.includes(ownerType as (typeof OWNERS)[number]) ||
    typeof ownerId !== "string" ||
    typeof key !== "string" ||
    !/^[a-z0-9_]{1,60}$/.test(key) ||
    !/^[a-z0-9_]{1,40}$/.test(namespace) ||
    !TYPES.includes(type as (typeof TYPES)[number])
  ) {
    return NextResponse.json({ error: "invalid_metafield" }, { status: 422 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metafields")
    .upsert(
      {
        store_id: context.storeId,
        owner_type: ownerType,
        owner_id: ownerId,
        namespace,
        key,
        value: body.value ?? null,
        type,
      },
      { onConflict: "store_id,owner_type,owner_id,namespace,key" },
    )
    .select("id, owner_type, owner_id, namespace, key, value, type")
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
