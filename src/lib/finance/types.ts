export type PayoutMethodFormState = {
  status: "idle" | "invalid" | "error" | "unconfigured";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

export const INITIAL_PAYOUT_METHOD_STATE: PayoutMethodFormState = {
  status: "idle",
};

export type PayoutPinFormState = {
  status: "idle" | "invalid" | "saved" | "error" | "unconfigured";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

export const INITIAL_PAYOUT_PIN_STATE: PayoutPinFormState = { status: "idle" };

export type PayoutFormState = {
  status: "idle" | "invalid" | "error" | "unconfigured" | "saved";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

export const INITIAL_PAYOUT_FORM_STATE: PayoutFormState = { status: "idle" };
