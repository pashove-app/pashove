import { NextResponse } from "next/server";
import { editorContext } from "@/lib/theme-editor/api";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase
    .from("metafields")
    .delete()
    .eq("id", id)
    .eq("store_id", context.storeId);

  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  return NextResponse.json({ data: { deleted: true } });
}
