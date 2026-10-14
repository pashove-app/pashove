import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Rafraîchit le jeton de session sur la réponse du proxy.
 *
 * Indispensable : un Server Component ne peut pas écrire de cookie. Sans ce
 * passage, la session expirerait au bout d'une heure sans jamais se renouveler.
 * On ne bloque jamais la requête si Supabase n'est pas configuré.
 */
export async function refreshSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Déclenche le renouvellement si le jeton arrive à expiration.
  await supabase.auth.getUser();

  return response;
}
