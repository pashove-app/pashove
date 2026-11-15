import { NextResponse } from "next/server";
import { editorContext, jsonError, readJson } from "@/lib/theme-editor/api";
import { createTheme } from "@/lib/theme-editor/mutations";
import { loadEditorData } from "@/lib/theme-editor/queries";
import type { ThemePresetId } from "@/lib/theme-editor/defaults";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await loadEditorData(context.storeId);
  return NextResponse.json({
    data: data.themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      status: theme.status,
      isActive: theme.isActive,
      updatedAt: theme.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name : "Pashove Dawn";
  const preset = typeof body.preset === "string" ? body.preset : "dawn";

  const result = await createTheme(
    context.storeId,
    name,
    preset as ThemePresetId,
  );
  if (!result.ok) return jsonError(result);

  return NextResponse.json({ data: result.data }, { status: 201 });
}
