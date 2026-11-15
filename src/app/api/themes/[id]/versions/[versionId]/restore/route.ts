import { NextResponse } from "next/server";
import { editorContext, jsonError } from "@/lib/theme-editor/api";
import { restoreThemeVersion } from "@/lib/theme-editor/mutations";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, versionId } = await params;
  const result = await restoreThemeVersion(context.storeId, id, versionId);
  if (!result.ok) return jsonError(result);

  return NextResponse.json({ data: result.data });
}
