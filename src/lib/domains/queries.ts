import { createClient } from "@/lib/supabase/server";

export type DomainVerification = {
  type: string;
  domain: string;
  value: string;
  reason: string;
};

export type DomainDns = {
  ipv4: string[];
  cname: string[];
};

export type StoreDomain = {
  id: string;
  storeId: string;
  domain: string;
  apexName: string | null;
  status: "pending" | "verified" | "error";
  verification: DomainVerification[];
  dns: DomainDns | null;
  lastError: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
};

function normalizeDns(value: unknown): DomainDns | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const ipv4 = Array.isArray(row.ipv4)
    ? row.ipv4.filter((entry): entry is string => typeof entry === "string")
    : [];
  const cname = Array.isArray(row.cname)
    ? row.cname.filter((entry): entry is string => typeof entry === "string")
    : [];
  return ipv4.length > 0 || cname.length > 0 ? { ipv4, cname } : null;
}

function normalizeVerification(value: unknown): DomainVerification[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      type: String(entry.type ?? ""),
      domain: String(entry.domain ?? ""),
      value: String(entry.value ?? ""),
      reason: String(entry.reason ?? ""),
    }))
    .filter((entry) => entry.type && entry.domain && entry.value);
}

function normalize(value: unknown): StoreDomain | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  if (
    row.status !== "pending" &&
    row.status !== "verified" &&
    row.status !== "error"
  ) {
    return null;
  }

  return {
    id: String(row.id ?? ""),
    storeId: String(row.store_id ?? ""),
    domain: String(row.domain ?? ""),
    apexName: typeof row.apex_name === "string" ? row.apex_name : null,
    status: row.status,
    verification: normalizeVerification(row.verification),
    dns: normalizeDns(row.dns),
    lastError: typeof row.last_error === "string" ? row.last_error : null,
    lastCheckedAt:
      typeof row.last_checked_at === "string" ? row.last_checked_at : null,
    createdAt: String(row.created_at ?? ""),
  };
}

const COLUMNS =
  "id, store_id, domain, apex_name, status, verification, dns, last_error, last_checked_at, created_at";

/** Domaine personnalisé d'une boutique. La RLS ne laisse voir que les siens. */
export async function getStoreDomain(
  storeId: string,
): Promise<StoreDomain | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_domains")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .maybeSingle();

  // Migration pas encore appliquée : on affiche simplement « aucun domaine ».
  if (error) return null;

  return normalize(data);
}
