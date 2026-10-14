import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Retour du lien de confirmation envoyé par e-mail.
 *
 * Supabase redirige ici avec un `code` à échanger contre une session. Sans cet
 * échange, le clic sur le lien ne connecte personne.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "fr";

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;

  const code = new URL(request.url).searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${base}/${safeLocale}/app`);
    }
  }

  // Lien expiré, déjà utilisé, ou confirmation désactivée côté Supabase.
  return NextResponse.redirect(`${base}/${safeLocale}/auth/login`);
}
