import { NextResponse } from "next/server";
import { inspectObject, isR2Configured } from "@/lib/r2/client";
import {
  isAllowedImageType,
  MAX_IMAGE_BYTES,
  parseObjectKey,
  publicUrl,
} from "@/lib/r2/media";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Enregistre un média après l'envoi.
 *
 * Rien n'est cru sur parole : la clé est relue, l'objet interrogé dans le
 * bucket, sa taille et son type comparés. Un client ne peut donc pas
 * enregistrer une ligne pour un fichier qui n'existe pas.
 */
export async function POST(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { key, width, height } = (body ?? {}) as {
    key?: unknown;
    width?: unknown;
    height?: unknown;
  };

  const parsed = parseObjectKey(key);
  if (!parsed) {
    return NextResponse.json({ error: "bad_key" }, { status: 400 });
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

  const object = await inspectObject(key as string);
  if (!object) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (object.size <= 0 || object.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "size_not_allowed" }, { status: 413 });
  }

  if (!isAllowedImageType(object.contentType)) {
    return NextResponse.json({ error: "type_not_allowed" }, { status: 415 });
  }

  const safeDimension = (value: unknown): number | null => {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    return rounded > 0 && rounded <= 20000 ? rounded : null;
  };

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
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    url: publicUrl(key as string),
  });
}
