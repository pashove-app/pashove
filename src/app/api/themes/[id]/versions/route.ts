import { NextResponse } from "next/server";
import { editorContext } from "@/lib/theme-editor/api";
import { getThemeVersions } from "@/lib/theme-editor/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const versions = await getThemeVersions(context.storeId, id);

  return NextResponse.json({
    data: versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
      authorName: version.authorName,
    })),
  });
}
