import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Retour des liens envoyés par e-mail (confirmation d'inscription,
 * réinitialisation de mot de passe).
 *
 * Supabase redirige ici avec un `code` à échanger contre une session. Sans cet
 * échange, le clic sur le lien ne connecte personne.
 */

/** Types d'OTP acceptés en repli, quand le lien arrive sous forme de jeton. */
const OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

type OtpType = (typeof OTP_TYPES)[number];

/**
 * N'accepte qu'un chemin interne : pas de `//` (URL relative au protocole, donc
 * une redirection ouverte), pas de schéma, pas de remontée de dossier.
 */
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return /^\/[A-Za-z0-9\-._~/]*$/.test(value) && !value.includes("..") ? value : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "fr";

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;

  const search = new URL(request.url).searchParams;

  // Destination après ouverture de la session. Par défaut l'espace marchand ;
  // une réinitialisation de mot de passe demande explicitement sa propre page.
  const next = safeNext(search.get("next")) ?? `/${safeLocale}/app`;

  const code = search.get("code");
  const tokenHash = search.get("token_hash");
  const type = search.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${next}`);
  } else if (tokenHash && OTP_TYPES.includes(type as OtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as OtpType,
    });
    if (!error) return NextResponse.redirect(`${base}${next}`);
  }

  // Lien expiré, déjà utilisé, ou confirmation désactivée côté Supabase.
  // On renvoie tout de même vers `next` : la page visée sait dire ce qui s'est
  // passé (par exemple « lien expiré » sur la réinitialisation).
  return NextResponse.redirect(`${base}${next}`);
}
