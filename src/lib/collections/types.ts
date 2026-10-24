export type CollectionFormState = {
  status: "idle" | "invalid" | "saved" | "error" | "unconfigured";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

export const INITIAL_COLLECTION_FORM_STATE: CollectionFormState = {
  status: "idle",
};
