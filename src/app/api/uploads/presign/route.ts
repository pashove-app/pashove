import { NextResponse } from "next/server";
import { isStorageConfigured, signUpload } from "@/lib/r2/client";
import {
  isAllowedFileType,
  isAllowedImageType,
  isMediaKind,
  isPrivateKind,
  maxBytesFor,
  publicUrl,
} from "@/lib/r2/media";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Prépare un envoi direct vers R2.
 *
 * Images publiques et fichiers vendus suivent le même chemin, mais pas le
 * même bucket : le type d'objet décide, jamais le client.
 */
export async function POST(request: Request) {
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

  if (!isStorageConfigured(kind)) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // La validation directe (et non un booléen intermédiaire) permet au
  // compilateur de savoir que `contentType` est bien une chaîne ensuite.
  if (isPrivateKind(kind)) {
    if (!isAllowedFileType(contentType)) {
      return NextResponse.json({ error: "type_not_allowed" }, { status: 415 });
    }
  } else if (!isAllowedImageType(contentType)) {
    return NextResponse.json({ error: "type_not_allowed" }, { status: 415 });
  }

  if (
    typeof size !== "number" ||
    !Number.isInteger(size) ||
    size <= 0 ||
    size > maxBytesFor(kind)
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
    // Un fichier vendu n'a pas d'adresse publique.
    ...(isPrivateKind(kind) ? {} : { publicUrl: publicUrl(signed.key) }),
  });
}
