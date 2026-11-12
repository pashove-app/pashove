import { createClient } from "@/lib/supabase/server";

export type CurrentPlan = {
  code: string;
  name: string;
  commissionBps: number;
  maxStores: number;
  maxMembers: number;
  priceAmount: number;
  currency: string;
  feeIncluded: boolean;
  startedAt: string | null;
  expiresAt: string | null;
};

/** Plan du compte connecté, avec sa date d'expiration. */
export async function getCurrentPlan(): Promise<CurrentPlan | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("current_plan");
  if (!data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;

  return {
    code: String(raw.code ?? "free"),
    name: String(raw.name ?? "Free"),
    commissionBps: Number(raw.commissionBps ?? 600),
    maxStores: Number(raw.maxStores ?? 2),
    maxMembers: Number(raw.maxMembers ?? 5),
    priceAmount: Number(raw.priceAmount ?? 0),
    currency: String(raw.currency ?? "XOF"),
    feeIncluded: raw.feeIncluded === true,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : null,
    expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : null,
  };
}
