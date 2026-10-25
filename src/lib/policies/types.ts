export type StorePoliciesFormState = {
  status: "idle" | "invalid" | "saved" | "error" | "unconfigured";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

export const INITIAL_STORE_POLICIES_STATE: StorePoliciesFormState = {
  status: "idle",
};
