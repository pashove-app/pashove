import { NextResponse } from "next/server";
import { editorContext, jsonError, readJson } from "@/lib/theme-editor/api";
import { assignTemplate, unassignTemplate } from "@/lib/theme-editor/mutations";

export const dynamic = "force-dynamic";

type ResourceType = "product" | "collection" | "page" | "article";

function isResourceType(value: unknown): value is ResourceType {
  return (
    value === "product" ||
    value === "collection" ||
    value === "page" ||
    value === "article"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(request);

  if (
    typeof body.templateKey !== "string" ||
    !isResourceType(body.resourceType) ||
    typeof body.resourceId !== "string"
  ) {
    return NextResponse.json({ error: "invalid_assignment" }, { status: 422 });
  }

  const result = await assignTemplate(
    context.storeId,
    id,
    body.templateKey,
    body.resourceType,
    body.resourceId,
  );
  if (!result.ok) return jsonError(result);

  return NextResponse.json({ data: { assigned: true } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(request);

  if (!isResourceType(body.resourceType) || typeof body.resourceId !== "string") {
    return NextResponse.json({ error: "invalid_assignment" }, { status: 422 });
  }

  const result = await unassignTemplate(
    context.storeId,
    id,
    body.resourceType,
    body.resourceId,
  );
  if (!result.ok) return jsonError(result);

  return NextResponse.json({ data: { assigned: false } });
}
