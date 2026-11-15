import { NextResponse } from "next/server";
import {
  editorContext,
  jsonError,
  mutateThemeDocument,
  readJson,
} from "@/lib/theme-editor/api";
import type { ThemeSectionInstance } from "@/lib/theme-editor/types";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; blockId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, blockId } = await params;
  const body = await readJson(request);

  const result = await mutateThemeDocument(context.storeId, id, (document) => {
    let found = false;
    const update = (section: ThemeSectionInstance) => ({
      ...section,
      blocks: section.blocks.map((block) => {
        if (block.id !== blockId) return block;
        found = true;
        return {
          ...block,
          visible:
            typeof body.visible === "boolean" ? body.visible : block.visible,
          settings:
            body.settings && typeof body.settings === "object"
              ? { ...block.settings, ...(body.settings as typeof block.settings) }
              : block.settings,
        };
      }),
    });

    const next = {
      ...document,
      header: document.header.map(update),
      footer: document.footer.map(update),
      templates: document.templates.map((template) => ({
        ...template,
        sections: template.sections.map(update),
      })),
    };

    return found ? next : null;
  });

  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; blockId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, blockId } = await params;

  const result = await mutateThemeDocument(context.storeId, id, (document) => {
    const remove = (section: ThemeSectionInstance) => ({
      ...section,
      blocks: section.blocks.filter((block) => block.id !== blockId),
    });

    return {
      ...document,
      header: document.header.map(remove),
      footer: document.footer.map(remove),
      templates: document.templates.map((template) => ({
        ...template,
        sections: template.sections.map(remove),
      })),
    };
  });

  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { deleted: true } });
}
