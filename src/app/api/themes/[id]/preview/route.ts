import { NextResponse } from "next/server";
import { editorContext, jsonError, readJson } from "@/lib/theme-editor/api";
import { createPreviewLink } from "@/lib/theme-editor/mutations";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await editorContext();
  if (!context) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await createPreviewLink(context.storeId, id);
  if (!result.ok) return jsonError(result);

  const body = await readJson(request);
  const locale = typeof body.locale === "string" ? body.locale : "fr";
  const origin = new URL(request.url).origin;
  const pathname = `/${locale}/store/${context.storeSlug}/preview/${result.data.token}`;

  return NextResponse.json({
    data: {
      token: result.data.token,
      path: pathname,
      url: `${origin}${pathname}`,
      expiresInDays: 7,
    },
  });
}
