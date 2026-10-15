import { cookies } from "next/headers";

/**
 * Adresse en attente de confirmation.
 *
 * Gardée dans un cookie plutôt que dans l'URL : une adresse e-mail n'a rien à
 * faire dans l'historique du navigateur ni dans les journaux du serveur. Elle
 * évite aussi de tout ressaisir quand l'utilisateur revient vérifier son compte
 * plus tard, et c'est elle qui alimente le renvoi de code.
 */
const COOKIE = "pashove_pending_email";

/** Une demi-heure : le temps de consulter sa boîte, pas plus. */
const MAX_AGE = 60 * 30;

export async function rememberPendingEmail(email: string): Promise<void> {
  const jar = await cookies();

  jar.set(COOKIE, email, {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
  });
}

export async function readPendingEmail(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

export async function clearPendingEmail(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
