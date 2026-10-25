export type InviteMemberState = {
  status: "idle" | "invalid" | "error" | "sent";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
  /** Chemin relatif ; le client ajoute l'origine du site. */
  invitePath?: string;
};

export const INITIAL_INVITE_STATE: InviteMemberState = { status: "idle" };
