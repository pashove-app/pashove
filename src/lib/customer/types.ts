export type CustomerAuthState = {
  status: "idle" | "invalid" | "error" | "check-email";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
  email?: string;
};

export const INITIAL_CUSTOMER_AUTH: CustomerAuthState = { status: "idle" };
