export type KycFormState = {
  status: "idle" | "invalid" | "error" | "unconfigured";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

export const INITIAL_KYC_FORM_STATE: KycFormState = { status: "idle" };

export type KycStatus =
  | "not_started"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "resubmission_required"
  | "expired";

export type KycSummary = {
  status: KycStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  legalName: string | null;
  documentLast4: string | null;
};
