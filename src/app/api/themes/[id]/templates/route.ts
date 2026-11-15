import { NextResponse } from "next/server";
import {
  editorContext,
  jsonError,
  mutateThemeDocument,
  readJson,
} from "@/lib/theme-editor/api";
import {
  cloneTemplate,
  newTemplate,
  sectionsForTemplateType,
} from "@/lib/theme-editor/defaults";
import type { ThemeTemplateType } from "@/lib/theme-editor/types";
import { TEMPLATE_TYPES } from "@/lib/theme-editor/types";
import { MAX_TEMPLATES } from "@/lib/theme-editor/normalize";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(request);
  const type = body.type;
  if (typeof type !== "string" || !TEMPLATE_TYPES.includes(type as ThemeTemplateType)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 422 });
  }

  const name = typeof body.name === "string" ? body.name : "Nouveau modèle";
  const baseId = typeof body.baseId === "string" ? body.baseId : null;

  const result = await mutateThemeDocument(context.storeId, id, (document) => {
    if (document.templates.length >= MAX_TEMPLATES) return null;
    const base = baseId
      ? document.templates.find((template) => template.id === baseId) ?? null
      : document.templates.find((template) => template.type === type) ?? null;

    const created = base
      ? cloneTemplate(base, name)
      : newTemplate(type as ThemeTemplateType, name);
    created.type = type as ThemeTemplateType;

    return { ...document, templates: [...document.templates, created] };
  });

  if (!result.ok) return jsonError(result);

  const created = result.data.templates[result.data.templates.length - 1];
  return NextResponse.json({ data: created }, { status: 201 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const result = await mutateThemeDocument(context.storeId, id, (document) => document);
  if (!result.ok) return jsonError(result);

  return NextResponse.json({
    data: result.data.templates.map((template) => ({
      id: template.id,
      type: template.type,
      name: template.name,
      sections: template.sections.length,
      availableSections: sectionsForTemplateType(template.type),
    })),
  });
}
