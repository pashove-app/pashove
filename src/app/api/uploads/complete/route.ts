import { NextResponse } from "next/server";
import { inspectObject, isStorageConfigured } from "@/lib/r2/client";
import {
  isAllowedFileType,
  isAllowedImageType,
  isFileKind,
  isPrivateKind,
  maxBytesFor,
  parseObjectKey,
  publicUrl,
} from "@/lib/r2/media";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Enregistre un média après l'envoi.
 *
 * Rien n'est cru sur parole : la clé est relue, l'objet interrogé dans le bon
 * bucket, sa taille et son type comparés.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { key, width, height, fileName } = (body ?? {}) as {
    key?: unknown;
    width?: unknown;
    height?: unknown;
    fileName?: unknown;
  };

  const parsed = parseObjectKey(key);
  if (!parsed) {
    return NextResponse.json({ error: "bad_key" }, { status: 400 });
  }

  if (!isStorageConfigured(parsed.kind)) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = await currentStore();
  if (!store || store.id !== parsed.storeId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const object = await inspectObject(key as string, parsed.kind);
  if (!object) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const privateKind = isPrivateKind(parsed.kind);
  const fileKind = isFileKind(parsed.kind);

  const accepted = fileKind
    ? isAllowedFileType(object.contentType)
    : isAllowedImageType(object.contentType);

  if (!accepted) {
    return NextResponse.json({ error: "type_not_allowed" }, { status: 415 });
  }

  if (object.size <= 0 || object.size > maxBytesFor(parsed.kind)) {
    return NextResponse.json({ error: "size_not_allowed" }, { status: 413 });
  }

  const safeDimension = (value: unknown): number | null => {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    return rounded > 0 && rounded <= 20000 ? rounded : null;
  };

  const safeFileName =
    fileKind && typeof fileName === "string"
      ? fileName.replace(/[\\/]/g, "").trim().slice(0, 255) || null
      : null;

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      store_id: store.id,
      kind: parsed.kind,
      object_key: key as string,
      content_type: object.contentType,
      size_bytes: object.size,
      width: safeDimension(width),
      height: safeDimension(height),
      file_name: safeFileName,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    ...(privateKind
      ? { name: safeFileName }
      : { url: publicUrl(key as string) }),
  });
}
