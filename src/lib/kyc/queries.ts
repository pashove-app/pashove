import { createClient } from "@/lib/supabase/server";
import type { KycStatus, KycSummary } from "@/lib/kyc/types";

type StatusRow = {
  status: KycStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  legal_name: string | null;
  document_last4: string | null;
};

const EMPTY: KycSummary = {
  status: "not_started",
  submittedAt: null,
  reviewedAt: null,
  rejectionReason: null,
  legalName: null,
  documentLast4: null,
};

export async function getKycStatus(storeId: string): Promise<KycSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("store_kyc_status", {
    p_store_id: storeId,
  });

  const row = (data as StatusRow[] | null)?.[0];
  if (error || !row) return EMPTY;

  return {
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    rejectionReason: row.rejection_reason,
    legalName: row.legal_name,
    documentLast4: row.document_last4,
  };
}

/** Le KYC autorise une demande de retrait. */
export function kycAllowsPayout(status: KycStatus): boolean {
  return (
    status === "submitted" ||
    status === "under_review" ||
    status === "approved"
  );
}
