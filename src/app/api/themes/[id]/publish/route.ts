import { NextResponse } from "next/server";
import { editorContext, jsonError } from "@/lib/theme-editor/api";
import { publishTheme } from "@/lib/theme-editor/mutations";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await publishTheme(context.storeId, id);
  if (!result.ok) return jsonError(result);

  return NextResponse.json({ data: { published: true } });
}
