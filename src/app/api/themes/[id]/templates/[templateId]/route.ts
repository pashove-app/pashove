import { NextResponse } from "next/server";
import {
  editorContext,
  jsonError,
  mutateThemeDocument,
  readJson,
} from "@/lib/theme-editor/api";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, templateId } = await params;
  const body = await readJson(request);

  const result = await mutateThemeDocument(context.storeId, id, (document) => ({
    ...document,
    templates: document.templates.map((template) =>
      template.id === templateId
        ? {
            ...template,
            name: typeof body.name === "string" ? body.name : template.name,
            sections: Array.isArray(body.sections)
              ? (body.sections as typeof template.sections)
              : template.sections,
          }
        : template,
    ),
  }));

  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, templateId } = await params;

  const result = await mutateThemeDocument(context.storeId, id, (document) => {
    const template = document.templates.find((entry) => entry.id === templateId);
    if (!template || template.type === "index") return null;
    return {
      ...document,
      templates: document.templates.filter((entry) => entry.id !== templateId),
    };
  });

  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { deleted: true } });
}
