import { cookies } from "next/headers";

const ORDER_COOKIE = "pashove_orders";
const MAX_ORDERS = 12;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mémorise le jeton public d'une commande dans le navigateur de l'acheteur.
 *
 * Le jeton ne sert qu'à rattacher l'achat au compte client lors de la prochaine
 * ouverture de l'espace client. Il est HttpOnly et ne donne aucun droit sans
 * session connectée.
 */
export async function rememberOrderToken(token: string): Promise<void> {
  if (!UUID_PATTERN.test(token)) return;

  const jar = await cookies();
  const current = jar.get(ORDER_COOKIE)?.value;
  const tokens = new Set<string>();

  if (current) {
    for (const value of current.split(".")) {
      if (UUID_PATTERN.test(value)) tokens.add(value);
    }
  }

  tokens.add(token);
  const kept = [...tokens].slice(-MAX_ORDERS);

  jar.set(ORDER_COOKIE, kept.join("."), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** Les jetons de commande laissés par les achats invités de ce navigateur. */
export async function rememberedOrderTokens(): Promise<string[]> {
  const raw = (await cookies()).get(ORDER_COOKIE)?.value;
  if (!raw) return [];

  return raw
    .split(".")
    .filter((value) => UUID_PATTERN.test(value))
    .slice(-MAX_ORDERS);
}
