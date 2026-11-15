import { NextResponse } from "next/server";
import { editorContext, jsonError, readJson } from "@/lib/theme-editor/api";
import { toggleAppEmbed } from "@/lib/theme-editor/mutations";
import { loadEditorData } from "@/lib/theme-editor/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await loadEditorData(context.storeId);
  return NextResponse.json({
    data: { embeds: data.appEmbeds, blocks: data.appBlocks },
  });
}

export async function PUT(request: Request) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (typeof body.appId !== "string" || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "invalid_app" }, { status: 422 });
  }

  const name = typeof body.name === "string" ? body.name : body.appId;
  const result = await toggleAppEmbed(context.storeId, body.appId, name, body.enabled);
  if (!result.ok) return jsonError(result);

  return NextResponse.json({ data: { appId: body.appId, enabled: body.enabled } });
}
