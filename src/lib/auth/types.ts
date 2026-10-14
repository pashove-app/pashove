/**
 * État renvoyé par les Server Actions d'authentification.
 *
 * Les erreurs circulent sous forme de **clés** (`fieldErrors`, `messageKey`),
 * jamais de texte : le serveur ne connaît pas la langue de l'utilisateur, c'est
 * le composant client qui résout la clé dans le dictionnaire actif.
 */
export type AuthState = {
  status: "idle" | "invalid" | "error" | "check-email" | "unconfigured";
  /** Une clé de message par champ fautif (voir `auth.errors`). */
  fieldErrors?: Record<string, string>;
  /** Clé de message global, affichée dans le bandeau. */
  messageKey?: string;
  /** Adresse à confirmer, pour l'écran « vérifie ta boîte mail ». */
  email?: string;
};

/** Hors module `"use server"`, qui n'autorise que des fonctions async. */
export const INITIAL_AUTH_STATE: AuthState = { status: "idle" };
