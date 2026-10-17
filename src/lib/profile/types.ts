/**
 * État renvoyé par la Server Action du profil.
 *
 * Même contrat que côté boutique : le serveur ne renvoie que des **clés** de
 * message, résolues dans le dictionnaire de la langue affichée.
 */
export type ProfileFormState = {
  status: "idle" | "invalid" | "error" | "unconfigured";
  /** Une clé de message par champ fautif (voir `onboarding.errors`). */
  fieldErrors?: Record<string, string>;
  /** Clé de message global, affichée dans le bandeau. */
  messageKey?: string;
};

/** Hors module `"use server"`, qui n'autorise que des fonctions async. */
export const INITIAL_PROFILE_FORM_STATE: ProfileFormState = { status: "idle" };
