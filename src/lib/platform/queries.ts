import { createClient } from "@/lib/supabase/server";

export type AdminKycCase = {
  id: string;
  store_id: string;
  status: string;
  legal_name: string;
  birth_date: string;
  country: string;
  document_type: string;
  document_last4: string;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  store: { name: string; slug: string } | null;
};

export type AdminKycDetail = AdminKycCase & {
  front: { object_key: string } | null;
  back: { object_key: string } | null;
  selfie: { object_key: string } | null;
};

const KYC_COLUMNS = [
  "id, store_id, status, legal_name, birth_date, country, document_type",
  "document_last4, submitted_at, reviewed_at, rejection_reason",
  "store:stores(name, slug)",
].join(", ");

const KYC_DETAIL_COLUMNS = [
  KYC_COLUMNS,
  "front:media_assets!front_media_id(object_key)",
  "back:media_assets!back_media_id(object_key)",
  "selfie:media_assets!selfie_media_id(object_key)",
].join(", ");

export async function listAdminKycCases(): Promise<AdminKycCase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kyc_cases")
    .select(KYC_COLUMNS)
    .order("submitted_at", { ascending: true });

  return (data ?? []) as unknown as AdminKycCase[];
}

export async function getAdminKycCase(
  id: string,
): Promise<AdminKycDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kyc_cases")
    .select(KYC_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  return (data as unknown as AdminKycDetail | null) ?? null;
}

export type AdminPayout = {
  id: string;
  store_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  account_name: string;
  account_last4: string;
  requested_at: string;
  reviewed_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  provider_reference: string | null;
  failure_reason: string | null;
  store: { name: string; slug: string } | null;
};

const PAYOUT_COLUMNS = [
  "id, store_id, amount, currency, status, provider, account_name, account_last4",
  "requested_at, reviewed_at, sent_at, completed_at, provider_reference, failure_reason",
  "store:stores(name, slug)",
].join(", ");

export async function listAdminPayouts(): Promise<AdminPayout[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payouts")
    .select(PAYOUT_COLUMNS)
    .order("requested_at", { ascending: true });

  return (data ?? []) as unknown as AdminPayout[];
}

export async function getAdminPayout(id: string): Promise<AdminPayout | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payouts")
    .select(PAYOUT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  return (data as unknown as AdminPayout | null) ?? null;
}

export type AdminCounts = {
  kycPending: number;
  payoutsPending: number;
  stores: number;
  auditActions: number;
};

export async function adminCounts(): Promise<AdminCounts> {
  const supabase = await createClient();

  const [kyc, payouts, stores, audit] = await Promise.all([
    supabase
      .from("kyc_cases")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "under_review"]),
    supabase
      .from("payouts")
      .select("id", { count: "exact", head: true })
      .in("status", ["requested", "security_check"]),
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase
      .from("platform_audit_log")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    kycPending: kyc.count ?? 0,
    payoutsPending: payouts.count ?? 0,
    stores: stores.count ?? 0,
    auditActions: audit.count ?? 0,
  };
}

export async function adminKycForStore(
  storeId: string,
): Promise<{ id: string; status: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kyc_cases")
    .select("id, status")
    .eq("store_id", storeId)
    .maybeSingle();

  return (data as { id: string; status: string } | null) ?? null;
}

export type ReconciliationRow = {
  store_id: string;
  store_name: string;
  store_slug: string;
  currency: string;
  available: number;
  pending: number;
  reserved: number;
  cod_cash: number;
  commission_due: number;
  fees: number;
  payouts: number;
};

export async function getReconciliation(): Promise<ReconciliationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_reconciliation");
  if (error || !data) return [];
  return data as ReconciliationRow[];
}

export type AuditEntry = {
  id: string;
  created_at: string;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
};

export async function listAudit(
  limit = 50,
  offset = 0,
): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_audit_feed", {
    p_limit: limit,
    p_offset: offset,
  });
  if (error || !data) return [];
  return data as AuditEntry[];
}
