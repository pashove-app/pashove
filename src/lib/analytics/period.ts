/**
 * Fenêtres de reporting.
 *
 * L'appel à `Date.now()` est isolé ici : les composants serveur restent purs
 * du point de vue de la règle React, et la fenêtre est calculée une seule fois
 * par requête.
 */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
