import { cookies } from "next/headers";
import { safeAppPath } from "@/lib/auth/redirects";

/**
 * Destination après confirmation d'e-mail.
 *
 * L'intention livreur est déjà dans les liens du parcours d'inscription. Ce
 * cookie couvre le cas où la personne ouvre directement l'écran de vérification
 * (lien mis en favori, retour plus tard) : sans lui, elle atterrirait dans
 * l'onboarding marchand.
 */
const COOKIE = "pashove_post_auth";
const MAX_AGE = 60 * 30;

export async function rememberPostAuth(path: string): Promise<void> {
  if (!safeAppPath(path)) return;

  const jar = await cookies();
  jar.set(COOKIE, path, {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
  });
}

export async function readPostAuth(): Promise<string | null> {
  const jar = await cookies();
  return safeAppPath(jar.get(COOKIE)?.value);
}

export async function clearPostAuth(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
