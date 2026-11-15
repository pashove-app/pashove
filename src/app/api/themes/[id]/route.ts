import { NextResponse } from "next/server";
import {
  editorContext,
  jsonError,
  loadThemeDocument,
  readJson,
} from "@/lib/theme-editor/api";
import {
  deleteTheme,
  renameTheme,
  saveThemeDraft,
} from "@/lib/theme-editor/mutations";
import type { ThemeDocument } from "@/lib/theme-editor/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const theme = await loadThemeDocument(context.storeId, id);
  if (!theme) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ data: theme });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(request);

  if (typeof body.name === "string") {
    const renamed = await renameTheme(context.storeId, id, body.name);
    if (!renamed.ok) return jsonError(renamed);
  }

  if (body.document && typeof body.document === "object") {
    const saved = await saveThemeDraft(
      context.storeId,
      id,
      body.document as ThemeDocument,
      body.makeVersion === true,
    );
    if (!saved.ok) return jsonError(saved);
    return NextResponse.json({ data: saved.data });
  }

  return NextResponse.json({ data: { id } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await deleteTheme(context.storeId, id);
  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { deleted: true } });
}
