import { NextResponse } from "next/server";
import {
  editorContext,
  jsonError,
  mutateThemeDocument,
  readJson,
} from "@/lib/theme-editor/api";
import { newSection, sectionsForTemplateType } from "@/lib/theme-editor/defaults";
import { getSectionSchema } from "@/lib/theme-editor/schema";
import { MAX_SECTIONS_PER_TEMPLATE } from "@/lib/theme-editor/normalize";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, templateId } = await params;
  const body = await readJson(request);
  const type = body.type;

  if (typeof type !== "string" || !getSectionSchema(type)) {
    return NextResponse.json({ error: "invalid_section" }, { status: 422 });
  }

  const result = await mutateThemeDocument(context.storeId, id, (document) => {
    const template = document.templates.find((entry) => entry.id === templateId);
    if (!template) return null;
    if (!sectionsForTemplateType(template.type).includes(type)) return null;
    if (template.sections.length >= MAX_SECTIONS_PER_TEMPLATE) return null;

    return {
      ...document,
      templates: document.templates.map((entry) =>
        entry.id === templateId
          ? { ...entry, sections: [...entry.sections, newSection(type)] }
          : entry,
      ),
    };
  });

  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { added: true } }, { status: 201 });
}
