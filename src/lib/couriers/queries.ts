import { createClient } from "@/lib/supabase/server";

export type CourierStatus = "pending" | "approved" | "rejected";

export type CourierProfile = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: CourierStatus;
  isOnline: boolean;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type AdminCourier = CourierProfile & {
  userId: string;
  idDocumentKey: string;
  selfieKey: string;
};

function normalize(value: unknown): CourierProfile | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const status = row.status;

  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    return null;
  }

  return {
    id: String(row.id ?? ""),
    fullName: String(row.fullName ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    status,
    isOnline: row.isOnline === true,
    rejectionReason:
      typeof row.rejectionReason === "string" ? row.rejectionReason : null,
    createdAt: String(row.createdAt ?? ""),
    reviewedAt: typeof row.reviewedAt === "string" ? row.reviewedAt : null,
  };
}

export async function getMyCourierProfile(): Promise<CourierProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_courier_profile");
  return normalize(data);
}

export async function adminCouriers(): Promise<AdminCourier[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_couriers");
  if (!Array.isArray(data)) return [];

  return (data as Record<string, unknown>[])
    .map((row) => {
      const profile = normalize(row);
      if (!profile) return null;
      return {
        ...profile,
        userId: String(row.userId ?? ""),
        idDocumentKey: String(row.idDocumentKey ?? ""),
        selfieKey: String(row.selfieKey ?? ""),
      } satisfies AdminCourier;
    })
    .filter((row): row is AdminCourier => row !== null);
}
