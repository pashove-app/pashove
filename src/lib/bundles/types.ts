export type BundleFormState = {
  status: "idle" | "invalid" | "saved" | "error" | "unconfigured";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

export const INITIAL_BUNDLE_FORM_STATE: BundleFormState = { status: "idle" };
