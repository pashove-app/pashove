import { NextResponse } from "next/server";
import {
  editorContext,
  jsonError,
  mutateThemeDocument,
  readJson,
} from "@/lib/theme-editor/api";
import type { ThemeSectionInstance } from "@/lib/theme-editor/types";

export const dynamic = "force-dynamic";

function updateSection(
  document: Parameters<Parameters<typeof mutateThemeDocument>[2]>[0],
  sectionId: string,
  update: (section: ThemeSectionInstance) => ThemeSectionInstance,
) {
  const map = (section: ThemeSectionInstance) =>
    section.id === sectionId ? update(section) : section;

  return {
    ...document,
    header: document.header.map(map),
    footer: document.footer.map(map),
    templates: document.templates.map((template) => ({
      ...template,
      sections: template.sections.map(map),
    })),
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, sectionId } = await params;
  const body = await readJson(request);

  const result = await mutateThemeDocument(context.storeId, id, (document) => {
    let found = false;
    const next = updateSection(document, sectionId, (section) => {
      found = true;
      return {
        ...section,
        name: typeof body.name === "string" ? body.name : section.name,
        visible: typeof body.visible === "boolean" ? body.visible : section.visible,
        settings:
          body.settings && typeof body.settings === "object"
            ? { ...section.settings, ...(body.settings as typeof section.settings) }
            : section.settings,
        blocks: Array.isArray(body.blocks)
          ? (body.blocks as ThemeSectionInstance["blocks"])
          : section.blocks,
      };
    });
    return found ? next : null;
  });

  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, sectionId } = await params;

  const result = await mutateThemeDocument(context.storeId, id, (document) => {
    const remove = (sections: ThemeSectionInstance[]) =>
      sections.filter((section) => section.id !== sectionId);

    return {
      ...document,
      header: remove(document.header),
      footer: remove(document.footer),
      templates: document.templates.map((template) => ({
        ...template,
        sections: remove(template.sections),
      })),
    };
  });

  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { deleted: true } });
}
