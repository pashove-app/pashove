/** État partagé du formulaire d'ajout de domaine (module neutre). */
export type DomainActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_DOMAIN_STATE: DomainActionState = { status: "idle" };
