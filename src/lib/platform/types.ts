export type AdminActionState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = { status: "idle" };
