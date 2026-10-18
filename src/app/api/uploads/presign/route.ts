import { NextResponse } from "next/server";
import { isR2Configured, signUpload } from "@/lib/r2/client";
import {
  isAllowedImageType,
  isMediaKind,
  MAX_IMAGE_BYTES,
  publicUrl,
} from "@/lib/r2/media";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Prépare un envoi direct vers R2.
 *
 * Le navigateur repart avec une URL signée valable cinq minutes : le fichier
 * ne traverse jamais Next ni Vercel, ce qui évite la limite de corps de requête
 * et la double bande passante. La boutique vient de la session, jamais du
 * client.
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

  const { kind, contentType, size } = (body ?? {}) as {
    kind?: unknown;
    contentType?: unknown;
    size?: unknown;
  };

  if (!isMediaKind(kind)) {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }

  if (!isAllowedImageType(contentType)) {
    return NextResponse.json({ error: "type_not_allowed" }, { status: 415 });
  }

  if (
    typeof size !== "number" ||
    !Number.isInteger(size) ||
    size <= 0 ||
    size > MAX_IMAGE_BYTES
  ) {
    return NextResponse.json({ error: "size_not_allowed" }, { status: 413 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = await currentStore();
  if (!store) {
    return NextResponse.json({ error: "no_store" }, { status: 403 });
  }

  const signed = await signUpload({
    storeId: store.id,
    kind,
    contentType,
  });

  return NextResponse.json({
    ...signed,
    publicUrl: publicUrl(signed.key),
  });
}
