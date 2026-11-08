/**
 * Destination après authentification.
 *
 * Un `redirect` vient de l'URL : il ne doit jamais pouvoir envoyer quelqu'un
 * hors de Pashove. On n'accepte donc que des chemins connus, pas des chemins
 * arbitraires, même internes.
 */
export const COURIER_HOME = "/app/courier";

const ALLOWED = new Set(["/app", COURIER_HOME]);

export function safeAppPath(value: unknown): string | null {
  return typeof value === "string" && ALLOWED.has(value) ? value : null;
}

/** `?redirect=/app/courier` ou `?role=courier` désignent la même intention. */
export function courierIntent(values: {
  redirect?: string;
  role?: string;
}): boolean {
  return values.role === "courier" || safeAppPath(values.redirect) === COURIER_HOME;
}

/** Lien d'authentification qui conserve l'intention livreur. */
export function authLink(base: string, redirectTo?: string | null): string {
  return redirectTo ? `${base}?redirect=${encodeURIComponent(redirectTo)}` : base;
}
