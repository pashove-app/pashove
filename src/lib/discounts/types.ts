export type DiscountFormState = {
  status: "idle" | "invalid" | "error" | "unconfigured";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

export const INITIAL_DISCOUNT_FORM_STATE: DiscountFormState = { status: "idle" };
