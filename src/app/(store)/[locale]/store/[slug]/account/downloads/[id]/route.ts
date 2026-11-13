import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/i18n/config";
import {
  customerEntitlements,
  getCustomerUser,
} from "@/lib/customer/queries";
import { watermarkBytes } from "@/lib/digital/watermark";
import { readObject, signDownload } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Au-delà, la réponse serverless dépasserait la limite Vercel. */
const WATERMARK_MAX_BYTES = 4_000_000;

type DownloadResult = {
  objectKey?: string;
  fileName?: string | null;
  contentType?: string | null;
  storeName?: string;
  orderNumber?: number;
  customerEmail?: string;
  remaining?: number;
};

function hash(value: string): string {
  return createHash("sha256")
    .update(`${process.env.DOWNLOAD_HASH_SALT ?? "pashove-download"}:${value}`)
    .digest("hex");
}

function safeFileName(value: string | null | undefined, fallback: string): string {
  const name = (value ?? fallback).replace(/[\r\n"\\/]/g, "_").slice(0, 120);
  return name || fallback;
}

/** Téléchargement protégé, filigrané et limité contre le partage. */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ locale: string; slug: string; id: string }>;
  },
) {
  const { locale, slug, id } = await params;
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;
  const base = isLocale(locale) ? `${origin}/${locale}/store/${slug}` : origin;

  const user = await getCustomerUser();
  if (!user) {
    return NextResponse.redirect(`${base}/account/login`);
  }

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.redirect(`${base}/account/downloads?error=unavailable`);
  }

  // Vérifie que le droit appartient bien à cette boutique.
  const entitlements = await customerEntitlements(slug);
  if (!entitlements.some((item) => item.id === id)) {
    return NextResponse.redirect(`${base}/account/downloads?error=unavailable`);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "";
  const userAgent = request.headers.get("user-agent") ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_download", {
    p_entitlement_id: id,
    p_ip_hash: ip ? hash(ip) : null,
    p_user_agent_hash: userAgent ? hash(userAgent) : null,
  });

  if (error) {
    const reason = error.message.includes("download_shared")
      ? "shared"
      : "unavailable";
    return NextResponse.redirect(
      `${base}/account/downloads?error=${reason}`,
    );
  }

  const result = data as DownloadResult | null;
  if (!result?.objectKey) {
    return NextResponse.redirect(`${base}/account/downloads?error=unavailable`);
  }

  const fallback = async () =>
    NextResponse.redirect(await signDownload(result.objectKey!, "digital_file", 900));

  const object = await readObject(result.objectKey, "digital_file");
  if (!object || object.bytes.byteLength > WATERMARK_MAX_BYTES) {
    return fallback();
  }

  const watermark = [
    result.storeName ?? "Pashove",
    result.customerEmail ?? "",
    result.orderNumber ? `commande #${result.orderNumber}` : "",
    new Date().toISOString().slice(0, 10),
  ]
    .filter(Boolean)
    .join(" · ");

  let body: Uint8Array | null = null;
  try {
    body = await watermarkBytes({
      bytes: object.bytes,
      contentType: result.contentType ?? object.contentType,
      text: watermark,
    });
  } catch (watermarkError) {
    console.error("[download] watermark failed", watermarkError);
  }

  if (!body) return fallback();

  const payload = body.buffer.slice(
    body.byteOffset,
    body.byteOffset + body.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(payload, {
    headers: {
      "Content-Type": result.contentType ?? object.contentType,
      "Content-Disposition": `attachment; filename="${safeFileName(
        result.fileName,
        "fichier",
      )}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
