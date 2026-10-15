/**
 * État renvoyé par les Server Actions d'authentification.
 *
 * Les erreurs circulent sous forme de **clés** (`fieldErrors`, `messageKey`),
 * jamais de texte : le serveur ne connaît pas la langue de l'utilisateur, c'est
 * le composant client qui résout la clé dans le dictionnaire actif.
 */
export type AuthState = {
  status:
    | "idle"
    | "invalid"
    | "error"
    | "check-email"
    | "reset-sent"
    | "enrolling"
    | "unconfigured";
  /** Une clé de message par champ fautif (voir `auth.errors`). */
  fieldErrors?: Record<string, string>;
  /** Clé de message global, affichée dans le bandeau. */
  messageKey?: string;
  /** Adresse à confirmer, pour l'écran « vérifie ta boîte mail ». */
  email?: string;
};

/** Hors module `"use server"`, qui n'autorise que des fonctions async. */
export const INITIAL_AUTH_STATE: AuthState = { status: "idle" };

/**
 * État de la configuration du second facteur.
 *
 * Le QR code est le SVG renvoyé par Supabase, et `secret` la clé à recopier à la
 * main quand la caméra n'est pas utilisable. Les deux ne sont produits qu'une
 * fois la session reconnue, et ne servent qu'à cet écran.
 */
export type TotpEnrollmentState = AuthState & {
  factorId?: string;
  qrCode?: string;
  secret?: string;
};

export const INITIAL_TOTP_ENROLLMENT_STATE: TotpEnrollmentState = { status: "idle" };
