import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/i18n/config";
import {
  customerEntitlements,
  getCustomerUser,
} from "@/lib/customer/queries";
import { signDownload } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Téléchargement protégé : vérifie le droit, consomme un crédit, signe 15 min. */
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

  const supabase = await createClient();
  const { data } = await supabase.rpc("request_download", {
    p_entitlement_id: id,
  });

  const result = data as { objectKey?: string } | null;
  if (!result?.objectKey) {
    return NextResponse.redirect(`${base}/account/downloads?error=unavailable`);
  }

  const url = await signDownload(result.objectKey, "digital_file", 900);
  return NextResponse.redirect(url);
}
