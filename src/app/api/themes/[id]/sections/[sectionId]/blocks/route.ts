import { NextResponse } from "next/server";
import {
  editorContext,
  jsonError,
  mutateThemeDocument,
  readJson,
} from "@/lib/theme-editor/api";
import { newBlock } from "@/lib/theme-editor/defaults";
import { getSectionSchema } from "@/lib/theme-editor/schema";
import { MAX_BLOCKS_PER_SECTION } from "@/lib/theme-editor/normalize";
import type { ThemeSectionInstance } from "@/lib/theme-editor/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, sectionId } = await params;
  const body = await readJson(request);
  const type = body.type;

  if (typeof type !== "string") {
    return NextResponse.json({ error: "invalid_block" }, { status: 422 });
  }

  const result = await mutateThemeDocument(context.storeId, id, (document) => {
    let found = false;

    const map = (section: ThemeSectionInstance) => {
      if (section.id !== sectionId) return section;
      found = true;
      const schema = getSectionSchema(section.type);
      if (!schema?.blocks?.allowed.includes(type)) return section;
      if (section.blocks.length >= Math.min(schema.blocks.limit, MAX_BLOCKS_PER_SECTION)) {
        return section;
      }
      return { ...section, blocks: [...section.blocks, newBlock(type)] };
    };

    const next = {
      ...document,
      header: document.header.map(map),
      footer: document.footer.map(map),
      templates: document.templates.map((template) => ({
        ...template,
        sections: template.sections.map(map),
      })),
    };

    return found ? next : null;
  });

  if (!result.ok) return jsonError(result);
  return NextResponse.json({ data: { added: true } }, { status: 201 });
}
