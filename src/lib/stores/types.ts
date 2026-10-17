/**
 * État renvoyé par les Server Actions de la boutique.
 *
 * Même contrat que côté authentification : le serveur ne renvoie que des
 * **clés** de message (`fieldErrors`, `messageKey`), que le composant client
 * résout dans le dictionnaire de la langue affichée.
 */
export type StoreFormState = {
  status: "idle" | "invalid" | "error" | "unconfigured";
  /** Une clé de message par champ fautif (voir `onboarding.errors`). */
  fieldErrors?: Record<string, string>;
  /** Clé de message global, affichée dans le bandeau. */
  messageKey?: string;
};

/** Hors module `"use server"`, qui n'autorise que des fonctions async. */
export const INITIAL_STORE_FORM_STATE: StoreFormState = { status: "idle" };

/** État de l'écran de réglages : la sauvegarde réussie est un état, pas une redirection. */
export type StoreSettingsState = {
  status: "idle" | "invalid" | "error" | "unconfigured" | "saved";
  /** Une clé de message par champ fautif (voir `settings.errors`). */
  fieldErrors?: Record<string, string>;
  /** Clé de message global, affichée dans le bandeau. */
  messageKey?: string;
};

export const INITIAL_STORE_SETTINGS_STATE: StoreSettingsState = { status: "idle" };
